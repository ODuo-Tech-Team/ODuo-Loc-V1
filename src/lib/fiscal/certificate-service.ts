// Serviço para gerenciamento de certificados digitais A1

import { prisma } from '@/lib/prisma'
import { encryptToken, decryptToken } from './encryption'

export interface CertificateInfo {
  valid: boolean
  expiresAt?: Date
  daysUntilExpiration?: number
  cnpj?: string
  razaoSocial?: string
  error?: string
}

export interface UploadCertificateResult {
  success: boolean
  validade?: Date
  cnpj?: string
  error?: string
}

/**
 * Serviço para gerenciamento de certificados digitais A1 (.pfx)
 */
export class CertificateService {
  /**
   * Valida e extrai informações de um certificado A1
   * @param pfxBuffer - Buffer do arquivo .pfx
   * @param senha - Senha do certificado
   */
  async validateCertificate(
    pfxBuffer: Buffer,
    senha: string
  ): Promise<CertificateInfo> {
    try {
      // Importar node-forge dinamicamente (só no servidor)
      const forge = await import('node-forge')

      // Converter Buffer para string binária (formato esperado pelo forge)
      const pfxBinaryString = pfxBuffer.toString('binary')
      const pfxAsn1 = forge.asn1.fromDer(pfxBinaryString)

      // Decodificar o PKCS#12
      const pkcs12 = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, senha)

      // Buscar o certificado
      const certBags = pkcs12.getBags({ bagType: forge.pki.oids.certBag })
      const certBag = certBags[forge.pki.oids.certBag]?.[0]

      if (!certBag || !certBag.cert) {
        return {
          valid: false,
          error: 'Certificado não encontrado no arquivo .pfx'
        }
      }

      const cert = certBag.cert

      // Extrair data de validade
      const expiresAt = cert.validity.notAfter
      const now = new Date()
      const daysUntilExpiration = Math.ceil(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Extrair CNPJ e Razão Social do subject
      let cnpj: string | undefined
      let razaoSocial: string | undefined

      for (const attr of cert.subject.attributes) {
        if (attr.shortName === 'CN') {
          // CN geralmente contém o nome e CNPJ
          const cn = attr.value as string
          razaoSocial = cn.split(':')[0]?.trim()

          // Tentar extrair CNPJ do CN (formato comum: "EMPRESA:12345678000123")
          const cnpjMatch = cn.match(/(\d{14})/)
          if (cnpjMatch) {
            cnpj = cnpjMatch[1]
          }
        }
        // Alguns certificados têm CNPJ em campo separado
        if (attr.name === 'serialNumber' || attr.shortName === 'serialNumber') {
          const serial = attr.value as string
          const cnpjMatch = serial.match(/(\d{14})/)
          if (cnpjMatch) {
            cnpj = cnpjMatch[1]
          }
        }
      }

      // Verificar se expirou
      if (daysUntilExpiration < 0) {
        return {
          valid: false,
          expiresAt,
          daysUntilExpiration,
          cnpj,
          razaoSocial,
          error: `Certificado expirado há ${Math.abs(daysUntilExpiration)} dias`
        }
      }

      return {
        valid: true,
        expiresAt,
        daysUntilExpiration,
        cnpj,
        razaoSocial
      }
    } catch (error) {
      console.error('[Certificate] Erro ao validar certificado:', error)

      if (error instanceof Error) {
        if (error.message.includes('Invalid password')) {
          return {
            valid: false,
            error: 'Senha do certificado incorreta'
          }
        }
        if (error.message.includes('Invalid PKCS#12')) {
          return {
            valid: false,
            error: 'Arquivo não é um certificado .pfx válido'
          }
        }
      }

      return {
        valid: false,
        error: 'Erro ao processar certificado'
      }
    }
  }

  /**
   * Faz upload e salva um certificado A1 para o tenant
   * @param tenantId - ID do tenant
   * @param pfxBuffer - Buffer do arquivo .pfx
   * @param senha - Senha do certificado
   */
  async uploadCertificate(
    tenantId: string,
    pfxBuffer: Buffer,
    senha: string
  ): Promise<UploadCertificateResult> {
    // Primeiro, validar o certificado
    const validation = await this.validateCertificate(pfxBuffer, senha)

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      }
    }

    // Criptografar a senha antes de salvar
    const senhaCriptografada = encryptToken(senha)

    // Converter Buffer para Uint8Array (formato esperado pelo Prisma)
    const pfxUint8Array = new Uint8Array(pfxBuffer)

    // Salvar no banco
    await prisma.tenantFiscalConfig.upsert({
      where: { tenantId },
      update: {
        certificadoDigital: pfxUint8Array,
        certificadoSenha: senhaCriptografada,
        certificadoValidade: validation.expiresAt
      },
      create: {
        tenantId,
        certificadoDigital: pfxUint8Array,
        certificadoSenha: senhaCriptografada,
        certificadoValidade: validation.expiresAt
      }
    })

    console.log(`[Certificate] Certificado salvo para tenant ${tenantId}`)
    console.log(`[Certificate] Validade: ${validation.expiresAt}`)
    console.log(`[Certificate] CNPJ: ${validation.cnpj}`)

    return {
      success: true,
      validade: validation.expiresAt,
      cnpj: validation.cnpj
    }
  }

  /**
   * Verifica o status do certificado de um tenant
   * @param tenantId - ID do tenant
   */
  async getCertificateStatus(tenantId: string): Promise<CertificateInfo> {
    const config = await prisma.tenantFiscalConfig.findUnique({
      where: { tenantId },
      select: {
        certificadoDigital: true,
        certificadoValidade: true
      }
    })

    if (!config?.certificadoDigital) {
      return {
        valid: false,
        error: 'Certificado não configurado'
      }
    }

    const expiresAt = config.certificadoValidade
    if (!expiresAt) {
      return {
        valid: false,
        error: 'Data de validade não disponível'
      }
    }

    const now = new Date()
    const daysUntilExpiration = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntilExpiration < 0) {
      return {
        valid: false,
        expiresAt,
        daysUntilExpiration,
        error: `Certificado expirado há ${Math.abs(daysUntilExpiration)} dias`
      }
    }

    return {
      valid: true,
      expiresAt,
      daysUntilExpiration
    }
  }

  /**
   * Recupera o certificado descriptografado para uso
   * @param tenantId - ID do tenant
   */
  async getCertificateForEmission(
    tenantId: string
  ): Promise<{ pfx: Buffer; senha: string } | null> {
    const config = await prisma.tenantFiscalConfig.findUnique({
      where: { tenantId },
      select: {
        certificadoDigital: true,
        certificadoSenha: true,
        certificadoValidade: true
      }
    })

    if (!config?.certificadoDigital || !config.certificadoSenha) {
      return null
    }

    // Verificar validade
    if (config.certificadoValidade) {
      const now = new Date()
      if (config.certificadoValidade < now) {
        console.error('[Certificate] Certificado expirado')
        return null
      }
    }

    // Descriptografar senha
    const senha = decryptToken(config.certificadoSenha)

    // Converter Uint8Array de volta para Buffer
    const pfxBuffer = Buffer.from(config.certificadoDigital)

    return {
      pfx: pfxBuffer,
      senha
    }
  }

  /**
   * Remove o certificado de um tenant
   * @param tenantId - ID do tenant
   */
  async removeCertificate(tenantId: string): Promise<void> {
    await prisma.tenantFiscalConfig.update({
      where: { tenantId },
      data: {
        certificadoDigital: null,
        certificadoSenha: null,
        certificadoValidade: null
      }
    })

    console.log(`[Certificate] Certificado removido para tenant ${tenantId}`)
  }

  /**
   * Lista tenants com certificados próximos do vencimento
   * @param diasAviso - Quantidade de dias para alertar (padrão: 30)
   */
  async getCertificatesExpiringSoon(diasAviso: number = 30): Promise<Array<{
    tenantId: string
    tenantName: string
    expiresAt: Date
    daysUntilExpiration: number
  }>> {
    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() + diasAviso)

    const configs = await prisma.tenantFiscalConfig.findMany({
      where: {
        certificadoDigital: { not: null },
        certificadoValidade: {
          not: null,
          lte: dataLimite
        }
      },
      include: {
        tenant: {
          select: { id: true, name: true }
        }
      }
    })

    const now = new Date()

    return configs.map(config => ({
      tenantId: config.tenantId,
      tenantName: config.tenant.name,
      expiresAt: config.certificadoValidade!,
      daysUntilExpiration: Math.ceil(
        (config.certificadoValidade!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
    }))
  }
}

// Instância singleton
export const certificateService = new CertificateService()
