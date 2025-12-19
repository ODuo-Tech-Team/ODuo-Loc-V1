// Tipos para integração fiscal - Focus NFe NFS-e

export type InvoiceStatus =
  | 'PENDING'      // Criada, aguardando envio
  | 'PROCESSING'   // Enviada ao Focus NFe, aguardando processamento
  | 'AUTHORIZED'   // Autorizada pela prefeitura
  | 'REJECTED'     // Rejeitada pela prefeitura
  | 'CANCELLED'    // Cancelada
  | 'ERROR'        // Erro no processamento

export type FocusNfeEnvironment = 'HOMOLOGACAO' | 'PRODUCAO'

export type RegimeTributario =
  | 'SIMPLES_NACIONAL'
  | 'SIMPLES_NACIONAL_EXCESSO'
  | 'LUCRO_PRESUMIDO'
  | 'LUCRO_REAL'
  | 'MEI'

// Payload para emissão de NFS-e Municipal (sistema antigo)
export interface NfsePayload {
  data_emissao: string // ISO 8601
  natureza_operacao: number // 1 = Tributação no município
  optante_simples_nacional: boolean
  regime_especial_tributacao?: number // 1-6 (opcional - não enviar para Lucro Presumido/Real)
  serie?: string // Série da NFS-e (configurada por tenant)

  prestador: {
    cnpj: string
    inscricao_municipal: string
    codigo_municipio: string
  }

  tomador: {
    cpf?: string
    cnpj?: string
    razao_social: string
    email?: string
    telefone?: string
    endereco?: {
      logradouro: string
      numero: string
      complemento?: string
      bairro: string
      codigo_municipio: string
      uf: string
      cep: string
    }
  }

  servico: {
    valor_servicos: number
    discriminacao: string
    codigo_tributacao_nacional_iss?: string // Código de 6 dígitos do Sistema Nacional NFS-e
    item_lista_servico?: string
    codigo_tributario_municipio?: string
    aliquota: number
    iss_retido: boolean
    valor_iss?: number
    valor_deducoes?: number
  }
}

// Payload para emissão de NFS-e Nacional (novo sistema)
export interface NfseNacionalPayload {
  data_emissao: string // ISO 8601
  data_competencia?: string // YYYY-MM-DD
  codigo_municipio_emissora: string // Código IBGE 7 dígitos

  // Prestador (campos diferentes da NFSe municipal)
  cnpj_prestador?: string
  cpf_prestador?: string
  inscricao_municipal_prestador: string
  codigo_opcao_simples_nacional?: number // 1=Sim, 2=Não
  regime_especial_tributacao?: number

  // Tomador
  cnpj_tomador?: string
  cpf_tomador?: string
  razao_social_tomador: string
  codigo_municipio_tomador?: string
  cep_tomador?: string
  logradouro_tomador?: string
  numero_tomador?: string
  complemento_tomador?: string
  bairro_tomador?: string
  telefone_tomador?: string
  email_tomador?: string

  // Serviço
  codigo_municipio_prestacao: string
  codigo_tributacao_nacional_iss: string
  descricao_servico: string
  valor_servico: number
  tributacao_iss?: number // 1=Tributável, 2=Não tributável, etc
  tipo_retencao_iss?: number // 1=Retido, 2=Não retido
}

// Resposta do Focus NFe
export interface FocusNfeResponse {
  status: 'processando_autorizacao' | 'autorizado' | 'erro_autorizacao' | 'cancelado'
  status_sefaz?: string
  mensagem_sefaz?: string

  // Dados da NFS-e autorizada
  numero?: string
  codigo_verificacao?: string
  data_emissao?: string

  // URLs dos documentos
  url?: string           // URL do XML
  caminho_xml_nota_fiscal?: string
  url_danfse?: string    // URL do PDF (DANFSE)

  // Erros
  erros?: FocusNfeError[]
}

export interface FocusNfeError {
  codigo: string
  mensagem: string
  correcao?: string
}

// Dados para construir descrição do serviço a partir do template
export interface TemplateVariables {
  bookingNumber: string
  startDate: string
  endDate: string
  totalDays: number
  customerName: string
  itemsList: string
  totalPrice: string
}

// Configuração do tenant para emissão
export interface TenantFiscalData {
  cnpj: string
  inscricaoMunicipal: string
  codigoMunicipio: string
  regimeTributario?: string

  focusNfeToken: string
  focusNfeEnvironment: FocusNfeEnvironment

  codigoServico?: string
  aliquotaIss: number
  issRetido: boolean
  descricaoTemplate?: string
}

// Dados do tomador (cliente)
export interface TomadorData {
  nome: string
  cpfCnpj?: string
  email?: string
  telefone?: string
  endereco?: {
    logradouro?: string
    numero?: string
    complemento?: string
    bairro?: string
    cidade?: string
    codigoMunicipio?: string
    uf?: string
    cep?: string
  }
}

// Resultado da criação de invoice
export interface CreateInvoiceResult {
  success: boolean
  invoice?: {
    id: string
    internalRef: string
    status: InvoiceStatus
  }
  error?: string
  focusNfeErrors?: FocusNfeError[]
}

// ============================================
// Tipos para NF-e (Nota Fiscal Eletrônica de Produto)
// ============================================

export type ProductInvoiceType = 'REMESSA_LOCACAO' | 'RETORNO_LOCACAO'

export type ProductInvoiceStatus =
  | 'PENDING'      // Aguardando envio
  | 'PROCESSING'   // Enviada, aguardando SEFAZ
  | 'AUTHORIZED'   // Autorizada
  | 'REJECTED'     // Rejeitada pela SEFAZ
  | 'CANCELLED'    // Cancelada
  | 'DENEGADA'     // Uso denegado
  | 'ERROR'        // Erro no processamento

// Item da NF-e
export interface NfeItem {
  numero_item: number
  codigo_produto: string
  descricao: string
  codigo_ncm: string
  cfop: string
  unidade_comercial: string
  quantidade_comercial: number
  valor_unitario_comercial: number
  valor_bruto: number
  inclui_no_total: number // 1 = sim

  // ICMS
  icms_origem: string // 0=Nacional
  icms_situacao_tributaria: string // CST ou CSOSN
  icms_base_calculo?: number
  icms_aliquota?: number
  icms_valor?: number

  // PIS/COFINS
  pis_situacao_tributaria: string // 08=Sem incidência
  cofins_situacao_tributaria: string // 08=Sem incidência
}

// Payload para emissão de NF-e (Focus NFe)
export interface NfePayload {
  // Identificação
  natureza_operacao: string // "Remessa para locacao" / "Retorno de locacao"
  tipo_documento: number // 0=Entrada, 1=Saída
  finalidade_emissao: number // 1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução
  consumidor_final: number // 0=Não, 1=Sim
  presenca_comprador: number // 0=Não se aplica, 9=Outros

  // Emitente
  cnpj_emitente: string
  nome_emitente: string
  nome_fantasia_emitente?: string
  inscricao_estadual_emitente: string
  inscricao_municipal_emitente?: string
  codigo_regime_tributario?: number // 1=Simples Nacional, 3=Normal
  logradouro_emitente: string
  numero_emitente: string
  complemento_emitente?: string
  bairro_emitente: string
  municipio_emitente: string
  uf_emitente: string
  cep_emitente: string
  codigo_municipio_emitente: string
  telefone_emitente?: string

  // Destinatário
  cnpj_destinatario?: string
  cpf_destinatario?: string
  nome_destinatario: string
  inscricao_estadual_destinatario?: string
  indicador_inscricao_estadual_destinatario: number // 1=Contribuinte, 2=Isento, 9=Não contribuinte
  logradouro_destinatario: string
  numero_destinatario: string
  complemento_destinatario?: string
  bairro_destinatario: string
  municipio_destinatario: string
  uf_destinatario: string
  cep_destinatario: string
  codigo_municipio_destinatario: string
  telefone_destinatario?: string
  email_destinatario?: string

  // Itens
  items: NfeItem[]

  // Valores totais
  valor_produtos: number
  valor_frete?: number
  valor_seguro?: number
  valor_desconto?: number
  valor_total: number
  icms_base_calculo?: number
  icms_valor_total?: number

  // Frete
  modalidade_frete: number // 0=Emitente, 1=Destinatário, 2=Terceiros, 9=Sem frete

  // Notas referenciadas (para retorno de locação)
  notas_referenciadas?: Array<{
    chave_nfe?: string
    // Ou referência a nota modelo 1/1A
    cnpj_emitente?: string
    uf_emitente?: string
    data_emissao?: string
    modelo?: string
    serie?: string
    numero?: string
  }>

  // Informações adicionais
  informacoes_adicionais_contribuinte?: string
  informacoes_adicionais_fisco?: string
}

// Resposta do Focus NFe para NF-e
export interface FocusNfeNfeResponse {
  status: 'processando_autorizacao' | 'autorizado' | 'erro_autorizacao' | 'cancelado' | 'uso_denegado'
  status_sefaz?: string
  mensagem_sefaz?: string

  // Dados da NF-e autorizada
  numero?: string
  serie?: string
  chave_nfe?: string
  protocolo?: string
  data_emissao?: string

  // URLs dos documentos
  caminho_xml_nota_fiscal?: string
  caminho_danfe?: string

  // Erros
  erros?: FocusNfeError[]
}

// Resultado da criação de NF-e de produto
export interface CreateProductInvoiceResult {
  success: boolean
  productInvoice?: {
    id: string
    internalRef: string
    status: ProductInvoiceStatus
    chaveAcesso?: string
    numero?: string
  }
  error?: string
  focusNfeErrors?: FocusNfeError[]
}

// Configuração NF-e do tenant
export interface TenantNfeConfig {
  // Certificado Digital
  hasCertificado: boolean
  certificadoValidade?: Date

  // Configuração
  nfeSerie: string
  nfeProximoNumero: number

  // CFOPs padrão
  cfopRemessaDentroEstado: string
  cfopRemessaForaEstado: string
  cfopRetornoDentroEstado: string
  cfopRetornoForaEstado: string

  // CST padrão
  icmsCstPadrao: string
  icmsOrigemPadrao: string
}

// Dados para emissão de NF-e de remessa
export interface RemessaData {
  bookingId: string
  equipmentIds?: string[] // Se não informado, usa todos os itens do booking
}

// Dados para emissão de NF-e de retorno
export interface RetornoData {
  remessaId: string // ID da NF-e de remessa
  equipmentIds?: string[] // Se não informado, usa todos os itens da remessa
}
