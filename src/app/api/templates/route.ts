import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission, type Role } from '@/lib/permissions'
import { validateTemplate } from '@/lib/template-variables'
import { DEFAULT_CONTRACT_TEMPLATE, DEFAULT_RECEIPT_TEMPLATE } from '@/lib/default-templates'

// GET - Buscar templates do tenant
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Qualquer usuário autenticado pode ver os templates
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: {
        contractTemplate: true,
        receiptTemplate: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      contractTemplate: tenant.contractTemplate || DEFAULT_CONTRACT_TEMPLATE,
      receiptTemplate: tenant.receiptTemplate || DEFAULT_RECEIPT_TEMPLATE,
      // Indica se está usando template customizado ou padrão
      isContractCustom: !!tenant.contractTemplate,
      isReceiptCustom: !!tenant.receiptTemplate,
    })
  } catch (error) {
    console.error('Erro ao buscar templates:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar templates', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// PUT - Atualizar templates
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Apenas admins podem editar templates
    if (!hasPermission(session.user.role as Role, 'MANAGE_INTEGRATIONS')) {
      return NextResponse.json({ error: 'Sem permissão para editar templates' }, { status: 403 })
    }

    const body = await request.json()
    const { contractTemplate, receiptTemplate, resetContract, resetReceipt } = body

    // Validar templates se fornecidos
    if (contractTemplate) {
      const validation = validateTemplate(contractTemplate)
      if (!validation.valid) {
        return NextResponse.json(
          { error: `Variáveis inválidas no template de contrato: ${validation.invalidVars.join(', ')}` },
          { status: 400 }
        )
      }
    }

    if (receiptTemplate) {
      const validation = validateTemplate(receiptTemplate)
      if (!validation.valid) {
        return NextResponse.json(
          { error: `Variáveis inválidas no template de recibo: ${validation.invalidVars.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Preparar dados para atualização
    const updateData: Record<string, string | null> = {}

    if (resetContract) {
      updateData.contractTemplate = null
    } else if (contractTemplate !== undefined) {
      updateData.contractTemplate = contractTemplate || null
    }

    if (resetReceipt) {
      updateData.receiptTemplate = null
    } else if (receiptTemplate !== undefined) {
      updateData.receiptTemplate = receiptTemplate || null
    }

    // Atualizar tenant
    await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: updateData,
    })

    // Log de atividade
    await prisma.activityLog.create({
      data: {
        action: 'UPDATE',
        entity: 'TEMPLATE',
        entityId: session.user.tenantId,
        description: 'Templates de documentos atualizados',
        metadata: {
          contractUpdated: contractTemplate !== undefined || resetContract,
          receiptUpdated: receiptTemplate !== undefined || resetReceipt,
          contractReset: resetContract,
          receiptReset: resetReceipt,
        },
        userId: session.user.id,
        tenantId: session.user.tenantId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar templates:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar templates', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
