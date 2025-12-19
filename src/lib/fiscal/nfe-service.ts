// Serviço principal para NF-e (Nota Fiscal Eletrônica de Produto)

import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import { FocusNfeClient } from './focus-nfe-client'
import { decryptToken } from './encryption'
import { buildNfePayload, validateNfeData } from './nfe-payload-builder'
import { certificateService } from './certificate-service'
import type {
  ProductInvoiceStatus,
  ProductInvoiceType,
  CreateProductInvoiceResult,
  FocusNfeNfeResponse,
} from './types'
import {
  FiscalFeatureDisabledError,
  FiscalConfigurationError,
} from './errors'

interface CreateRemessaOptions {
  bookingId: string
  tenantId: string
  equipmentIds?: string[] // Se não informado, usa todos os itens do booking
}

interface CreateRetornoOptions {
  remessaId: string // ID da NF-e de remessa
  tenantId: string
  equipmentIds?: string[] // Se não informado, usa todos os itens da remessa
}

/**
 * Serviço para gerenciamento de NF-e de Remessa e Retorno de Locação
 */
export class NfeService {
  /**
   * Verifica se o tenant pode emitir NF-e
   */
  private async validateTenantForNfe(tenantId: string): Promise<void> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        fiscalConfig: true
      }
    })

    if (!tenant) {
      throw new Error('Tenant não encontrado')
    }

    if (!tenant.nfeEnabled) {
      throw new FiscalFeatureDisabledError('NF-e não está habilitada para este tenant')
    }

    // Verificar dados obrigatórios
    const missingFields: string[] = []

    if (!tenant.cnpj) missingFields.push('CNPJ')
    if (!tenant.inscricaoEstadual) missingFields.push('Inscrição Estadual')
    if (!tenant.codigoMunicipio) missingFields.push('Código do Município')
    if (!tenant.fiscalConfig?.focusNfeToken) missingFields.push('Token Focus NFe')

    if (missingFields.length > 0) {
      throw new FiscalConfigurationError(
        'Configuração fiscal incompleta',
        missingFields
      )
    }

    // Verificar certificado digital
    const certStatus = await certificateService.getCertificateStatus(tenantId)
    if (!certStatus.valid) {
      throw new FiscalConfigurationError(
        certStatus.error || 'Certificado digital inválido ou não configurado',
        ['Certificado Digital A1']
      )
    }
  }

  /**
   * Cria uma NF-e de Remessa a partir de uma reserva
   */
  async createRemessaFromBooking(
    options: CreateRemessaOptions
  ): Promise<CreateProductInvoiceResult> {
    const { bookingId, tenantId, equipmentIds } = options

    try {
      // Validar tenant
      await this.validateTenantForNfe(tenantId)

      // Buscar booking com itens e cliente
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          tenantId
        },
        include: {
          customer: true,
          customerSite: true,
          items: {
            include: {
              equipment: true
            }
          }
        }
      })

      if (!booking) {
        return {
          success: false,
          error: 'Reserva não encontrada'
        }
      }

      if (booking.status !== 'CONFIRMED' && booking.status !== 'COMPLETED') {
        return {
          success: false,
          error: 'Reserva deve estar confirmada para emitir NF-e'
        }
      }

      // Verificar se já existe NF-e de remessa ativa
      const existingRemessa = await prisma.productInvoice.findFirst({
        where: {
          bookingId,
          tenantId,
          type: 'REMESSA_LOCACAO',
          status: { in: ['PENDING', 'PROCESSING', 'AUTHORIZED'] }
        }
      })

      if (existingRemessa) {
        return {
          success: false,
          error: 'Já existe uma NF-e de remessa ativa para esta reserva'
        }
      }

      // Filtrar equipamentos se especificado
      let items = booking.items
      if (equipmentIds && equipmentIds.length > 0) {
        items = items.filter(item => equipmentIds.includes(item.equipmentId))
      }

      if (items.length === 0) {
        return {
          success: false,
          error: 'Nenhum equipamento selecionado para a NF-e'
        }
      }

      // Buscar tenant e config fiscal
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { fiscalConfig: true }
      })

      if (!tenant || !tenant.fiscalConfig) {
        return {
          success: false,
          error: 'Configuração fiscal não encontrada'
        }
      }

      // Determinar endereço (site ou cliente)
      const deliveryAddress = booking.customerSite || booking.customer

      // Validar dados
      const validation = validateNfeData({
        type: 'REMESSA_LOCACAO',
        tenant: {
          cnpj: tenant.cnpj!,
          name: tenant.name,
          tradeName: tenant.tradeName || undefined,
          inscricaoEstadual: tenant.inscricaoEstadual!,
          inscricaoMunicipal: tenant.inscricaoMunicipal || undefined,
          regimeTributario: tenant.regimeTributario || undefined,
          codigoMunicipio: tenant.codigoMunicipio || undefined,
          street: tenant.street || undefined,
          number: tenant.number || undefined,
          complement: tenant.complement || undefined,
          neighborhood: tenant.neighborhood || undefined,
          city: tenant.city || undefined,
          state: tenant.state || undefined,
          zipCode: tenant.zipCode || undefined,
          phone: tenant.phone || undefined,
        },
        customer: {
          name: booking.customer.name,
          cpfCnpj: booking.customer.cpfCnpj || undefined,
          inscricaoEstadual: booking.customer.inscricaoEstadual || undefined,
          isIsentoIE: booking.customer.isIsentoIE,
          street: deliveryAddress.street || undefined,
          number: deliveryAddress.number || undefined,
          complement: deliveryAddress.complement || undefined,
          neighborhood: deliveryAddress.neighborhood || undefined,
          city: deliveryAddress.city || undefined,
          state: deliveryAddress.state || undefined,
          zipCode: deliveryAddress.zipCode || undefined,
          ibgeCode: deliveryAddress.ibgeCode || undefined,
          email: booking.customer.email || undefined,
          phone: booking.customer.phone || undefined,
        },
        equipments: items.map(item => ({
          id: item.equipmentId,
          name: item.equipment.name,
          ncm: item.equipment.ncm || undefined,
          codigoProduto: item.equipment.codigoProduto || undefined,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        })),
      })

      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join('; ')
        }
      }

      // Construir payload
      const payload = buildNfePayload({
        type: 'REMESSA_LOCACAO',
        tenant: {
          cnpj: tenant.cnpj!,
          name: tenant.name,
          tradeName: tenant.tradeName || undefined,
          inscricaoEstadual: tenant.inscricaoEstadual!,
          inscricaoMunicipal: tenant.inscricaoMunicipal || undefined,
          regimeTributario: tenant.regimeTributario || undefined,
          codigoMunicipio: tenant.codigoMunicipio || undefined,
          street: tenant.street || undefined,
          number: tenant.number || undefined,
          complement: tenant.complement || undefined,
          neighborhood: tenant.neighborhood || undefined,
          city: tenant.city || undefined,
          state: tenant.state || undefined,
          zipCode: tenant.zipCode || undefined,
          phone: tenant.phone || undefined,
        },
        customer: {
          name: booking.customer.name,
          cpfCnpj: booking.customer.cpfCnpj || undefined,
          inscricaoEstadual: booking.customer.inscricaoEstadual || undefined,
          isIsentoIE: booking.customer.isIsentoIE,
          street: deliveryAddress.street || undefined,
          number: deliveryAddress.number || undefined,
          complement: deliveryAddress.complement || undefined,
          neighborhood: deliveryAddress.neighborhood || undefined,
          city: deliveryAddress.city || undefined,
          state: deliveryAddress.state || undefined,
          zipCode: deliveryAddress.zipCode || undefined,
          ibgeCode: deliveryAddress.ibgeCode || undefined,
          email: booking.customer.email || undefined,
          phone: booking.customer.phone || undefined,
        },
        equipments: items.map(item => ({
          id: item.equipmentId,
          name: item.equipment.name,
          ncm: item.equipment.ncm!,
          codigoProduto: item.equipment.codigoProduto || undefined,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        })),
        config: {
          cfopRemessaDentroEstado: tenant.fiscalConfig.cfopRemessaDentroEstado,
          cfopRemessaForaEstado: tenant.fiscalConfig.cfopRemessaForaEstado,
          cfopRetornoDentroEstado: tenant.fiscalConfig.cfopRetornoDentroEstado,
          cfopRetornoForaEstado: tenant.fiscalConfig.cfopRetornoForaEstado,
          icmsCstPadrao: tenant.fiscalConfig.icmsCstPadrao,
          icmsOrigemPadrao: tenant.fiscalConfig.icmsOrigemPadrao,
        },
        bookingNumber: booking.bookingNumber,
      })

      // Gerar referência única
      const internalRef = `nfe-${nanoid(12)}`

      // Calcular totais
      const valorProdutos = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)

      // Criar registro no banco
      const productInvoice = await prisma.productInvoice.create({
        data: {
          internalRef,
          type: 'REMESSA_LOCACAO',
          status: 'PENDING',
          naturezaOperacao: 'Remessa para locacao',
          cfop: payload.items[0].cfop,
          valorProdutos,
          valorTotal: valorProdutos,
          destNome: booking.customer.name,
          destCpfCnpj: booking.customer.cpfCnpj || '',
          destInscricaoEstadual: booking.customer.inscricaoEstadual,
          destEndereco: {
            logradouro: deliveryAddress.street,
            numero: deliveryAddress.number,
            complemento: deliveryAddress.complement,
            bairro: deliveryAddress.neighborhood,
            cidade: deliveryAddress.city,
            uf: deliveryAddress.state,
            cep: deliveryAddress.zipCode,
            codigoMunicipio: deliveryAddress.ibgeCode,
          },
          bookingId,
          tenantId,
          items: {
            create: items.map((item, index) => ({
              equipmentId: item.equipmentId,
              numeroItem: index + 1,
              codigoProduto: item.equipment.codigoProduto || item.equipmentId.slice(0, 20),
              descricao: item.equipment.name,
              ncm: item.equipment.ncm || '00000000',
              cfop: payload.items[0].cfop,
              quantidade: item.quantity,
              valorUnitario: item.unitPrice,
              valorTotal: item.unitPrice * item.quantity,
            }))
          }
        }
      })

      // Enviar para Focus NFe
      const token = decryptToken(tenant.fiscalConfig.focusNfeToken!)
      const client = new FocusNfeClient({
        token,
        environment: tenant.fiscalConfig.focusNfeEnvironment as 'HOMOLOGACAO' | 'PRODUCAO'
      })

      try {
        const response = await client.emitirNfe(internalRef, payload)

        // Atualizar com resposta
        await prisma.productInvoice.update({
          where: { id: productInvoice.id },
          data: {
            status: this.mapFocusStatus(response.status),
            focusNfeStatus: response.status,
            numero: response.numero,
            serie: response.serie,
            chaveAcesso: response.chave_nfe,
            protocoloAutorizacao: response.protocolo,
            xmlUrl: response.caminho_xml_nota_fiscal,
            pdfUrl: response.caminho_danfe,
            dataAutorizacao: response.status === 'autorizado' ? new Date() : undefined,
            emittedAt: response.status === 'autorizado' ? new Date() : undefined,
          }
        })

        return {
          success: true,
          productInvoice: {
            id: productInvoice.id,
            internalRef,
            status: this.mapFocusStatus(response.status),
            chaveAcesso: response.chave_nfe,
            numero: response.numero,
          }
        }
      } catch (error) {
        // Atualizar com erro
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

        await prisma.productInvoice.update({
          where: { id: productInvoice.id },
          data: {
            status: 'ERROR',
            errorMessage,
          }
        })

        return {
          success: false,
          error: errorMessage,
          productInvoice: {
            id: productInvoice.id,
            internalRef,
            status: 'ERROR',
          }
        }
      }
    } catch (error) {
      console.error('[NF-e] Erro ao criar remessa:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar NF-e de remessa'
      }
    }
  }

  /**
   * Cria uma NF-e de Retorno a partir de uma NF-e de Remessa
   */
  async createRetornoFromRemessa(
    options: CreateRetornoOptions
  ): Promise<CreateProductInvoiceResult> {
    const { remessaId, tenantId, equipmentIds } = options

    try {
      // Validar tenant
      await this.validateTenantForNfe(tenantId)

      // Buscar NF-e de remessa
      const remessa = await prisma.productInvoice.findFirst({
        where: {
          id: remessaId,
          tenantId,
          type: 'REMESSA_LOCACAO',
          status: 'AUTHORIZED'
        },
        include: {
          items: {
            include: {
              equipment: true
            }
          },
          booking: {
            include: {
              customer: true,
              customerSite: true,
            }
          }
        }
      })

      if (!remessa) {
        return {
          success: false,
          error: 'NF-e de remessa não encontrada ou não está autorizada'
        }
      }

      if (!remessa.chaveAcesso) {
        return {
          success: false,
          error: 'NF-e de remessa não possui chave de acesso'
        }
      }

      // Verificar se já existe NF-e de retorno ativa
      const existingRetorno = await prisma.productInvoice.findFirst({
        where: {
          productInvoiceRefId: remessaId,
          type: 'RETORNO_LOCACAO',
          status: { in: ['PENDING', 'PROCESSING', 'AUTHORIZED'] }
        }
      })

      if (existingRetorno) {
        return {
          success: false,
          error: 'Já existe uma NF-e de retorno ativa para esta remessa'
        }
      }

      // Filtrar itens se especificado
      let items = remessa.items
      if (equipmentIds && equipmentIds.length > 0) {
        items = items.filter(item => equipmentIds.includes(item.equipmentId))
      }

      if (items.length === 0) {
        return {
          success: false,
          error: 'Nenhum equipamento selecionado para o retorno'
        }
      }

      // Buscar tenant e config fiscal
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { fiscalConfig: true }
      })

      if (!tenant || !tenant.fiscalConfig) {
        return {
          success: false,
          error: 'Configuração fiscal não encontrada'
        }
      }

      // Usar endereço da remessa (invertendo emitente/destinatário)
      const deliveryAddress = remessa.destEndereco as {
        logradouro?: string
        numero?: string
        complemento?: string
        bairro?: string
        cidade?: string
        uf?: string
        cep?: string
        codigoMunicipio?: string
      } | null

      // Construir payload de retorno
      const payload = buildNfePayload({
        type: 'RETORNO_LOCACAO',
        tenant: {
          cnpj: tenant.cnpj!,
          name: tenant.name,
          tradeName: tenant.tradeName || undefined,
          inscricaoEstadual: tenant.inscricaoEstadual!,
          inscricaoMunicipal: tenant.inscricaoMunicipal || undefined,
          regimeTributario: tenant.regimeTributario || undefined,
          codigoMunicipio: tenant.codigoMunicipio || undefined,
          street: tenant.street || undefined,
          number: tenant.number || undefined,
          complement: tenant.complement || undefined,
          neighborhood: tenant.neighborhood || undefined,
          city: tenant.city || undefined,
          state: tenant.state || undefined,
          zipCode: tenant.zipCode || undefined,
          phone: tenant.phone || undefined,
        },
        customer: {
          name: remessa.destNome,
          cpfCnpj: remessa.destCpfCnpj,
          inscricaoEstadual: remessa.destInscricaoEstadual || undefined,
          street: deliveryAddress?.logradouro,
          number: deliveryAddress?.numero,
          complement: deliveryAddress?.complemento,
          neighborhood: deliveryAddress?.bairro,
          city: deliveryAddress?.cidade,
          state: deliveryAddress?.uf,
          zipCode: deliveryAddress?.cep,
          ibgeCode: deliveryAddress?.codigoMunicipio,
        },
        equipments: items.map(item => ({
          id: item.equipmentId,
          name: item.descricao,
          ncm: item.ncm,
          codigoProduto: item.codigoProduto,
          unitPrice: item.valorUnitario,
          quantity: item.quantidade,
        })),
        config: {
          cfopRemessaDentroEstado: tenant.fiscalConfig.cfopRemessaDentroEstado,
          cfopRemessaForaEstado: tenant.fiscalConfig.cfopRemessaForaEstado,
          cfopRetornoDentroEstado: tenant.fiscalConfig.cfopRetornoDentroEstado,
          cfopRetornoForaEstado: tenant.fiscalConfig.cfopRetornoForaEstado,
          icmsCstPadrao: tenant.fiscalConfig.icmsCstPadrao,
          icmsOrigemPadrao: tenant.fiscalConfig.icmsOrigemPadrao,
        },
        bookingNumber: remessa.booking.bookingNumber,
        nfeReferenciada: remessa.chaveAcesso,
      })

      // Gerar referência única
      const internalRef = `nfe-${nanoid(12)}`

      // Calcular totais
      const valorProdutos = items.reduce((sum, item) => sum + item.valorTotal, 0)

      // Criar registro no banco
      const productInvoice = await prisma.productInvoice.create({
        data: {
          internalRef,
          type: 'RETORNO_LOCACAO',
          status: 'PENDING',
          naturezaOperacao: 'Retorno de locacao',
          cfop: payload.items[0].cfop,
          valorProdutos,
          valorTotal: valorProdutos,
          nfeReferenciada: remessa.chaveAcesso,
          productInvoiceRefId: remessaId,
          destNome: remessa.destNome,
          destCpfCnpj: remessa.destCpfCnpj,
          destInscricaoEstadual: remessa.destInscricaoEstadual,
          destEndereco: remessa.destEndereco ?? undefined,
          bookingId: remessa.bookingId,
          tenantId,
          items: {
            create: items.map((item, index) => ({
              equipmentId: item.equipmentId,
              numeroItem: index + 1,
              codigoProduto: item.codigoProduto,
              descricao: item.descricao,
              ncm: item.ncm,
              cfop: payload.items[0].cfop,
              quantidade: item.quantidade,
              valorUnitario: item.valorUnitario,
              valorTotal: item.valorTotal,
            }))
          }
        }
      })

      // Enviar para Focus NFe
      const token = decryptToken(tenant.fiscalConfig.focusNfeToken!)
      const client = new FocusNfeClient({
        token,
        environment: tenant.fiscalConfig.focusNfeEnvironment as 'HOMOLOGACAO' | 'PRODUCAO'
      })

      try {
        const response = await client.emitirNfe(internalRef, payload)

        // Atualizar com resposta
        await prisma.productInvoice.update({
          where: { id: productInvoice.id },
          data: {
            status: this.mapFocusStatus(response.status),
            focusNfeStatus: response.status,
            numero: response.numero,
            serie: response.serie,
            chaveAcesso: response.chave_nfe,
            protocoloAutorizacao: response.protocolo,
            xmlUrl: response.caminho_xml_nota_fiscal,
            pdfUrl: response.caminho_danfe,
            dataAutorizacao: response.status === 'autorizado' ? new Date() : undefined,
            emittedAt: response.status === 'autorizado' ? new Date() : undefined,
          }
        })

        return {
          success: true,
          productInvoice: {
            id: productInvoice.id,
            internalRef,
            status: this.mapFocusStatus(response.status),
            chaveAcesso: response.chave_nfe,
            numero: response.numero,
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

        await prisma.productInvoice.update({
          where: { id: productInvoice.id },
          data: {
            status: 'ERROR',
            errorMessage,
          }
        })

        return {
          success: false,
          error: errorMessage,
          productInvoice: {
            id: productInvoice.id,
            internalRef,
            status: 'ERROR',
          }
        }
      }
    } catch (error) {
      console.error('[NF-e] Erro ao criar retorno:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar NF-e de retorno'
      }
    }
  }

  /**
   * Sincroniza o status de uma NF-e com a SEFAZ
   */
  async syncStatus(productInvoiceId: string, tenantId: string): Promise<ProductInvoiceStatus> {
    const invoice = await prisma.productInvoice.findFirst({
      where: { id: productInvoiceId, tenantId },
      include: {
        tenant: {
          include: { fiscalConfig: true }
        }
      }
    })

    if (!invoice) {
      throw new Error('NF-e não encontrada')
    }

    // Não sincronizar se já está em status final
    const finalStatuses: ProductInvoiceStatus[] = ['AUTHORIZED', 'CANCELLED', 'REJECTED', 'DENEGADA']
    if (finalStatuses.includes(invoice.status as ProductInvoiceStatus)) {
      return invoice.status as ProductInvoiceStatus
    }

    if (!invoice.tenant.fiscalConfig?.focusNfeToken) {
      throw new Error('Token Focus NFe não configurado')
    }

    const token = decryptToken(invoice.tenant.fiscalConfig.focusNfeToken)
    const client = new FocusNfeClient({
      token,
      environment: invoice.tenant.fiscalConfig.focusNfeEnvironment as 'HOMOLOGACAO' | 'PRODUCAO'
    })

    const response = await client.consultarNfe(invoice.internalRef)
    const newStatus = this.mapFocusStatus(response.status)

    await prisma.productInvoice.update({
      where: { id: productInvoiceId },
      data: {
        status: newStatus,
        focusNfeStatus: response.status,
        numero: response.numero || invoice.numero,
        serie: response.serie || invoice.serie,
        chaveAcesso: response.chave_nfe || invoice.chaveAcesso,
        protocoloAutorizacao: response.protocolo || invoice.protocoloAutorizacao,
        xmlUrl: response.caminho_xml_nota_fiscal || invoice.xmlUrl,
        pdfUrl: response.caminho_danfe || invoice.pdfUrl,
        dataAutorizacao: response.status === 'autorizado' ? new Date() : invoice.dataAutorizacao,
        emittedAt: response.status === 'autorizado' ? new Date() : invoice.emittedAt,
      }
    })

    return newStatus
  }

  /**
   * Cancela uma NF-e autorizada
   */
  async cancel(
    productInvoiceId: string,
    tenantId: string,
    justificativa: string
  ): Promise<void> {
    const invoice = await prisma.productInvoice.findFirst({
      where: { id: productInvoiceId, tenantId },
      include: {
        tenant: {
          include: { fiscalConfig: true }
        }
      }
    })

    if (!invoice) {
      throw new Error('NF-e não encontrada')
    }

    if (invoice.status !== 'AUTHORIZED') {
      throw new Error('Apenas NF-e autorizadas podem ser canceladas')
    }

    if (!invoice.tenant.fiscalConfig?.focusNfeToken) {
      throw new Error('Token Focus NFe não configurado')
    }

    const token = decryptToken(invoice.tenant.fiscalConfig.focusNfeToken)
    const client = new FocusNfeClient({
      token,
      environment: invoice.tenant.fiscalConfig.focusNfeEnvironment as 'HOMOLOGACAO' | 'PRODUCAO'
    })

    const response = await client.cancelarNfe(invoice.internalRef, justificativa)

    await prisma.productInvoice.update({
      where: { id: productInvoiceId },
      data: {
        status: 'CANCELLED',
        focusNfeStatus: response.status,
        cancelledAt: new Date(),
        cancellationProtocol: response.protocolo,
        cancellationReason: justificativa,
      }
    })
  }

  /**
   * Emite carta de correção para uma NF-e
   */
  async cartaCorrecao(
    productInvoiceId: string,
    tenantId: string,
    correcao: string
  ): Promise<void> {
    const invoice = await prisma.productInvoice.findFirst({
      where: { id: productInvoiceId, tenantId },
      include: {
        tenant: {
          include: { fiscalConfig: true }
        }
      }
    })

    if (!invoice) {
      throw new Error('NF-e não encontrada')
    }

    if (invoice.status !== 'AUTHORIZED') {
      throw new Error('Carta de correção só pode ser emitida para NF-e autorizadas')
    }

    if (!invoice.tenant.fiscalConfig?.focusNfeToken) {
      throw new Error('Token Focus NFe não configurado')
    }

    const token = decryptToken(invoice.tenant.fiscalConfig.focusNfeToken)
    const client = new FocusNfeClient({
      token,
      environment: invoice.tenant.fiscalConfig.focusNfeEnvironment as 'HOMOLOGACAO' | 'PRODUCAO'
    })

    await client.cartaCorrecaoNfe(invoice.internalRef, correcao)
  }

  /**
   * Mapeia status do Focus NFe para status interno
   */
  private mapFocusStatus(focusStatus: FocusNfeNfeResponse['status']): ProductInvoiceStatus {
    switch (focusStatus) {
      case 'autorizado':
        return 'AUTHORIZED'
      case 'cancelado':
        return 'CANCELLED'
      case 'erro_autorizacao':
        return 'REJECTED'
      case 'uso_denegado':
        return 'DENEGADA'
      case 'processando_autorizacao':
      default:
        return 'PROCESSING'
    }
  }
}

// Instância singleton
export const nfeService = new NfeService()
