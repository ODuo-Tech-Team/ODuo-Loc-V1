// Builder de payload para NF-e (Nota Fiscal Eletrônica de Produto)

import type {
  NfePayload,
  NfeItem,
  ProductInvoiceType,
} from './types'
import { onlyNumbers } from './validators'

interface TenantData {
  cnpj: string
  name: string
  tradeName?: string
  inscricaoEstadual?: string
  inscricaoMunicipal?: string
  regimeTributario?: string
  codigoMunicipio?: string
  // Endereço
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  zipCode?: string
  phone?: string
}

interface CustomerData {
  name: string
  cpfCnpj?: string
  inscricaoEstadual?: string
  isIsentoIE?: boolean
  // Endereço
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  zipCode?: string
  ibgeCode?: string
  phone?: string
  email?: string
}

interface EquipmentData {
  id: string
  name: string
  ncm?: string
  codigoProduto?: string
  unitPrice: number
  quantity: number
}

interface NfeConfig {
  cfopRemessaDentroEstado: string
  cfopRemessaForaEstado: string
  cfopRetornoDentroEstado: string
  cfopRetornoForaEstado: string
  icmsCstPadrao: string
  icmsOrigemPadrao: string
}

interface BuildPayloadOptions {
  type: ProductInvoiceType
  tenant: TenantData
  customer: CustomerData
  equipments: EquipmentData[]
  config: NfeConfig
  bookingNumber: string
  nfeReferenciada?: string // Chave da NF-e de remessa (para retorno)
}

/**
 * Determina o CFOP baseado no tipo de operação e UF
 */
function getCfop(
  type: ProductInvoiceType,
  ufEmitente: string,
  ufDestinatario: string,
  config: NfeConfig
): string {
  const isInterestadual = ufEmitente !== ufDestinatario

  if (type === 'REMESSA_LOCACAO') {
    return isInterestadual
      ? config.cfopRemessaForaEstado
      : config.cfopRemessaDentroEstado
  } else {
    return isInterestadual
      ? config.cfopRetornoForaEstado
      : config.cfopRetornoDentroEstado
  }
}

/**
 * Determina a natureza da operação
 */
function getNaturezaOperacao(type: ProductInvoiceType): string {
  return type === 'REMESSA_LOCACAO'
    ? 'Remessa para locacao'
    : 'Retorno de locacao'
}

/**
 * Determina o tipo de documento (0=Entrada, 1=Saída)
 */
function getTipoDocumento(type: ProductInvoiceType): number {
  // Remessa é saída (1), Retorno é entrada (0)
  return type === 'REMESSA_LOCACAO' ? 1 : 0
}

/**
 * Determina o indicador de IE do destinatário
 */
function getIndicadorIE(customer: CustomerData): number {
  if (customer.inscricaoEstadual) {
    return 1 // Contribuinte ICMS
  }
  if (customer.isIsentoIE) {
    return 2 // Isento de IE
  }
  return 9 // Não contribuinte
}

/**
 * Determina o regime tributário
 */
function getCodigoRegimeTributario(regimeTributario?: string): number | undefined {
  switch (regimeTributario) {
    case 'SIMPLES_NACIONAL':
    case 'MEI':
      return 1
    case 'SIMPLES_NACIONAL_EXCESSO':
      return 2
    case 'LUCRO_PRESUMIDO':
    case 'LUCRO_REAL':
      return 3
    default:
      return undefined
  }
}

/**
 * Constrói os itens da NF-e
 */
function buildItems(
  equipments: EquipmentData[],
  cfop: string,
  config: NfeConfig
): NfeItem[] {
  return equipments.map((equip, index) => {
    const valorTotal = equip.unitPrice * equip.quantity

    return {
      numero_item: index + 1,
      codigo_produto: equip.codigoProduto || equip.id.slice(0, 20),
      descricao: equip.name,
      codigo_ncm: onlyNumbers(equip.ncm || '00000000'),
      cfop,
      unidade_comercial: 'UN',
      quantidade_comercial: equip.quantity,
      valor_unitario_comercial: equip.unitPrice,
      valor_bruto: valorTotal,
      inclui_no_total: 1,

      // ICMS - Não tributado para locação
      icms_origem: config.icmsOrigemPadrao,
      icms_situacao_tributaria: config.icmsCstPadrao,
      icms_base_calculo: 0,
      icms_aliquota: 0,
      icms_valor: 0,

      // PIS/COFINS - Sem incidência
      pis_situacao_tributaria: '08',
      cofins_situacao_tributaria: '08',
    }
  })
}

/**
 * Constrói o payload completo para emissão de NF-e
 */
export function buildNfePayload(options: BuildPayloadOptions): NfePayload {
  const { type, tenant, customer, equipments, config, bookingNumber, nfeReferenciada } = options

  // Validações
  if (!tenant.cnpj) {
    throw new Error('CNPJ do emitente não configurado')
  }
  if (!tenant.inscricaoEstadual) {
    throw new Error('Inscrição Estadual do emitente não configurada')
  }
  if (!customer.cpfCnpj) {
    throw new Error('CPF/CNPJ do destinatário não informado')
  }
  if (!customer.street || !customer.city || !customer.state) {
    throw new Error('Endereço completo do destinatário é obrigatório para NF-e')
  }

  // Verificar NCM dos equipamentos
  for (const equip of equipments) {
    if (!equip.ncm) {
      throw new Error(`NCM não cadastrado para o equipamento: ${equip.name}`)
    }
  }

  const ufEmitente = tenant.state || 'SP'
  const ufDestinatario = customer.state || 'SP'
  const cfop = getCfop(type, ufEmitente, ufDestinatario, config)

  const items = buildItems(equipments, cfop, config)

  // Calcular totais
  const valorProdutos = items.reduce((sum, item) => sum + item.valor_bruto, 0)
  const valorTotal = valorProdutos

  // Construir payload
  const payload: NfePayload = {
    // Identificação
    natureza_operacao: getNaturezaOperacao(type),
    data_emissao: new Date().toISOString(),
    tipo_documento: getTipoDocumento(type),
    finalidade_emissao: 1, // 1 = Normal
    consumidor_final: 0, // 0 = Não (empresa)
    presenca_comprador: 9, // 9 = Outros

    // Emitente
    cnpj_emitente: onlyNumbers(tenant.cnpj),
    nome_emitente: tenant.name,
    nome_fantasia_emitente: tenant.tradeName,
    inscricao_estadual_emitente: onlyNumbers(tenant.inscricaoEstadual),
    inscricao_municipal_emitente: tenant.inscricaoMunicipal
      ? onlyNumbers(tenant.inscricaoMunicipal)
      : undefined,
    codigo_regime_tributario: getCodigoRegimeTributario(tenant.regimeTributario),
    logradouro_emitente: tenant.street || '',
    numero_emitente: tenant.number || 'S/N',
    complemento_emitente: tenant.complement,
    bairro_emitente: tenant.neighborhood || '',
    municipio_emitente: tenant.city || '',
    uf_emitente: ufEmitente,
    cep_emitente: onlyNumbers(tenant.zipCode || ''),
    codigo_municipio_emitente: tenant.codigoMunicipio || '',
    telefone_emitente: tenant.phone ? onlyNumbers(tenant.phone) : undefined,

    // Destinatário - limpar formatação ANTES de verificar tamanho
    ...(() => {
      const cleanDoc = onlyNumbers(customer.cpfCnpj)
      return cleanDoc.length === 11
        ? { cpf_destinatario: cleanDoc }
        : { cnpj_destinatario: cleanDoc }
    })(),
    nome_destinatario: customer.name,
    inscricao_estadual_destinatario: customer.inscricaoEstadual
      ? onlyNumbers(customer.inscricaoEstadual)
      : undefined,
    indicador_inscricao_estadual_destinatario: getIndicadorIE(customer),
    logradouro_destinatario: customer.street || '',
    numero_destinatario: customer.number || 'S/N',
    complemento_destinatario: customer.complement,
    bairro_destinatario: customer.neighborhood || '',
    municipio_destinatario: customer.city || '',
    uf_destinatario: ufDestinatario,
    cep_destinatario: onlyNumbers(customer.zipCode || ''),
    codigo_municipio_destinatario: customer.ibgeCode || '',
    telefone_destinatario: customer.phone ? onlyNumbers(customer.phone) : undefined,
    email_destinatario: customer.email,

    // Itens
    items,

    // Valores totais
    valor_produtos: valorProdutos,
    valor_total: valorTotal,
    icms_base_calculo: 0,
    icms_valor_total: 0,

    // Frete
    modalidade_frete: 9, // 9 = Sem frete

    // Informações adicionais
    informacoes_adicionais_contribuinte:
      `Equipamento em locacao conforme reserva #${bookingNumber}. ` +
      `CFOP ${cfop} - ${getNaturezaOperacao(type)}.`,
  }

  // Se for retorno, adicionar referência à NF-e de remessa
  if (type === 'RETORNO_LOCACAO' && nfeReferenciada) {
    payload.notas_referenciadas = [
      { chave_nfe: nfeReferenciada }
    ]
    payload.informacoes_adicionais_contribuinte +=
      ` Retorno referente a NF-e chave: ${nfeReferenciada}.`
  }

  return payload
}

/**
 * Valida os dados mínimos para emissão de NF-e
 */
export function validateNfeData(options: Partial<BuildPayloadOptions>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Tenant
  if (!options.tenant?.cnpj) {
    errors.push('CNPJ do emitente não configurado')
  }
  if (!options.tenant?.inscricaoEstadual) {
    errors.push('Inscrição Estadual do emitente não configurada')
  }
  if (!options.tenant?.street || !options.tenant?.city || !options.tenant?.state) {
    errors.push('Endereço completo do emitente é obrigatório')
  }
  if (!options.tenant?.codigoMunicipio) {
    errors.push('Código do município (IBGE) do emitente não configurado')
  }

  // Customer
  if (!options.customer?.cpfCnpj) {
    errors.push('CPF/CNPJ do destinatário não informado')
  }
  if (!options.customer?.street || !options.customer?.city || !options.customer?.state) {
    errors.push('Endereço completo do destinatário é obrigatório')
  }
  if (!options.customer?.ibgeCode) {
    errors.push('Código do município (IBGE) do destinatário não informado')
  }

  // Equipments
  if (!options.equipments || options.equipments.length === 0) {
    errors.push('Nenhum equipamento selecionado')
  } else {
    for (const equip of options.equipments) {
      if (!equip.ncm) {
        errors.push(`NCM não cadastrado para o equipamento: ${equip.name}`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
