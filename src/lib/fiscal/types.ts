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
  regime_especial_tributacao: number // 1-6

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
