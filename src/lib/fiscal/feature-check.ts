// Verificação de feature flags para NFS-e

import { prisma } from '@/lib/prisma'
import { FiscalFeatureDisabledError, FiscalConfigurationError } from './errors'

/**
 * Verifica se NFS-e está habilitada para o tenant
 */
export async function isTenantNfseEnabled(tenantId: string): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { nfseEnabled: true },
  })

  return tenant?.nfseEnabled ?? false
}

/**
 * Verifica se NFS-e está habilitada e lança erro se não estiver
 */
export async function requireNfseEnabled(tenantId: string): Promise<void> {
  const enabled = await isTenantNfseEnabled(tenantId)

  if (!enabled) {
    throw new FiscalFeatureDisabledError()
  }
}

/**
 * Verifica se a configuração fiscal está completa
 */
export async function isFiscalConfigComplete(tenantId: string): Promise<{
  complete: boolean
  missingFields: string[]
}> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      cnpj: true,
      inscricaoMunicipal: true,
      codigoMunicipio: true,
      fiscalConfig: {
        select: {
          focusNfeToken: true,
          codigoServico: true,
        },
      },
    },
  })

  const missingFields: string[] = []

  if (!tenant) {
    return { complete: false, missingFields: ['tenant'] }
  }

  if (!tenant.cnpj) missingFields.push('cnpj')
  if (!tenant.inscricaoMunicipal) missingFields.push('inscricaoMunicipal')
  if (!tenant.codigoMunicipio) missingFields.push('codigoMunicipio')
  if (!tenant.fiscalConfig?.focusNfeToken) missingFields.push('focusNfeToken')

  return {
    complete: missingFields.length === 0,
    missingFields,
  }
}

/**
 * Verifica configuração fiscal e lança erro se incompleta
 */
export async function requireFiscalConfig(tenantId: string): Promise<void> {
  const { complete, missingFields } = await isFiscalConfigComplete(tenantId)

  if (!complete) {
    const fieldLabels: Record<string, string> = {
      cnpj: 'CNPJ',
      inscricaoMunicipal: 'Inscrição Municipal',
      codigoMunicipio: 'Código do Município',
      focusNfeToken: 'Token do Focus NFe',
    }

    const missingLabels = missingFields.map(f => fieldLabels[f] || f)

    throw new FiscalConfigurationError(
      `Configuração fiscal incompleta. Campos faltando: ${missingLabels.join(', ')}`,
      missingFields
    )
  }
}

/**
 * Verifica todas as pré-condições para emissão de NFS-e
 */
export async function canEmitNfse(tenantId: string): Promise<{
  canEmit: boolean
  reason?: string
  missingFields?: string[]
}> {
  // Verifica se está habilitado
  const enabled = await isTenantNfseEnabled(tenantId)
  if (!enabled) {
    return {
      canEmit: false,
      reason: 'NFS-e não está habilitada para esta conta',
    }
  }

  // Verifica configuração
  const { complete, missingFields } = await isFiscalConfigComplete(tenantId)
  if (!complete) {
    return {
      canEmit: false,
      reason: 'Configuração fiscal incompleta',
      missingFields,
    }
  }

  return { canEmit: true }
}
