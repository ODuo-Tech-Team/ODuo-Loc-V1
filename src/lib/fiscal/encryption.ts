import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16

function getEncryptionKey(): Buffer {
  const key = process.env.FISCAL_ENCRYPTION_KEY

  if (!key) {
    throw new Error(
      'FISCAL_ENCRYPTION_KEY não configurada. ' +
      'Gere uma chave com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    )
  }

  // A chave deve ter 32 bytes (64 caracteres hex)
  if (key.length !== 64) {
    throw new Error('FISCAL_ENCRYPTION_KEY deve ter 64 caracteres hexadecimais (32 bytes)')
  }

  return Buffer.from(key, 'hex')
}

/**
 * Criptografa um token/string sensível
 * @param plainText - Texto a ser criptografado
 * @returns Texto criptografado no formato "iv:encrypted" em hexadecimal
 */
export function encryptToken(plainText: string): string {
  if (!plainText) {
    throw new Error('Texto para criptografar não pode ser vazio')
  }

  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(plainText, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  // Retorna IV + encrypted separados por ":"
  return `${iv.toString('hex')}:${encrypted}`
}

/**
 * Descriptografa um token/string
 * @param encryptedText - Texto criptografado no formato "iv:encrypted"
 * @returns Texto original descriptografado
 */
export function decryptToken(encryptedText: string): string {
  if (!encryptedText) {
    throw new Error('Texto para descriptografar não pode ser vazio')
  }

  const parts = encryptedText.split(':')
  if (parts.length !== 2) {
    throw new Error('Formato de texto criptografado inválido')
  }

  const [ivHex, encrypted] = parts
  const key = getEncryptionKey()
  const iv = Buffer.from(ivHex, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Verifica se uma chave de criptografia está configurada
 */
export function isEncryptionConfigured(): boolean {
  try {
    getEncryptionKey()
    return true
  } catch {
    return false
  }
}

/**
 * Gera uma nova chave de criptografia (para uso em setup inicial)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex')
}
