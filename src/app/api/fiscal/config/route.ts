import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission, type Role } from '@/lib/permissions'
import {
  encryptToken,
  decryptToken,
  validateCNPJ,
  onlyNumbers,
  validateTemplate,
  DEFAULT_DESCRIPTION_TEMPLATE,
} from '@/lib/fiscal'

// GET - Buscar configuração fiscal do tenant
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role as Role, 'MANAGE_INTEGRATIONS')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: {
        cnpj: true,
        inscricaoEstadual: true,
        inscricaoMunicipal: true,
        regimeTributario: true,
        codigoMunicipio: true,
        nfseEnabled: true,
        nfeEnabled: true,
        fiscalConfig: {
          select: {
            id: true,
            focusNfeEnvironment: true,
            nfseSerie: true,
            nfseProximoNumero: true,
            codigoServico: true,
            codigoTributarioMunicipal: true,
            aliquotaIss: true,
            issRetido: true,
            descricaoTemplate: true,
            // NF-e config
            certificadoValidade: true,
            nfeSerie: true,
            nfeProximoNumero: true,
            cfopRemessaDentroEstado: true,
            cfopRemessaForaEstado: true,
            cfopRetornoDentroEstado: true,
            cfopRetornoForaEstado: true,
            icmsCstPadrao: true,
            icmsOrigemPadrao: true,
            // Não retornamos o token nem certificado por segurança
          },
        },
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })
    }

    // Verificar validade do certificado
    const certificadoValido = tenant.fiscalConfig?.certificadoValidade
      ? new Date(tenant.fiscalConfig.certificadoValidade) > new Date()
      : false

    return NextResponse.json({
      // Dados fiscais do tenant
      cnpj: tenant.cnpj,
      inscricaoEstadual: tenant.inscricaoEstadual,
      inscricaoMunicipal: tenant.inscricaoMunicipal,
      regimeTributario: tenant.regimeTributario,
      codigoMunicipio: tenant.codigoMunicipio,
      nfseEnabled: tenant.nfseEnabled,
      nfeEnabled: tenant.nfeEnabled,

      // Configuração Focus NFe
      focusNfeConfigured: !!tenant.fiscalConfig,
      focusNfeEnvironment: tenant.fiscalConfig?.focusNfeEnvironment || 'HOMOLOGACAO',

      // Configuração NFS-e
      nfseSerie: tenant.fiscalConfig?.nfseSerie || '1',
      nfseProximoNumero: tenant.fiscalConfig?.nfseProximoNumero || 1,
      codigoServico: tenant.fiscalConfig?.codigoServico,
      codigoTributarioMunicipal: tenant.fiscalConfig?.codigoTributarioMunicipal,
      aliquotaIss: tenant.fiscalConfig?.aliquotaIss || 0,
      issRetido: tenant.fiscalConfig?.issRetido || false,

      // Template
      descricaoTemplate: tenant.fiscalConfig?.descricaoTemplate || DEFAULT_DESCRIPTION_TEMPLATE,

      // Configuração NF-e
      certificadoValido,
      certificadoValidade: tenant.fiscalConfig?.certificadoValidade,
      nfeSerie: tenant.fiscalConfig?.nfeSerie || '1',
      nfeProximoNumero: tenant.fiscalConfig?.nfeProximoNumero || 1,
      cfopRemessaDentroEstado: tenant.fiscalConfig?.cfopRemessaDentroEstado || '5949',
      cfopRemessaForaEstado: tenant.fiscalConfig?.cfopRemessaForaEstado || '6949',
      cfopRetornoDentroEstado: tenant.fiscalConfig?.cfopRetornoDentroEstado || '1949',
      cfopRetornoForaEstado: tenant.fiscalConfig?.cfopRetornoForaEstado || '2949',
      icmsCstPadrao: tenant.fiscalConfig?.icmsCstPadrao || '41',
      icmsOrigemPadrao: tenant.fiscalConfig?.icmsOrigemPadrao || '0',
    })
  } catch (error) {
    console.error('Erro ao buscar configuração fiscal:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar configuração fiscal', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// PUT - Atualizar configuração fiscal
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role as Role, 'MANAGE_INTEGRATIONS')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()

    const {
      cnpj,
      inscricaoEstadual,
      inscricaoMunicipal,
      regimeTributario,
      codigoMunicipio,
      focusNfeToken, // Token novo (se fornecido, será criptografado)
      focusNfeEnvironment,
      nfseSerie,
      codigoServico,
      codigoTributarioMunicipal,
      aliquotaIss,
      issRetido,
      descricaoTemplate,
    } = body

    // Validações
    if (cnpj && !validateCNPJ(cnpj)) {
      return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 })
    }

    if (descricaoTemplate) {
      const invalidVars = validateTemplate(descricaoTemplate)
      if (invalidVars.length > 0) {
        return NextResponse.json(
          { error: `Variáveis inválidas no template: ${invalidVars.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Atualizar dados fiscais do tenant
    await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: {
        cnpj: cnpj ? onlyNumbers(cnpj) : undefined,
        inscricaoEstadual: inscricaoEstadual || undefined,
        inscricaoMunicipal: inscricaoMunicipal || undefined,
        regimeTributario: regimeTributario || undefined,
        codigoMunicipio: codigoMunicipio || undefined,
      },
    })

    // Preparar dados da configuração fiscal
    const fiscalConfigData: Record<string, unknown> = {}

    if (focusNfeEnvironment) {
      fiscalConfigData.focusNfeEnvironment = focusNfeEnvironment
    }

    if (focusNfeToken) {
      // Criptografar o token antes de salvar
      fiscalConfigData.focusNfeToken = encryptToken(focusNfeToken)
    }

    if (nfseSerie !== undefined) {
      fiscalConfigData.nfseSerie = nfseSerie
    }

    if (codigoServico !== undefined) {
      fiscalConfigData.codigoServico = codigoServico || null
    }

    if (codigoTributarioMunicipal !== undefined) {
      fiscalConfigData.codigoTributarioMunicipal = codigoTributarioMunicipal || null
    }

    if (aliquotaIss !== undefined) {
      fiscalConfigData.aliquotaIss = parseFloat(aliquotaIss) || 0
    }

    if (issRetido !== undefined) {
      fiscalConfigData.issRetido = !!issRetido
    }

    if (descricaoTemplate !== undefined) {
      fiscalConfigData.descricaoTemplate = descricaoTemplate || null
    }

    // Upsert da configuração fiscal
    if (Object.keys(fiscalConfigData).length > 0) {
      await prisma.tenantFiscalConfig.upsert({
        where: { tenantId: session.user.tenantId },
        create: {
          tenantId: session.user.tenantId,
          ...fiscalConfigData,
        },
        update: fiscalConfigData,
      })
    }

    // Log de atividade
    await prisma.activityLog.create({
      data: {
        action: 'UPDATE',
        entity: 'FISCAL_CONFIG',
        entityId: session.user.tenantId,
        description: 'Configuração fiscal atualizada',
        metadata: {
          fields: Object.keys(body),
        },
        userId: session.user.id,
        tenantId: session.user.tenantId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar configuração fiscal:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar configuração fiscal', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
