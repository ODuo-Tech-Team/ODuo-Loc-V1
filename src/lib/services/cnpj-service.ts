/**
 * Serviço de consulta de CNPJ com fallback para múltiplas APIs
 * APIs utilizadas (em ordem de prioridade):
 * 1. BrasilAPI (https://brasilapi.com.br/docs#tag/CNPJ)
 * 2. ReceitaWS (https://receitaws.com.br)
 */

export interface CNPJData {
  cnpj: string
  razaoSocial: string
  nomeFantasia: string | null
  situacaoCadastral: string
  dataSituacaoCadastral: string | null
  dataAbertura: string | null
  naturezaJuridica: string | null
  porte: string | null
  capitalSocial: number | null
  cnaePrincipal: {
    codigo: string
    descricao: string
  } | null
  cnaesSecundarios: Array<{
    codigo: string
    descricao: string
  }>
  endereco: {
    logradouro: string | null
    numero: string | null
    complemento: string | null
    bairro: string | null
    cidade: string | null
    uf: string | null
    cep: string | null
    codigoMunicipio: string | null
  }
  telefones: string[]
  email: string | null
  socios: Array<{
    nome: string
    qualificacao: string
  }>
}

export interface CNPJError {
  error: true
  message: string
  code?: string
}

export type CNPJResult = CNPJData | CNPJError

/**
 * Remove caracteres não numéricos do CNPJ
 */
export function cleanCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, "")
}

/**
 * Valida se o CNPJ tem 14 dígitos
 */
export function isValidCNPJFormat(cnpj: string): boolean {
  const cleaned = cleanCNPJ(cnpj)
  return cleaned.length === 14
}

/**
 * Consulta CNPJ usando a BrasilAPI
 */
async function consultarBrasilAPI(cleanedCNPJ: string): Promise<CNPJResult | null> {
  try {
    const url = `https://brasilapi.com.br/api/cnpj/v1/${cleanedCNPJ}`
    console.log("[CNPJ Service] Tentando BrasilAPI:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })

    console.log("[CNPJ Service] BrasilAPI status:", response.status)

    if (!response.ok) {
      console.log("[CNPJ Service] BrasilAPI falhou, status:", response.status)
      return null // Tentar próxima API
    }

    const data = await response.json()
    console.log("[CNPJ Service] BrasilAPI sucesso!")

    return {
      cnpj: cleanedCNPJ,
      razaoSocial: data.razao_social || "",
      nomeFantasia: data.nome_fantasia || null,
      situacaoCadastral: data.descricao_situacao_cadastral || "Desconhecida",
      dataSituacaoCadastral: data.data_situacao_cadastral || null,
      dataAbertura: data.data_inicio_atividade || null,
      naturezaJuridica: data.natureza_juridica || null,
      porte: data.porte || null,
      capitalSocial: data.capital_social ? parseFloat(data.capital_social) : null,
      cnaePrincipal: data.cnae_fiscal ? {
        codigo: String(data.cnae_fiscal),
        descricao: data.cnae_fiscal_descricao || "",
      } : null,
      cnaesSecundarios: Array.isArray(data.cnaes_secundarios)
        ? data.cnaes_secundarios
            .filter((cnae: { codigo: number }) => cnae.codigo > 0)
            .map((cnae: { codigo: number; descricao: string }) => ({
              codigo: String(cnae.codigo),
              descricao: cnae.descricao || "",
            }))
        : [],
      endereco: {
        logradouro: data.descricao_tipo_de_logradouro && data.logradouro
          ? `${data.descricao_tipo_de_logradouro} ${data.logradouro}`
          : data.logradouro || null,
        numero: data.numero || null,
        complemento: data.complemento || null,
        bairro: data.bairro || null,
        cidade: data.municipio || null,
        uf: data.uf || null,
        cep: data.cep || null,
        codigoMunicipio: data.codigo_municipio_ibge ? String(data.codigo_municipio_ibge) : null,
      },
      telefones: [data.ddd_telefone_1, data.ddd_telefone_2]
        .filter(Boolean)
        .map(t => t.replace(/\D/g, "")),
      email: data.email || null,
      socios: Array.isArray(data.qsa)
        ? data.qsa.map((socio: { nome_socio: string; qualificacao_socio?: string }) => ({
            nome: socio.nome_socio,
            qualificacao: socio.qualificacao_socio || "",
          }))
        : [],
    }
  } catch (error) {
    console.error("[CNPJ Service] Erro BrasilAPI:", error)
    return null
  }
}

/**
 * Consulta CNPJ usando a ReceitaWS (fallback)
 */
async function consultarReceitaWS(cleanedCNPJ: string): Promise<CNPJResult | null> {
  try {
    const url = `https://receitaws.com.br/v1/cnpj/${cleanedCNPJ}`
    console.log("[CNPJ Service] Tentando ReceitaWS:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })

    console.log("[CNPJ Service] ReceitaWS status:", response.status)

    if (!response.ok) {
      console.log("[CNPJ Service] ReceitaWS falhou, status:", response.status)
      return null
    }

    const data = await response.json()

    // ReceitaWS retorna status "ERROR" dentro do JSON quando não encontra
    if (data.status === "ERROR") {
      console.log("[CNPJ Service] ReceitaWS retornou erro:", data.message)
      return null
    }

    console.log("[CNPJ Service] ReceitaWS sucesso!")

    return {
      cnpj: cleanedCNPJ,
      razaoSocial: data.nome || "",
      nomeFantasia: data.fantasia || null,
      situacaoCadastral: data.situacao || "Desconhecida",
      dataSituacaoCadastral: data.data_situacao || null,
      dataAbertura: data.abertura || null,
      naturezaJuridica: data.natureza_juridica || null,
      porte: data.porte || null,
      capitalSocial: data.capital_social ? parseFloat(data.capital_social.replace(/\./g, "").replace(",", ".")) : null,
      cnaePrincipal: data.atividade_principal?.[0] ? {
        codigo: data.atividade_principal[0].code?.replace(/[^\d]/g, "") || "",
        descricao: data.atividade_principal[0].text || "",
      } : null,
      cnaesSecundarios: Array.isArray(data.atividades_secundarias)
        ? data.atividades_secundarias.map((cnae: { code: string; text: string }) => ({
            codigo: cnae.code?.replace(/[^\d]/g, "") || "",
            descricao: cnae.text || "",
          }))
        : [],
      endereco: {
        logradouro: data.logradouro || null,
        numero: data.numero || null,
        complemento: data.complemento || null,
        bairro: data.bairro || null,
        cidade: data.municipio || null,
        uf: data.uf || null,
        cep: data.cep?.replace(/[^\d]/g, "") || null,
        codigoMunicipio: null, // ReceitaWS não retorna código IBGE
      },
      telefones: data.telefone ? [data.telefone.replace(/\D/g, "")] : [],
      email: data.email || null,
      socios: Array.isArray(data.qsa)
        ? data.qsa.map((socio: { nome: string; qual: string }) => ({
            nome: socio.nome,
            qualificacao: socio.qual || "",
          }))
        : [],
    }
  } catch (error) {
    console.error("[CNPJ Service] Erro ReceitaWS:", error)
    return null
  }
}

export async function consultarCNPJ(cnpj: string): Promise<CNPJResult> {
  const cleanedCNPJ = cleanCNPJ(cnpj)

  if (!isValidCNPJFormat(cleanedCNPJ)) {
    return {
      error: true,
      message: "CNPJ deve ter 14 dígitos",
      code: "INVALID_FORMAT",
    }
  }

  console.log("[CNPJ Service] Iniciando consulta CNPJ:", cleanedCNPJ)

  // Tentar BrasilAPI primeiro
  let result = await consultarBrasilAPI(cleanedCNPJ)
  if (result) return result

  // Fallback para ReceitaWS
  console.log("[CNPJ Service] Tentando fallback ReceitaWS...")
  result = await consultarReceitaWS(cleanedCNPJ)
  if (result) return result

  // Se todas as APIs falharam
  console.log("[CNPJ Service] Todas as APIs falharam")
  return {
    error: true,
    message: "Não foi possível consultar o CNPJ. Todas as APIs estão indisponíveis.",
    code: "ALL_APIS_FAILED",
  }
}

/**
 * Verifica se o resultado é um erro
 */
export function isCNPJError(result: CNPJResult): result is CNPJError {
  return "error" in result && result.error === true
}

/**
 * Formata CNPJ para exibição
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cleanCNPJ(cnpj)
  if (cleaned.length !== 14) return cnpj
  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  )
}

/**
 * Retorna a cor do badge baseado na situação cadastral
 */
export function getSituacaoColor(situacao: string): "success" | "warning" | "destructive" | "secondary" {
  const situacaoLower = situacao.toLowerCase()
  if (situacaoLower.includes("ativa")) return "success"
  if (situacaoLower.includes("suspensa")) return "warning"
  if (situacaoLower.includes("inapta") || situacaoLower.includes("baixada")) return "destructive"
  return "secondary"
}
