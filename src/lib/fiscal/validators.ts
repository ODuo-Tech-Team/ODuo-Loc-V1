// Validadores fiscais - CPF, CNPJ, etc.

/**
 * Remove caracteres não numéricos
 */
export function onlyNumbers(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Valida CPF
 * @param cpf - CPF com ou sem formatação
 * @returns true se válido
 */
export function validateCPF(cpf: string): boolean {
  const cleaned = onlyNumbers(cpf)

  if (cleaned.length !== 11) return false

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleaned)) return false

  // Validação do primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned[9])) return false

  // Validação do segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned[10])) return false

  return true
}

/**
 * Valida CNPJ
 * @param cnpj - CNPJ com ou sem formatação
 * @returns true se válido
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleaned = onlyNumbers(cnpj)

  if (cleaned.length !== 14) return false

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleaned)) return false

  // Validação do primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned[i]) * weights1[i]
  }
  let remainder = sum % 11
  const digit1 = remainder < 2 ? 0 : 11 - remainder
  if (digit1 !== parseInt(cleaned[12])) return false

  // Validação do segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned[i]) * weights2[i]
  }
  remainder = sum % 11
  const digit2 = remainder < 2 ? 0 : 11 - remainder
  if (digit2 !== parseInt(cleaned[13])) return false

  return true
}

/**
 * Valida CPF ou CNPJ
 * @param value - CPF ou CNPJ com ou sem formatação
 * @returns true se válido
 */
export function validateCpfCnpj(value: string): boolean {
  const cleaned = onlyNumbers(value)

  if (cleaned.length === 11) {
    return validateCPF(cleaned)
  }

  if (cleaned.length === 14) {
    return validateCNPJ(cleaned)
  }

  return false
}

/**
 * Formata CPF
 * @param cpf - CPF apenas números
 * @returns CPF formatado (000.000.000-00)
 */
export function formatCPF(cpf: string): string {
  const cleaned = onlyNumbers(cpf)
  if (cleaned.length !== 11) return cpf

  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Formata CNPJ
 * @param cnpj - CNPJ apenas números
 * @returns CNPJ formatado (00.000.000/0000-00)
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = onlyNumbers(cnpj)
  if (cleaned.length !== 14) return cnpj

  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

/**
 * Formata CPF ou CNPJ automaticamente
 */
export function formatCpfCnpj(value: string): string {
  const cleaned = onlyNumbers(value)

  if (cleaned.length === 11) {
    return formatCPF(cleaned)
  }

  if (cleaned.length === 14) {
    return formatCNPJ(cleaned)
  }

  return value
}

/**
 * Valida CEP
 * @param cep - CEP com ou sem formatação
 * @returns true se válido
 */
export function validateCEP(cep: string): boolean {
  const cleaned = onlyNumbers(cep)
  return cleaned.length === 8
}

/**
 * Formata CEP
 * @param cep - CEP apenas números
 * @returns CEP formatado (00000-000)
 */
export function formatCEP(cep: string): string {
  const cleaned = onlyNumbers(cep)
  if (cleaned.length !== 8) return cep

  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2')
}

/**
 * Valida Inscrição Municipal (básica - apenas verifica se tem números)
 */
export function validateInscricaoMunicipal(im: string): boolean {
  const cleaned = onlyNumbers(im)
  return cleaned.length >= 1 && cleaned.length <= 15
}

/**
 * Lista de UFs válidas
 */
export const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
] as const

export type UF = typeof UF_LIST[number]

/**
 * Valida UF
 */
export function validateUF(uf: string): boolean {
  return UF_LIST.includes(uf.toUpperCase() as UF)
}
