// Exportações do módulo fiscal

// Tipos
export * from './types'

// Erros
export * from './errors'

// Validadores
export * from './validators'

// Criptografia
export { encryptToken, decryptToken, isEncryptionConfigured } from './encryption'

// Template engine
export {
  processTemplate,
  validateTemplate,
  previewTemplate,
  formatCurrency,
  formatDate,
  calculateDays,
  formatItemsList,
  DEFAULT_DESCRIPTION_TEMPLATE,
  TEMPLATE_VARIABLES,
} from './template-engine'

// Feature check
export {
  isTenantNfseEnabled,
  requireNfseEnabled,
  isFiscalConfigComplete,
  requireFiscalConfig,
  canEmitNfse,
} from './feature-check'

// Cliente Focus NFe
export { FocusNfeClient, createFocusNfeClient } from './focus-nfe-client'

// Serviço NFS-e
export { NfseService, nfseService } from './nfse-service'

// Serviço NF-e (Produto)
export { NfeService, nfeService } from './nfe-service'

// Builder de payload NF-e
export { buildNfePayload, validateNfeData } from './nfe-payload-builder'

// Serviço de Certificado Digital
export { CertificateService, certificateService } from './certificate-service'
