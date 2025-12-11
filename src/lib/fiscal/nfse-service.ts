// Serviço de NFS-e - Lógica de negócio para emissão de notas fiscais

import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import { FocusNfeClient, createFocusNfeClient } from './focus-nfe-client'
import { decryptToken } from './encryption'
import { requireNfseEnabled, requireFiscalConfig } from './feature-check'
import {
  FiscalConfigurationError,
  InvoiceNotFoundError,
  InvoiceStatusError,
  TomadorDataError,
  FocusNfeApiError,
} from './errors'
import {
  processTemplate,
  formatCurrency,
  formatDate,
  calculateDays,
  formatItemsList,
  DEFAULT_DESCRIPTION_TEMPLATE,
} from './template-engine'
import { onlyNumbers, validateCpfCnpj } from './validators'
import type {
  InvoiceStatus,
  FocusNfeEnvironment,
  NfsePayload,
  TemplateVariables,
  CreateInvoiceResult,
} from './types'

/**
 * Serviço para gerenciamento de NFS-e
 */
export class NfseService {
  /**
   * Gera uma NFS-e a partir de uma reserva
   */
  async createFromBooking(
    bookingId: string,
    tenantId: string,
    options: { sendEmail?: boolean } = {}
  ): Promise<CreateInvoiceResult> {
    // 1. Verificar pré-requisitos
    await requireNfseEnabled(tenantId)
    await requireFiscalConfig(tenantId)

    // 2. Buscar dados necessários
    const [booking, tenant] = await Promise.all([
      this.getBookingData(bookingId, tenantId),
      this.getTenantFiscalData(tenantId),
    ])

    if (!booking) {
      throw new InvoiceNotFoundError(bookingId)
    }

    console.log('[NFS-e] Dados da reserva:', {
      bookingId: booking.id,
      customerName: booking.customer.name,
      customerCpfCnpj: booking.customer.cpfCnpj,
      itemsCount: booking.items.length,
    })

    console.log('[NFS-e] Dados fiscais do tenant:', {
      cnpj: tenant.cnpj,
      inscricaoMunicipal: tenant.inscricaoMunicipal,
      codigoMunicipio: tenant.codigoMunicipio,
      hasFocusToken: !!tenant.fiscalConfig?.focusNfeToken,
    })

    // 3. Validar dados do cliente
    this.validateTomadorData(booking.customer)

    // 4. Gerar referência única
    const internalRef = `nfse-${nanoid(12)}`

    // 5. Detectar se município usa Sistema Nacional
    const usaNacional = this.isMunicipioNacional(tenant.codigoMunicipio!)
    console.log(`[NFS-e] Sistema detectado: ${usaNacional ? 'NACIONAL' : 'MUNICIPAL'}`)

    // 6. Construir payload no formato correto
    const payload = usaNacional
      ? this.buildNacionalPayload(booking, tenant)
      : this.buildNfsePayload(booking, tenant)
    console.log('[NFS-e] Payload construído:', JSON.stringify(payload, null, 2))

    // 7. Criar registro no banco
    const descricaoServico = usaNacional
      ? payload.descricao_servico
      : payload.servico.discriminacao

    const invoice = await prisma.invoice.create({
      data: {
        internalRef,
        status: 'PENDING',
        valorServicos: booking.totalPrice,
        valorTotal: booking.totalPrice,
        aliquotaIss: tenant.fiscalConfig?.aliquotaIss || 0,
        valorIss: booking.totalPrice * ((tenant.fiscalConfig?.aliquotaIss || 0) / 100),
        issRetido: tenant.fiscalConfig?.issRetido || false,
        descricaoServico,
        codigoServico: tenant.fiscalConfig?.codigoServico || undefined,
        tomadorNome: booking.customer.name,
        tomadorCpfCnpj: booking.customer.cpfCnpj || undefined,
        tomadorEmail: booking.customer.email || undefined,
        tomadorEndereco: booking.customer.address
          ? {
            logradouro: booking.customer.address,
            cidade: booking.customer.city,
            uf: booking.customer.state,
            cep: booking.customer.zipCode,
          }
          : undefined,
        bookingId,
        tenantId,
      },
    })

    try {
      // 7. Enviar para Focus NFe
      if (!tenant.fiscalConfig) {
        throw new FiscalConfigurationError('Configuração fiscal não encontrada')
      }
      const client = this.createClient(tenant.fiscalConfig)
      const response = await client.emitirNfse(internalRef, payload)

      // 8. Atualizar status
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: this.mapFocusStatus(response.status),
          focusNfeStatus: response.status,
          numero: response.numero,
          codigoVerificacao: response.codigo_verificacao,
          xmlUrl: response.caminho_xml_nota_fiscal || response.url,
          pdfUrl: response.url_danfse,
          emittedAt: response.status === 'autorizado' ? new Date() : undefined,
        },
      })

      // 9. Se autorizado e opção de email, enviar
      if (response.status === 'autorizado' && options.sendEmail && booking.customer.email) {
        await this.sendInvoiceEmail(invoice.id)
      }

      return {
        success: true,
        invoice: {
          id: invoice.id,
          internalRef,
          status: this.mapFocusStatus(response.status),
        },
      }
    } catch (error) {
      // Atualizar com erro
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      const focusErrors = error instanceof FocusNfeApiError ? error.focusNfeErrors : undefined

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'ERROR',
          errorCode: error instanceof FocusNfeApiError ? 'FOCUS_API_ERROR' : 'UNKNOWN_ERROR',
          errorMessage,
          retryCount: { increment: 1 },
        },
      })

      return {
        success: false,
        invoice: {
          id: invoice.id,
          internalRef,
          status: 'ERROR',
        },
        error: errorMessage,
        focusNfeErrors: focusErrors,
      }
    }
  }

  /**
   * Consulta e atualiza o status de uma NFS-e
   */
  async syncStatus(invoiceId: string, tenantId: string): Promise<InvoiceStatus> {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: {
        tenant: {
          include: { fiscalConfig: true },
        },
      },
    })

    if (!invoice) {
      throw new InvoiceNotFoundError(invoiceId)
    }

    // Se já está em status final, não consulta
    if (['AUTHORIZED', 'CANCELLED', 'REJECTED'].includes(invoice.status)) {
      return invoice.status as InvoiceStatus
    }

    const client = this.createClient({
      focusNfeToken: invoice.tenant.fiscalConfig?.focusNfeToken || '',
      focusNfeEnvironment: (invoice.tenant.fiscalConfig?.focusNfeEnvironment || 'HOMOLOGACAO') as FocusNfeEnvironment,
    })

    const response = await client.consultarNfse(invoice.internalRef)

    const newStatus = this.mapFocusStatus(response.status)

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: newStatus,
        focusNfeStatus: response.status,
        numero: response.numero || invoice.numero,
        codigoVerificacao: response.codigo_verificacao || invoice.codigoVerificacao,
        xmlUrl: response.caminho_xml_nota_fiscal || response.url || invoice.xmlUrl,
        pdfUrl: response.url_danfse || invoice.pdfUrl,
        emittedAt: response.status === 'autorizado' && !invoice.emittedAt ? new Date() : invoice.emittedAt,
        errorMessage: response.erros?.map(e => e.mensagem).join('; ') || null,
      },
    })

    return newStatus
  }

  /**
   * Cancela uma NFS-e
   */
  async cancel(
    invoiceId: string,
    tenantId: string,
    justificativa: string
  ): Promise<void> {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: {
        tenant: {
          include: { fiscalConfig: true },
        },
      },
    })

    if (!invoice) {
      throw new InvoiceNotFoundError(invoiceId)
    }

    if (invoice.status !== 'AUTHORIZED') {
      throw new InvoiceStatusError(invoice.status, 'cancelar')
    }

    const client = this.createClient({
      focusNfeToken: invoice.tenant.fiscalConfig?.focusNfeToken || '',
      focusNfeEnvironment: (invoice.tenant.fiscalConfig?.focusNfeEnvironment || 'HOMOLOGACAO') as FocusNfeEnvironment,
    })

    await client.cancelarNfse(invoice.internalRef, justificativa)

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: justificativa,
      },
    })
  }

  /**
   * Reenvia email com a NFS-e
   */
  async sendInvoiceEmail(invoiceId: string, emails?: string[]): Promise<void> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        tenant: {
          include: { fiscalConfig: true },
        },
        booking: {
          include: { customer: true },
        },
      },
    })

    if (!invoice) {
      throw new InvoiceNotFoundError(invoiceId)
    }

    if (invoice.status !== 'AUTHORIZED') {
      throw new InvoiceStatusError(invoice.status, 'enviar email')
    }

    const targetEmails = emails || (invoice.tomadorEmail ? [invoice.tomadorEmail] : [])

    if (targetEmails.length === 0) {
      throw new TomadorDataError('Nenhum email disponível para envio')
    }

    const client = this.createClient({
      focusNfeToken: invoice.tenant.fiscalConfig?.focusNfeToken || '',
      focusNfeEnvironment: (invoice.tenant.fiscalConfig?.focusNfeEnvironment || 'HOMOLOGACAO') as FocusNfeEnvironment,
    })

    await client.reenviarEmail(invoice.internalRef, targetEmails)

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        sentToCustomerAt: new Date(),
      },
    })
  }

  // ========== Métodos privados ==========

  private async getBookingData(bookingId: string, tenantId: string) {
    return prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
      include: {
        customer: true,
        items: {
          include: {
            equipment: {
              select: { name: true },
            },
          },
        },
      },
    })
  }

  private async getTenantFiscalData(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { fiscalConfig: true },
    })

    if (!tenant) {
      throw new FiscalConfigurationError('Tenant não encontrado')
    }

    if (!tenant.cnpj || !tenant.inscricaoMunicipal || !tenant.codigoMunicipio) {
      throw new FiscalConfigurationError('Dados fiscais do tenant incompletos')
    }

    if (!tenant.fiscalConfig?.focusNfeToken) {
      throw new FiscalConfigurationError('Token do Focus NFe não configurado')
    }

    return tenant
  }

  private validateTomadorData(customer: { name: string; cpfCnpj?: string | null }) {
    if (!customer.name) {
      throw new TomadorDataError('Nome do cliente é obrigatório', ['name'])
    }

    if (customer.cpfCnpj && !validateCpfCnpj(customer.cpfCnpj)) {
      throw new TomadorDataError('CPF/CNPJ do cliente é inválido', ['cpfCnpj'])
    }
  }

  private createClient(config: {
    focusNfeToken?: string | null
    focusNfeEnvironment?: string | null
  }): FocusNfeClient {
    if (!config.focusNfeToken) {
      throw new FiscalConfigurationError('Token do Focus NFe não configurado')
    }

    // Descriptografar token
    const decryptedToken = decryptToken(config.focusNfeToken)

    return createFocusNfeClient(
      decryptedToken,
      (config.focusNfeEnvironment || 'HOMOLOGACAO') as FocusNfeEnvironment
    )
  }

  /**
   * Retorna a data/hora atual no timezone de São Paulo
   * Subtrai 15 minutos para garantir que não seja rejeitada como "futura"
   */
  private getCurrentDateTimeBrazil(): string {
    const now = new Date()

    console.log('[NFS-e] ========== DEBUG DATA EMISSÃO ==========')
    console.log('[NFS-e] Hora atual do servidor (UTC):', now.toISOString())
    console.log('[NFS-e] Hora atual do servidor (local):', now.toString())
    console.log('[NFS-e] Timezone offset do servidor (minutos):', now.getTimezoneOffset())

    // Subtrai 15 minutos para garantir margem de segurança maior
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000)
    console.log('[NFS-e] Hora atual - 15 min (UTC):', fifteenMinutesAgo.toISOString())

    // Obtém o offset do Brasil (-3 horas = -180 minutos)
    const brazilOffset = -3 * 60 // UTC-3
    const utcTime = fifteenMinutesAgo.getTime() + (fifteenMinutesAgo.getTimezoneOffset() * 60000)
    const brazilTime = new Date(utcTime + (brazilOffset * 60000))

    console.log('[NFS-e] Hora convertida para Brasil:', brazilTime.toISOString())

    // Formata manualmente para garantir formato correto
    const year = brazilTime.getUTCFullYear()
    const month = String(brazilTime.getUTCMonth() + 1).padStart(2, '0')
    const day = String(brazilTime.getUTCDate()).padStart(2, '0')
    const hours = String(brazilTime.getUTCHours()).padStart(2, '0')
    const minutes = String(brazilTime.getUTCMinutes()).padStart(2, '0')
    const seconds = String(brazilTime.getUTCSeconds()).padStart(2, '0')

    // Retorna no formato ISO 8601 SEM timezone ou milissegundos
    const result = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`

    console.log('[NFS-e] Data FINAL que será enviada:', result)
    console.log('[NFS-e] ========================================')

    return result
  }

  /**
   * Garante que o objeto tomador tem os campos na ordem correta para o XML Focus NFe
   *
   * Ordem obrigatória:
   * 1. razao_social (xNome)
   * 2. cpf ou cnpj (documento)
   * 3. endereco (ender) - DEVE VIR ANTES DE EMAIL
   * 4. email (xEmail)
   * 5. telefone (xTelefone)
   *
   * JavaScript ES6+ garante a ordem de inserção das propriedades de objeto,
   * e o Focus NFe usa essa ordem para gerar o XML. Ordem incorreta causa
   * erro de validação de schema XML.
   */
  private ordenarCamposTomador(tomador: any): any {
    const ordenado: any = {}

    // Ordem correta para o XML Focus NFe
    if (tomador.razao_social) ordenado.razao_social = tomador.razao_social
    if (tomador.cpf) ordenado.cpf = tomador.cpf
    if (tomador.cnpj) ordenado.cnpj = tomador.cnpj
    if (tomador.endereco) ordenado.endereco = tomador.endereco
    if (tomador.email) ordenado.email = tomador.email
    if (tomador.telefone) ordenado.telefone = tomador.telefone

    console.log('[NFS-e] ✅ Campos do tomador ordenados:', Object.keys(ordenado))

    return ordenado
  }

  /**
   * Mapeia o regime tributário do tenant para o código numérico do Focus NFe
   *
   * Códigos Focus NFe:
   * 1 = Microempresa Municipal
   * 2 = Estimativa
   * 3 = Sociedade de Profissionais
   * 4 = Cooperativa
   * 5 = MEI (Microempreendedor Individual)
   * 6 = ME/EPP (Microempresa e Empresa de Pequeno Porte - Simples Nacional)
   */
  private getRegimeEspecialTributacao(regimeTributario: string | null | undefined): number | undefined {
    console.log('[NFS-e] Regime tributário do tenant:', regimeTributario)

    switch (regimeTributario) {
      case 'MEI':
        console.log('[NFS-e] → Código Focus NFe: 5 (MEI)')
        return 5
      case 'SIMPLES_NACIONAL':
        console.log('[NFS-e] → Código Focus NFe: 6 (ME/EPP - Simples Nacional)')
        return 6
      case 'LUCRO_PRESUMIDO':
        // IMPORTANTE: Para Lucro Presumido, NÃO enviar regime_especial_tributacao
        // Esse campo é apenas para regimes ESPECIAIS (MEI, Simples, etc.)
        console.log('[NFS-e] → Regime Normal (Lucro Presumido) - NÃO enviar regime_especial_tributacao')
        return undefined
      case 'LUCRO_REAL':
        // IMPORTANTE: Para Lucro Real, NÃO enviar regime_especial_tributacao
        // Esse campo é apenas para regimes ESPECIAIS (MEI, Simples, etc.)
        console.log('[NFS-e] → Regime Normal (Lucro Real) - NÃO enviar regime_especial_tributacao')
        return undefined
      default:
        // Se não soubermos o regime, não enviar para evitar erros
        console.log('[NFS-e] → Regime não definido - NÃO enviar regime_especial_tributacao')
        return undefined
    }
  }

  /**
   * Mapeia o regime tributário para código de opção do Simples Nacional (NFS-e Nacional)
   *
   * Códigos NFS-e Nacional:
   * 1 = Microempreendedor Individual (MEI)
   * 2 = Estimativa
   * 3 = Sociedade de profissionais
   * 4 = Cooperativa
   * 5 = Microempresa ou Empresa de Pequeno Porte (ME/EPP)
   * 6 = Microempresário Individual e equiparados
   */
  private getCodigoOpcaoSimplesNacional(regimeTributario: string | null | undefined): number | undefined {
    console.log('[NFS-e Nacional] Regime tributário do tenant:', regimeTributario)

    switch (regimeTributario) {
      case 'MEI':
        console.log('[NFS-e Nacional] → Código Simples Nacional: 1 (MEI)')
        return 1
      case 'SIMPLES_NACIONAL':
        console.log('[NFS-e Nacional] → Código Simples Nacional: 5 (ME/EPP)')
        return 5
      default:
        // Para outros regimes (Lucro Presumido, Lucro Real), não enviar este campo
        console.log('[NFS-e Nacional] → Regime não é Simples Nacional, campo não será enviado')
        return undefined
    }
  }

  private buildNfsePayload(
    booking: NonNullable<Awaited<ReturnType<typeof this.getBookingData>>>,
    tenant: NonNullable<Awaited<ReturnType<typeof this.getTenantFiscalData>>>
  ): NfsePayload {
    console.log('[NFS-e] ========== CONSTRUINDO PAYLOAD ==========')

    // Construir descrição do serviço usando template
    const template = tenant.fiscalConfig?.descricaoTemplate || DEFAULT_DESCRIPTION_TEMPLATE

    const variables: TemplateVariables = {
      bookingNumber: booking.bookingNumber,
      startDate: formatDate(booking.startDate),
      endDate: formatDate(booking.endDate),
      totalDays: calculateDays(booking.startDate, booking.endDate),
      customerName: booking.customer.name,
      itemsList: formatItemsList(
        booking.items.map(item => ({
          equipmentName: item.equipment.name,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
        }))
      ),
      totalPrice: formatCurrency(booking.totalPrice),
    }

    const discriminacao = processTemplate(template, variables)

    // Validar dados obrigatórios do cliente
    const issRetido = tenant.fiscalConfig?.issRetido || false
    const hasCpfCnpj = !!booking.customer.cpfCnpj
    const hasAddress = !!(booking.customer.address && booking.customer.city && booking.customer.state)

    console.log('[NFS-e] Validação de dados do cliente:', {
      name: booking.customer.name,
      hasCpfCnpj,
      hasAddress,
      issRetido,
      addressData: {
        address: booking.customer.address,
        city: booking.customer.city,
        state: booking.customer.state,
        zipCode: booking.customer.zipCode,
      }
    })

    // VALIDAÇÃO: CPF/CNPJ é obrigatório para tomador
    if (!hasCpfCnpj || !booking.customer.cpfCnpj) {
      console.error('[NFS-e] ❌ ERRO: CPF/CNPJ do tomador não informado (obrigatório)')
      throw new TomadorDataError(
        'CPF ou CNPJ do tomador é obrigatório para emissão de NFS-e',
        ['cpfCnpj']
      )
    }

    // Detectar se é CNPJ (14 dígitos) para validações adicionais
    const doc = onlyNumbers(booking.customer.cpfCnpj)
    const isCnpj = doc.length === 14

    // VALIDAÇÃO: Endereço é obrigatório quando ISS retido
    if (issRetido && !hasAddress) {
      console.error('[NFS-e] ❌ ERRO: ISS retido mas endereço do tomador não informado')
      throw new TomadorDataError(
        'Endereço do tomador é obrigatório quando ISS é retido',
        ['address', 'city', 'state', 'zipCode']
      )
    }

    // VALIDAÇÃO: Endereço é obrigatório para tomador com CNPJ
    if (isCnpj && !hasAddress) {
      console.error('[NFS-e] ❌ ERRO: Tomador com CNPJ mas endereço não informado')
      throw new TomadorDataError(
        'Endereço do tomador é obrigatório quando o tomador possui CNPJ',
        ['address', 'city', 'state', 'zipCode']
      )
    }

    // Montar payload
    // IMPORTANTE: Série deve ser uppercase para evitar erros de autorização
    const serieConfigured = tenant.fiscalConfig?.nfseSerie?.trim()?.toUpperCase()
    console.log('[NFS-e] Série configurada:', serieConfigured || '(não configurada - campo não será enviado)')

    // Obter regime especial de tributação (só para MEI/Simples - não enviar para Lucro Presumido/Real)
    const regimeEspecial = this.getRegimeEspecialTributacao(tenant.regimeTributario)
    console.log('[NFS-e] Regime especial tributação:', regimeEspecial ?? '(não será enviado - regime normal)')

    const payload: NfsePayload = {
      data_emissao: this.getCurrentDateTimeBrazil(),
      natureza_operacao: 1, // 1 = Tributação no município
      optante_simples_nacional: tenant.regimeTributario === 'SIMPLES_NACIONAL' || tenant.regimeTributario === 'MEI',
      ...(regimeEspecial !== undefined && { regime_especial_tributacao: regimeEspecial }), // Só envia se for MEI/Simples
      ...(serieConfigured && { serie: serieConfigured }), // Só envia se configurada
      prestador: {
        cnpj: onlyNumbers(tenant.cnpj!),
        inscricao_municipal: onlyNumbers(tenant.inscricaoMunicipal!),
        codigo_municipio: tenant.codigoMunicipio!,
      },
      tomador: {
        razao_social: booking.customer.name,
        // Email e telefone serão adicionados após o endereço para manter ordem correta do XML
      },
      servico: {
        valor_servicos: booking.totalPrice,
        discriminacao,
        aliquota: tenant.fiscalConfig?.aliquotaIss || 0,
        iss_retido: issRetido,
        valor_iss: booking.totalPrice * ((tenant.fiscalConfig?.aliquotaIss || 0) / 100),
      },
    }

    // Adicionar CPF ou CNPJ do tomador
    if (doc.length === 11) {
      payload.tomador.cpf = doc
      console.log('[NFS-e] Tomador tipo: PESSOA FÍSICA (CPF)')
    } else if (doc.length === 14) {
      payload.tomador.cnpj = doc
      console.log('[NFS-e] Tomador tipo: PESSOA JURÍDICA (CNPJ)')
    } else {
      throw new TomadorDataError(
        `CPF/CNPJ do tomador inválido: deve ter 11 (CPF) ou 14 (CNPJ) dígitos, recebido: ${doc.length}`,
        ['cpfCnpj']
      )
    }

    // Adicionar endereço do tomador
    // OBRIGATÓRIO quando:
    // 1. ISS é retido
    // 2. Tomador tem CNPJ
    // 3. Dados de endereço estão disponíveis
    if (hasAddress || issRetido || isCnpj) {
      if (!hasAddress) {
        // Se chegou aqui, é porque a validação acima já lançou erro
        // Mas por segurança, garantir que não vamos enviar valores vazios
        throw new TomadorDataError(
          'Endereço do tomador incompleto',
          ['address', 'city', 'state', 'zipCode']
        )
      }

      payload.tomador.endereco = {
        logradouro: booking.customer.address!,
        numero: 'S/N', // Número não separado no modelo atual
        bairro: 'Centro', // Bairro não disponível no modelo atual
        codigo_municipio: tenant.codigoMunicipio!, // Código do município do prestador
        uf: booking.customer.state!,
        cep: onlyNumbers(booking.customer.zipCode!).padStart(8, '0'),
      }

      console.log('[NFS-e] ✅ Endereço do tomador adicionado:', payload.tomador.endereco)

      // Adicionar email e telefone APENAS quando há endereço (ordem correta para XML Focus NFe)
      // Email e telefone devem vir APÓS o endereço no schema XML
      if (booking.customer.email) {
        payload.tomador.email = booking.customer.email
        console.log('[NFS-e] Email do tomador adicionado')
      }
      if (booking.customer.phone) {
        payload.tomador.telefone = booking.customer.phone
        console.log('[NFS-e] Telefone do tomador adicionado')
      }
    } else {
      console.warn('[NFS-e] ⚠️  Endereço não disponível - email e telefone não serão enviados (exigência do schema XML)')
      console.warn('[NFS-e] 💡 DICA: Para enviar email/telefone na NFS-e, complete o endereço do cliente no cadastro')
      console.warn('[NFS-e] 📝 Campo obrigatório: Endereço (logradouro)')
    }

    // Adicionar código do serviço se configurado
    if (tenant.fiscalConfig?.codigoServico) {
      // Detectar se o município usa Sistema Nacional
      const municipioUsaNacional = this.isMunicipioNacional(tenant.codigoMunicipio!)
      // Passa o código do município para formatação correta (alguns usam 4 dígitos, outros 6)
      const { isNacional, code } = this.normalizeServiceCode(
        tenant.fiscalConfig.codigoServico,
        municipioUsaNacional,
        tenant.codigoMunicipio!  // Código IBGE do município para formato específico
      )

      if (isNacional) {
        // Sistema Nacional NFS-e (códigos começando com 99)
        payload.servico.codigo_tributacao_nacional_iss = code
        console.log(`[NFS-e] Sistema NACIONAL - código_tributacao_nacional_iss: ${code}`)
      } else {
        // Sistema Municipal (LC 116/2003)
        // O código já vem no formato correto para o município (4 ou 6 dígitos)
        payload.servico.item_lista_servico = code
        console.log(`[NFS-e] Sistema MUNICIPAL - item_lista_servico: ${code}`)

        // CAXIAS DO SUL: NÃO enviar codigo_tributario_municipio
        // O código LC 116/2003 (cLCServ) é 1401, mas o código da prefeitura (cServ) é diferente (ex: 1519)
        // O suporte Focus NFe informou que instruíram a API a ignorar esse campo e usar o do cadastro do prestador
        // Referência: XML de NFS-e autorizada mostra cServ=1519, cLCServ=1401
        if (tenant.codigoMunicipio === '4305108') {
          console.log(`[NFS-e] Caxias do Sul - NÃO enviando codigo_tributario_municipio (Focus NFe usará o cadastro)`)
          // NÃO definir payload.servico.codigo_tributario_municipio
        }
      }
    } else {
      console.warn('[NFS-e] ⚠️  Código de serviço não configurado')
    }

    console.log('[NFS-e] Payload final construído:', {
      prestador: payload.prestador,
      tomador: {
        ...payload.tomador,
        hasEndereco: !!payload.tomador.endereco
      },
      servico: {
        valor: payload.servico.valor_servicos,
        aliquota: payload.servico.aliquota,
        iss_retido: payload.servico.iss_retido,
        codigo: payload.servico.codigo_tributacao_nacional_iss
      }
    })
    console.log('[NFS-e] ============================================')

    // Garantir ordem correta dos campos do tomador antes de enviar
    payload.tomador = this.ordenarCamposTomador(payload.tomador)

    return payload
  }

  /**
   * Constrói o payload no formato NFSe Nacional (DPS)
   * Usado para municípios que migraram para o Sistema Nacional
   */
  private buildNacionalPayload(
    booking: NonNullable<Awaited<ReturnType<typeof this.getBookingData>>>,
    tenant: NonNullable<Awaited<ReturnType<typeof this.getTenantFiscalData>>>
  ): any {
    console.log('[NFS-e] ========== CONSTRUINDO PAYLOAD NACIONAL (DPS) ==========')

    // Construir descrição do serviço
    const template = tenant.fiscalConfig?.descricaoTemplate || DEFAULT_DESCRIPTION_TEMPLATE
    const variables: TemplateVariables = {
      bookingNumber: booking.bookingNumber,
      startDate: formatDate(booking.startDate),
      endDate: formatDate(booking.endDate),
      totalDays: calculateDays(booking.startDate, booking.endDate),
      customerName: booking.customer.name,
      itemsList: formatItemsList(
        booking.items.map(item => ({
          equipmentName: item.equipment.name,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
        }))
      ),
      totalPrice: formatCurrency(booking.totalPrice),
    }
    const descricao_servico = processTemplate(template, variables)

    // Validar dados obrigatórios
    if (!booking.customer.cpfCnpj) {
      throw new TomadorDataError(
        'CPF ou CNPJ do tomador é obrigatório para emissão de NFS-e',
        ['cpfCnpj']
      )
    }

    const doc = onlyNumbers(booking.customer.cpfCnpj)
    const isCnpj = doc.length === 14

    // Obter código de tributação nacional
    const codigoServico = tenant.fiscalConfig?.codigoServico
    if (!codigoServico) {
      throw new FiscalConfigurationError('Código de serviço não configurado para emissão de NFS-e Nacional')
    }

    const { code: codigoNacional } = this.normalizeServiceCode(codigoServico, true)

    if (!codigoNacional) {
      throw new FiscalConfigurationError(`Não foi possível normalizar o código de serviço: ${codigoServico}`)
    }

    console.log('[NFS-e Nacional] Código de serviço normalizado:', codigoNacional)

    // Gerar número DPS único baseado no timestamp (apenas números)
    // Usar os últimos 15 dígitos do timestamp para garantir unicidade
    const numeroDPS = Date.now().toString().slice(-15)

    // Obter códigos de regime (só para MEI/Simples - não enviar para Lucro Presumido/Real)
    const codigoOpcaoSimples = this.getCodigoOpcaoSimplesNacional(tenant.regimeTributario)
    const regimeEspecialNacional = this.getRegimeEspecialTributacao(tenant.regimeTributario)
    console.log('[NFS-e Nacional] Regime especial tributação:', regimeEspecialNacional ?? '(não será enviado - regime normal)')

    // Payload no formato DPS (NFSe Nacional)
    const payload: any = {
      // Dados da DPS
      data_emissao: this.getCurrentDateTimeBrazil(),
      data_competencia: booking.startDate.toISOString().split('T')[0], // YYYY-MM-DD (formato ISO: 2025-11-28)
      serie_dps: '1',
      numero_dps: numeroDPS, // Número sequencial único (apenas dígitos)
      emitente_dps: 1, // 1 = Prestador

      // Município emissor
      codigo_municipio_emissora: tenant.codigoMunicipio!,

      // Prestador
      cnpj_prestador: onlyNumbers(tenant.cnpj!),

      // Tomador
      razao_social_tomador: booking.customer.name,
      email_tomador: booking.customer.email || undefined,

      // Município da prestação
      codigo_municipio_prestacao: tenant.codigoMunicipio!,

      // Serviço
      codigo_tributacao_nacional_iss: codigoNacional,
      descricao_servico,
      valor_servico: booking.totalPrice,

      // Simples Nacional (só envia se for MEI/Simples)
      ...(codigoOpcaoSimples !== undefined && { codigo_opcao_simples_nacional: codigoOpcaoSimples }),
      ...(regimeEspecialNacional !== undefined && { regime_especial_tributacao: regimeEspecialNacional }),

      // Tributação
      tributacao_iss: 1, // 1 = Tributável

      // Retenção de ISS
      tipo_retencao_iss: tenant.fiscalConfig?.issRetido ? 2 : 1, // 1 = Não retido, 2 = Retido pelo tomador
    }

    // Adicionar CPF ou CNPJ do tomador
    if (doc.length === 11) {
      payload.cpf_tomador = doc
      console.log('[NFS-e Nacional] Tomador tipo: PESSOA FÍSICA (CPF)')
    } else if (doc.length === 14) {
      payload.cnpj_tomador = doc
      console.log('[NFS-e Nacional] Tomador tipo: PESSOA JURÍDICA (CNPJ)')
    } else {
      throw new TomadorDataError(
        `CPF/CNPJ do tomador inválido: deve ter 11 (CPF) ou 14 (CNPJ) dígitos, recebido: ${doc.length}`,
        ['cpfCnpj']
      )
    }

    console.log('[NFS-e Nacional] Número DPS gerado:', numeroDPS, '(tipo:', typeof numeroDPS, ')')

    // Adicionar endereço do tomador (obrigatório para CNPJ ou ISS retido)
    const hasAddress = !!(booking.customer.address && booking.customer.city && booking.customer.state)
    const issRetido = tenant.fiscalConfig?.issRetido || false

    if (hasAddress && (isCnpj || issRetido)) {
      payload.codigo_municipio_tomador = tenant.codigoMunicipio! // Código IBGE
      payload.cep_tomador = onlyNumbers(booking.customer.zipCode || '').padStart(8, '0')
      payload.logradouro_tomador = booking.customer.address!
      payload.numero_tomador = 'S/N'
      payload.bairro_tomador = 'Centro'
      console.log('[NFS-e Nacional] ✅ Endereço do tomador adicionado')
    }

    // NOTA: Não informar alíquota quando há regime especial de tributação (E0604)
    // O campo percentual_aliquota_relativa_municipio NÃO deve ser enviado para ME/EPP
    // pois já estamos informando regime_especial_tributacao = 6

    console.log('[NFS-e Nacional] Payload DPS construído:', {
      serie_dps: payload.serie_dps,
      numero_dps: payload.numero_dps,
      codigo_tributacao_nacional_iss: payload.codigo_tributacao_nacional_iss,
      valor_servico: payload.valor_servico,
      codigo_opcao_simples_nacional: payload.codigo_opcao_simples_nacional,
    })
    console.log('[NFS-e] ============================================')

    return payload
  }

  /**
   * Verifica se o município usa Sistema Nacional NFS-e
   * Lista de municípios que já migraram para o Sistema Nacional
   */
  private isMunicipioNacional(codigoMunicipio: string): boolean {
    // Municípios que já migraram para Sistema Nacional NFS-e
    const municipiosNacionais = [
      '3509502', // Campinas - SP - HABILITADO: Usar NFSe Nacional em homologação (produção a partir de 01/01/2026)
      '3550308', // São Paulo - SP
      '3304557', // Rio de Janeiro - RJ
      '4106902', // Curitiba - PR
      '3106200', // Belo Horizonte - MG
      // Adicionar outros municípios conforme necessário
    ]

    const usaNacional = municipiosNacionais.includes(codigoMunicipio)

    if (usaNacional) {
      console.log(`[NFS-e] ⚠️  Município ${codigoMunicipio} usa Sistema Nacional NFS-e`)
    }

    return usaNacional
  }

  /**
   * Normaliza o código de serviço e detecta se é Sistema Nacional ou Municipal
   *
   * Sistema Nacional (6 dígitos numéricos - códigos começando com 99):
   * - Formato: 990101 (6 dígitos, sem pontos)
   * - Campo: codigo_tributacao_nacional_iss
   * - Exemplos: 990101 (Serviços sem incidência de ISSQN e ICMS)
   *
   * Sistema Municipal (LC 116/2003 - códigos NÃO começando com 99):
   * - Formato PADRÃO: XXYYZZ (6 dígitos numéricos, sem pontos)
   *   - XX = Item da LC 116/2003 (2 dígitos)
   *   - YY = Subitem da LC 116/2003 (2 dígitos)
   *   - ZZ = Desdobro Nacional (2 dígitos, geralmente "00")
   * - Formato 4 DÍGITOS (alguns municípios): XXYY (sem desdobro)
   *   - Caxias do Sul (4305108), entre outros
   * - Campo: item_lista_servico
   * - Exemplos:
   *   - "01.05" → 010500 (padrão 6 dígitos)
   *   - "14.01" → 1401 (Caxias do Sul - 4 dígitos)
   *   - "17.05" → 170500
   *
   * ⚠️ MAPEAMENTOS TEMPORÁRIOS (até NT 005/2025 ser implementada):
   * - "17.05" -> "990101" (TEMPORÁRIO: deveria ser 990401 para Locação de bens móveis)
   * - "01.05" -> "990101" (TEMPORÁRIO: deveria ser 990401 para Locação de bens móveis)
   * - Código 990401 foi anunciado na NT 005 mas ainda não está disponível no sistema
   * - Usando 990101 como workaround até a implementação oficial
   *
   * @param code - Código do serviço configurado
   * @param forcaNacional - Força conversão para Sistema Nacional (quando município já migrou)
   * @param codigoMunicipio - Código IBGE do município (opcional, para formatos específicos)
   */
  private normalizeServiceCode(
    code: string,
    forcaNacional: boolean = false,
    codigoMunicipio?: string
  ): { isNacional: boolean; code: string } {
    // Mapeamento de códigos LC 116/2003 para Sistema Nacional NFS-e
    // ⚠️ ATENÇÃO: SOLUÇÃO TEMPORÁRIA - NT 005/2025 ainda não implementada
    // O código correto seria 990401 (Locação de bens móveis), mas ainda não está disponível no sistema.
    // Usando 990101 (Serviços sem incidência de ISSQN e ICMS) como workaround temporário.
    // TODO: Atualizar para 990401 quando NT 005/2025 for implementada pela Focus NFe
    const municipalToNacionalMapping: Record<string, string> = {
      // ✅ ATIVO PARA HOMOLOGAÇÃO: Campinas pode testar Sistema Nacional em homologação
      // Em produção: obrigatório a partir de 01/01/2026
      '17.05': '990101', // TEMPORÁRIO: Locação de bens móveis (deveria ser 990401 quando NT 005 implementada)
      '01.05': '990101', // TEMPORÁRIO: Locação de bens móveis (deveria ser 990401 quando NT 005 implementada)
      '010500': '990101', // TEMPORÁRIO: Locação de bens móveis (deveria ser 990401 quando NT 005 implementada)
      '010501': '990101', // TEMPORÁRIO: Locação de bens móveis (deveria ser 990401 quando NT 005 implementada)
    }

    // Municípios que usam formato de 4 dígitos (sem desdobro "00")
    // Esses municípios esperam o código no formato XXYY ao invés de XXYY00
    const municipios4Digitos: string[] = [
      '4305108', // Caxias do Sul - RS (confirmado pelo suporte Focus NFe)
    ]

    // Municípios que usam formato com ponto (XX.YY)
    // Esses municípios esperam o código exatamente como "14.01" ao invés de "1401" ou "140100"
    // NOTA: Caxias do Sul (4305108) foi testado - usar 4 dígitos SEM ponto (1401)
    const municipiosComPonto: string[] = [
      // Adicionar municípios conforme necessário
    ]

    // Remove espaços e extrai apenas números
    const cleanCode = code.trim()
    const numericOnly = cleanCode.replace(/\D/g, '')

    // Verifica se o município usa formato de 4 dígitos
    const usa4Digitos = codigoMunicipio && municipios4Digitos.includes(codigoMunicipio)
    if (usa4Digitos) {
      console.log(`[NFS-e] Município ${codigoMunicipio} usa formato de 4 dígitos para item_lista_servico`)
    }

    // Verifica se o município usa formato com ponto (XX.YY)
    const usaComPonto = codigoMunicipio && municipiosComPonto.includes(codigoMunicipio)
    if (usaComPonto) {
      console.log(`[NFS-e] Município ${codigoMunicipio} usa formato com ponto (XX.YY) para item_lista_servico`)
    }

    // Se município força Nacional, verificar se precisa converter
    if (forcaNacional) {
      // Verifica se existe mapeamento específico para Nacional
      if (municipalToNacionalMapping[cleanCode]) {
        const nacionalCode = municipalToNacionalMapping[cleanCode]
        console.warn(`[NFS-e] ⚠️  WORKAROUND TEMPORÁRIO: Município usa Sistema Nacional - Código ${cleanCode} convertido para ${nacionalCode}`)
        console.warn(`[NFS-e] ⚠️  IMPORTANTE: NT 005/2025 ainda não implementada. Código correto seria 990401 para Locação de Bens Móveis.`)
        console.warn(`[NFS-e] ⚠️  Atualizar mapeamento quando Focus NFe implementar código 990401`)
        return { isNacional: true, code: nacionalCode }
      }

      // Se não tem mapeamento mas é Municipal (não começa com 99), avisar
      if (!numericOnly.startsWith('99')) {
        console.warn(`[NFS-e] ⚠️  ATENÇÃO: Município usa Sistema Nacional mas código ${cleanCode} não tem mapeamento. TEMPORÁRIO: Usando 990101 até NT 005 ser implementada (código correto seria 990401 para locação de bens móveis).`)
      }
    }

    // NOTA: Só converter para Nacional quando forcaNacional=true
    // Se o município não usa Nacional, manter código Municipal original

    // Detecta se é código Nacional (começa com 99 ou tem 6 dígitos sem pontos)

    // Se tem 6 dígitos e começa com 99, é Nacional
    if (numericOnly.length >= 4 && numericOnly.startsWith('99')) {
      const nacionalCode = numericOnly.padEnd(6, '0').substring(0, 6)
      console.log(`[NFS-e] Código detectado como NACIONAL: ${nacionalCode}`)
      return { isNacional: true, code: nacionalCode }
    }

    // Função auxiliar para formatar código com ponto (XX.YY)
    const formatComPonto = (digits: string): string => {
      // Garante 4 dígitos
      const d = digits.padStart(4, '0').substring(0, 4)
      return `${d.substring(0, 2)}.${d.substring(2, 4)}`
    }

    // Se tem formato XX.XX ou XXXX (4 dígitos), é Municipal LC 116/2003
    if (cleanCode.includes('.')) {
      // Formato XX.XX
      if (usaComPonto) {
        // Para municípios que usam formato com ponto, manter o ponto
        // Ex: 14.01 -> 14.01
        console.log(`[NFS-e] Código ${cleanCode} mantido no formato com ponto: ${cleanCode}`)
        return { isNacional: false, code: cleanCode }
      } else if (usa4Digitos) {
        // Para municípios que usam 4 dígitos, manter sem o desdobro "00"
        // Ex: 14.01 -> 1401
        console.log(`[NFS-e] Código ${cleanCode} convertido para formato Municipal 4 dígitos: ${numericOnly}`)
        return { isNacional: false, code: numericOnly }
      } else {
        // Formato padrão - converter para XXYY00 (6 dígitos)
        // Ex: 01.05 -> 010500
        const municipalCode = numericOnly.padEnd(6, '0').substring(0, 6)
        console.log(`[NFS-e] Código ${cleanCode} convertido para formato Municipal 6 dígitos: ${municipalCode}`)
        return { isNacional: false, code: municipalCode }
      }
    } else if (numericOnly.length === 4) {
      if (usaComPonto) {
        // Para municípios que usam formato com ponto, adicionar o ponto
        // Ex: 1401 -> 14.01
        const codeComPonto = formatComPonto(numericOnly)
        console.log(`[NFS-e] Código ${cleanCode} convertido para formato com ponto: ${codeComPonto}`)
        return { isNacional: false, code: codeComPonto }
      } else if (usa4Digitos) {
        // Para municípios que usam 4 dígitos, manter como está
        console.log(`[NFS-e] Código ${cleanCode} mantido em formato Municipal 4 dígitos: ${numericOnly}`)
        return { isNacional: false, code: numericOnly }
      } else {
        // Converter 0105 para 010500 (adicionar 00 do desdobro)
        const municipalCode = numericOnly + '00'
        console.log(`[NFS-e] Código ${cleanCode} convertido para formato Municipal 6 dígitos: ${municipalCode}`)
        return { isNacional: false, code: municipalCode }
      }
    } else if (numericOnly.length === 6 && !numericOnly.startsWith('99')) {
      // 6 dígitos mas não começa com 99 - é Municipal (já no formato correto)
      if (usaComPonto) {
        // Para municípios que usam formato com ponto, converter de 6 dígitos para XX.YY
        // Ex: 140100 -> 14.01
        const codeComPonto = formatComPonto(numericOnly.substring(0, 4))
        console.log(`[NFS-e] Código ${numericOnly} convertido para formato com ponto: ${codeComPonto}`)
        return { isNacional: false, code: codeComPonto }
      } else if (usa4Digitos) {
        // Para municípios que usam 4 dígitos, remover os últimos 2 dígitos (desdobro)
        const code4Digits = numericOnly.substring(0, 4)
        console.log(`[NFS-e] Código ${numericOnly} convertido para formato Municipal 4 dígitos: ${code4Digits}`)
        return { isNacional: false, code: code4Digits }
      }
      console.log(`[NFS-e] Código detectado como MUNICIPAL (LC 116/2003): ${numericOnly}`)
      return { isNacional: false, code: numericOnly }
    }

    // Fallback: trata como municipal
    console.warn(`[NFS-e] ⚠️  Código ${cleanCode} não reconhecido, tratando como Municipal`)
    return { isNacional: false, code: cleanCode }
  }

  private mapFocusStatus(focusStatus: string): InvoiceStatus {
    switch (focusStatus) {
      case 'autorizado':
        return 'AUTHORIZED'
      case 'processando_autorizacao':
        return 'PROCESSING'
      case 'erro_autorizacao':
        return 'REJECTED'
      case 'cancelado':
        return 'CANCELLED'
      default:
        return 'PENDING'
    }
  }
}

// Singleton
export const nfseService = new NfseService()
