/**
 * Serviço de consulta de CEP usando a API ViaCEP (gratuita)
 * Sem limite de requisições
 */

export interface CEPData {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string // cidade
  uf: string
  ibge: string // código IBGE do município
  ddd: string
}

export interface CEPError {
  error: true
  message: string
  code?: string
}

export type CEPResult = CEPData | CEPError

/**
 * Remove caracteres não numéricos do CEP
 */
export function cleanCEP(cep: string): string {
  return cep.replace(/\D/g, "")
}

/**
 * Valida se o CEP tem 8 dígitos
 */
export function isValidCEPFormat(cep: string): boolean {
  const cleaned = cleanCEP(cep)
  return cleaned.length === 8
}

/**
 * Consulta dados de CEP na API ViaCEP
 * @param cep - CEP com ou sem formatação
 * @returns Dados do endereço ou erro
 */
export async function consultarCEP(cep: string): Promise<CEPResult> {
  const cleanedCEP = cleanCEP(cep)

  if (!isValidCEPFormat(cleanedCEP)) {
    return {
      error: true,
      message: "CEP deve ter 8 dígitos",
      code: "INVALID_FORMAT",
    }
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanedCEP}/json/`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    })

    if (!response.ok) {
      return {
        error: true,
        message: `Erro ao consultar CEP: ${response.statusText}`,
        code: "API_ERROR",
      }
    }

    const data = await response.json()

    // ViaCEP retorna { erro: true } quando não encontra o CEP
    if (data.erro) {
      return {
        error: true,
        message: "CEP não encontrado",
        code: "NOT_FOUND",
      }
    }

    return {
      cep: data.cep,
      logradouro: data.logradouro || "",
      complemento: data.complemento || "",
      bairro: data.bairro || "",
      localidade: data.localidade || "",
      uf: data.uf || "",
      ibge: data.ibge || "",
      ddd: data.ddd || "",
    }
  } catch (error) {
    console.error("Erro ao consultar CEP:", error)
    return {
      error: true,
      message: "Erro de conexão ao consultar CEP. Verifique sua internet.",
      code: "NETWORK_ERROR",
    }
  }
}

/**
 * Verifica se o resultado é um erro
 */
export function isCEPError(result: CEPResult): result is CEPError {
  return "error" in result && result.error === true
}

/**
 * Formata CEP para exibição
 */
export function formatCEP(cep: string): string {
  const cleaned = cleanCEP(cep)
  if (cleaned.length !== 8) return cep
  return cleaned.replace(/^(\d{5})(\d{3})$/, "$1-$2")
}

/**
 * Lista de UFs brasileiras
 */
export const UFs = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
] as const

export type UF = typeof UFs[number]

/**
 * Valida se é uma UF válida
 */
export function isValidUF(uf: string): uf is UF {
  return UFs.includes(uf.toUpperCase() as UF)
}
