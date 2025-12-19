// Cliente HTTP para API Focus NFe

import type {
  FocusNfeEnvironment,
  NfsePayload,
  FocusNfeResponse,
  NfePayload,
  FocusNfeNfeResponse,
} from './types'
import {
  FocusNfeApiError,
  FocusNfeAuthError,
  mapHttpError,
} from './errors'

interface FocusNfeClientConfig {
  token: string
  environment: FocusNfeEnvironment
}

const BASE_URLS: Record<FocusNfeEnvironment, string> = {
  HOMOLOGACAO: 'https://homologacao.focusnfe.com.br/v2',
  PRODUCAO: 'https://api.focusnfe.com.br/v2',
}

/**
 * Cliente para comunicação com a API Focus NFe
 */
export class FocusNfeClient {
  private baseUrl: string
  private token: string

  constructor(config: FocusNfeClientConfig) {
    if (!config.token) {
      throw new FocusNfeAuthError('Token do Focus NFe não configurado')
    }

    this.baseUrl = BASE_URLS[config.environment]
    this.token = config.token
  }

  /**
   * Faz uma requisição autenticada para a API
   */
  async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`

    // Focus NFe usa Basic Auth com token:''
    const auth = Buffer.from(`${this.token}:`).toString('base64')

    console.log('[Focus NFe] ========== REQUEST ==========')
    console.log('[Focus NFe] Method:', method)
    console.log('[Focus NFe] URL:', url)
    console.log('[Focus NFe] Body:', body ? JSON.stringify(body, null, 2) : 'none')

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const responseText = await response.text()
    console.log('[Focus NFe] ========== RESPONSE ==========')
    console.log('[Focus NFe] Status:', response.status)
    console.log('[Focus NFe] OK:', response.ok)
    console.log('[Focus NFe] Response Text:', responseText)

    // Tentar parsear JSON
    let data: any = {}
    try {
      data = JSON.parse(responseText)
      console.log('[Focus NFe] Parsed JSON:', JSON.stringify(data, null, 2))
    } catch (e) {
      console.error('[Focus NFe] Erro ao parsear JSON:', e)
      console.error('[Focus NFe] Response não é JSON válido:', responseText)
      data = { error: 'Resposta não é JSON válido', rawResponse: responseText }
    }
    console.log('[Focus NFe] =====================================')

    if (!response.ok) {
      throw mapHttpError(response.status, data)
    }

    return data as T
  }

  /**
   * Emite uma NFS-e Municipal (sistema antigo)
   * @param ref - Referência única (gerada internamente)
   * @param payload - Dados da NFS-e
   */
  async emitirNfseMunicipal(ref: string, payload: NfsePayload): Promise<FocusNfeResponse> {
    return this.request<FocusNfeResponse>('POST', `/nfse?ref=${ref}`, payload)
  }

  /**
   * Emite uma NFS-e Nacional (Sistema Nacional NFS-e)
   * Usar para códigos como 990401 (Locação de Bens Móveis)
   * @param ref - Referência única (gerada internamente)
   * @param payload - Dados da NFS-e Nacional
   */
  async emitirNfseNacional(ref: string, payload: NfsePayload | any): Promise<FocusNfeResponse> {
    return this.request<FocusNfeResponse>('POST', `/nfsen?ref=${ref}`, payload)
  }

  /**
   * Emite uma NFS-e (detecta automaticamente se é Municipal ou Nacional)
   * @param ref - Referência única (gerada internamente)
   * @param payload - Dados da NFS-e
   */
  async emitirNfse(ref: string, payload: NfsePayload): Promise<FocusNfeResponse> {
    // Detectar se payload é Municipal ou Nacional
    // Municipal: tem servico.item_lista_servico (código LC 116, ex: 010501)
    // Nacional: tem codigo_tributacao_nacional_iss no root ou servico (código começa com 99)

    const hasItemListaServico = !!(payload as any).servico?.item_lista_servico
    const isPayloadNacionalDPS = !!(payload as any).codigo_tributacao_nacional_iss
    const codigoNacional = (payload as any).servico?.codigo_tributacao_nacional_iss

    // É Municipal se tem item_lista_servico
    // É Nacional se tem codigo_tributacao_nacional_iss (no root ou servico com código começando com 99)
    const isNacional = isPayloadNacionalDPS || (codigoNacional?.startsWith('99') && !hasItemListaServico)

    console.log(`[Focus NFe] Detecção de sistema:`)
    console.log(`[Focus NFe]   - hasItemListaServico: ${hasItemListaServico}`)
    console.log(`[Focus NFe]   - isPayloadNacionalDPS: ${isPayloadNacionalDPS}`)
    console.log(`[Focus NFe]   - codigoNacional: ${codigoNacional}`)
    console.log(`[Focus NFe] Usando endpoint: ${isNacional ? '/nfsen (Nacional)' : '/nfse (Municipal)'}`)

    // Logs detalhados para debug de validação XML
    console.log('[Focus NFe] ========== PAYLOAD SENDO ENVIADO ==========')
    console.log('[Focus NFe] Payload completo:', JSON.stringify(payload, null, 2))
    console.log('[Focus NFe] Ordem dos campos do tomador:', Object.keys((payload as any).tomador || {}))
    console.log('[Focus NFe] Ordem dos campos do servico:', Object.keys((payload as any).servico || {}))
    console.log('[Focus NFe] ===============================================')

    if (isNacional) {
      // Se payload já está em formato Nacional, usar direto. Senão, converter
      const payloadNacional = isPayloadNacionalDPS ? payload : this.convertToNacionalPayload(payload)
      return this.emitirNfseNacional(ref, payloadNacional)
    } else {
      return this.emitirNfseMunicipal(ref, payload)
    }
  }

  /**
   * Converte payload Municipal para Nacional
   */
  private convertToNacionalPayload(payload: NfsePayload): any {
    const dataEmissao = new Date(payload.data_emissao)
    const dataCompetencia = dataEmissao.toISOString().split('T')[0] // YYYY-MM-DD

    const issRetido = payload.servico.iss_retido
    const hasEndereco = !!payload.tomador.endereco

    // Log para debug
    console.log(`[Focus NFe] Convertendo para Nacional - ISS Retido: ${issRetido}, Tem Endereço: ${hasEndereco}`)

    if (issRetido && !hasEndereco) {
      console.error('[Focus NFe] ❌ ERRO: ISS retido mas endereço do tomador não foi adicionado ao payload!')
    }

    const payloadNacional = {
      data_emissao: payload.data_emissao,
      data_competencia: dataCompetencia,
      codigo_municipio_emissora: payload.prestador.codigo_municipio,

      // Prestador
      cnpj_prestador: payload.prestador.cnpj,
      inscricao_municipal_prestador: payload.prestador.inscricao_municipal,
      codigo_opcao_simples_nacional: payload.optante_simples_nacional ? 1 : 2,
      // Regime especial só é enviado se definido (MEI/Simples - não enviar para Lucro Presumido/Real)
      ...(payload.regime_especial_tributacao !== undefined && { regime_especial_tributacao: payload.regime_especial_tributacao }),

      // Tomador
      cnpj_tomador: payload.tomador.cnpj,
      cpf_tomador: payload.tomador.cpf,
      razao_social_tomador: payload.tomador.razao_social,
      telefone_tomador: payload.tomador.telefone,
      email_tomador: payload.tomador.email,

      // Endereço do tomador (obrigatório quando ISS retido)
      codigo_municipio_tomador: payload.tomador.endereco?.codigo_municipio,
      cep_tomador: payload.tomador.endereco?.cep,
      logradouro_tomador: payload.tomador.endereco?.logradouro,
      numero_tomador: payload.tomador.endereco?.numero,
      complemento_tomador: payload.tomador.endereco?.complemento,
      bairro_tomador: payload.tomador.endereco?.bairro,

      // Serviço
      codigo_municipio_prestacao: payload.prestador.codigo_municipio,
      codigo_tributacao_nacional_iss: payload.servico.codigo_tributacao_nacional_iss,
      descricao_servico: payload.servico.discriminacao,
      valor_servico: payload.servico.valor_servicos,
      tributacao_iss: 1, // 1 = Operação tributável
      // IMPORTANTE: 1 = Não Retido, 2 = Retido pelo Tomador, 3 = Retido pelo Intermediário
      tipo_retencao_iss: issRetido ? 2 : 1, // ✅ CORRIGIDO: estava invertido!
    }

    // Log do payload convertido
    console.log('[Focus NFe] Payload Nacional:', JSON.stringify(payloadNacional, null, 2))

    return payloadNacional
  }

  /**
   * Consulta o status de uma NFS-e Municipal
   * @param ref - Referência da NFS-e
   */
  async consultarNfseMunicipal(ref: string): Promise<FocusNfeResponse> {
    return this.request<FocusNfeResponse>('GET', `/nfse/${ref}`)
  }

  /**
   * Consulta o status de uma NFS-e Nacional
   * @param ref - Referência da NFS-e
   */
  async consultarNfseNacional(ref: string): Promise<FocusNfeResponse> {
    return this.request<FocusNfeResponse>('GET', `/nfsen/${ref}`)
  }

  /**
   * Consulta o status de uma NFS-e (tenta ambos os endpoints)
   * @param ref - Referência da NFS-e
   */
  async consultarNfse(ref: string): Promise<FocusNfeResponse> {
    // Tenta primeiro o endpoint municipal (maioria dos casos), depois o nacional
    try {
      const result = await this.consultarNfseMunicipal(ref)
      return result
    } catch (error) {
      // Se deu erro no municipal (404, etc), tenta o nacional
      return await this.consultarNfseNacional(ref)
    }
  }

  /**
   * Cancela uma NFS-e autorizada
   * @param ref - Referência da NFS-e
   * @param justificativa - Motivo do cancelamento (mínimo 15 caracteres)
   */
  async cancelarNfse(ref: string, justificativa: string): Promise<FocusNfeResponse> {
    if (justificativa.length < 15) {
      throw new FocusNfeApiError(
        'Justificativa de cancelamento deve ter no mínimo 15 caracteres',
        [{ codigo: 'JUSTIFICATIVA_CURTA', mensagem: 'Mínimo 15 caracteres' }]
      )
    }

    return this.request<FocusNfeResponse>('DELETE', `/nfse/${ref}`, {
      justificativa,
    })
  }

  /**
   * Reenvia email com a NFS-e para os destinatários
   * @param ref - Referência da NFS-e
   * @param emails - Lista de emails para envio
   */
  async reenviarEmail(ref: string, emails: string[]): Promise<void> {
    if (emails.length === 0) {
      throw new FocusNfeApiError(
        'É necessário informar pelo menos um email',
        [{ codigo: 'EMAIL_REQUIRED', mensagem: 'Informe ao menos um email' }]
      )
    }

    await this.request('POST', `/nfse/${ref}/email`, {
      emails: emails,
    })
  }

  /**
   * Testa a conexão com a API
   * @returns true se a conexão está funcionando
   */
  async testarConexao(): Promise<boolean> {
    try {
      // Faz uma consulta a uma NFS-e inexistente para testar auth
      await this.request('GET', '/nfse/teste-conexao-inexistente')
      return true
    } catch (error) {
      // 404 significa que autenticou mas não encontrou (esperado)
      if (error instanceof Error && error.message.includes('não encontrado')) {
        return true
      }
      // Erro de auth significa credenciais inválidas
      if (error instanceof FocusNfeAuthError) {
        return false
      }
      // Outros erros podem ser de rede
      throw error
    }
  }

  // ============================================
  // Métodos para NF-e (Nota Fiscal Eletrônica de Produto)
  // ============================================

  /**
   * Emite uma NF-e (Nota Fiscal Eletrônica de Produto)
   * @param ref - Referência única (gerada internamente)
   * @param payload - Dados da NF-e
   */
  async emitirNfe(ref: string, payload: NfePayload): Promise<FocusNfeNfeResponse> {
    console.log('[Focus NFe] ========== EMITINDO NF-e ==========')
    console.log('[Focus NFe] Referência:', ref)
    console.log('[Focus NFe] Natureza da Operação:', payload.natureza_operacao)
    console.log('[Focus NFe] CFOP:', payload.items?.[0]?.cfop)
    console.log('[Focus NFe] Itens:', payload.items?.length)
    return this.request<FocusNfeNfeResponse>('POST', `/nfe?ref=${ref}`, payload)
  }

  /**
   * Consulta o status de uma NF-e
   * @param ref - Referência da NF-e
   */
  async consultarNfe(ref: string): Promise<FocusNfeNfeResponse> {
    console.log('[Focus NFe] Consultando NF-e:', ref)
    return this.request<FocusNfeNfeResponse>('GET', `/nfe/${ref}`)
  }

  /**
   * Consulta uma NF-e pela chave de acesso (44 dígitos)
   * @param chave - Chave de acesso da NF-e
   */
  async consultarNfePorChave(chave: string): Promise<FocusNfeNfeResponse> {
    console.log('[Focus NFe] Consultando NF-e por chave:', chave)
    return this.request<FocusNfeNfeResponse>('GET', `/nfe_chave/${chave}`)
  }

  /**
   * Cancela uma NF-e autorizada
   * @param ref - Referência da NF-e
   * @param justificativa - Motivo do cancelamento (mínimo 15 caracteres)
   */
  async cancelarNfe(ref: string, justificativa: string): Promise<FocusNfeNfeResponse> {
    if (justificativa.length < 15) {
      throw new FocusNfeApiError(
        'Justificativa de cancelamento deve ter no mínimo 15 caracteres',
        [{ codigo: 'JUSTIFICATIVA_CURTA', mensagem: 'Mínimo 15 caracteres' }]
      )
    }

    console.log('[Focus NFe] Cancelando NF-e:', ref)
    return this.request<FocusNfeNfeResponse>('DELETE', `/nfe/${ref}`, {
      justificativa,
    })
  }

  /**
   * Emite uma Carta de Correção para NF-e
   * @param ref - Referência da NF-e
   * @param correcao - Texto da correção (mínimo 15 caracteres)
   */
  async cartaCorrecaoNfe(ref: string, correcao: string): Promise<FocusNfeNfeResponse> {
    if (correcao.length < 15) {
      throw new FocusNfeApiError(
        'Texto da correção deve ter no mínimo 15 caracteres',
        [{ codigo: 'CORRECAO_CURTA', mensagem: 'Mínimo 15 caracteres' }]
      )
    }

    console.log('[Focus NFe] Carta de Correção NF-e:', ref)
    return this.request<FocusNfeNfeResponse>('POST', `/nfe/${ref}/carta_correcao`, {
      correcao,
    })
  }

  /**
   * Inutiliza uma faixa de numeração de NF-e
   * @param modelo - Modelo da nota (55=NF-e, 65=NFC-e)
   * @param serie - Série da nota
   * @param numeroInicial - Número inicial da faixa
   * @param numeroFinal - Número final da faixa
   * @param justificativa - Motivo da inutilização (mínimo 15 caracteres)
   */
  async inutilizarNumeracao(
    modelo: string,
    serie: string,
    numeroInicial: number,
    numeroFinal: number,
    justificativa: string
  ): Promise<FocusNfeNfeResponse> {
    if (justificativa.length < 15) {
      throw new FocusNfeApiError(
        'Justificativa deve ter no mínimo 15 caracteres',
        [{ codigo: 'JUSTIFICATIVA_CURTA', mensagem: 'Mínimo 15 caracteres' }]
      )
    }

    console.log('[Focus NFe] Inutilizando numeração:', { modelo, serie, numeroInicial, numeroFinal })
    return this.request<FocusNfeNfeResponse>('POST', `/nfe/inutilizacao`, {
      modelo,
      serie,
      numero_inicial: numeroInicial,
      numero_final: numeroFinal,
      justificativa,
    })
  }

  /**
   * Reenvia email com a NF-e para os destinatários
   * @param ref - Referência da NF-e
   * @param emails - Lista de emails para envio
   */
  async reenviarEmailNfe(ref: string, emails: string[]): Promise<void> {
    if (emails.length === 0) {
      throw new FocusNfeApiError(
        'É necessário informar pelo menos um email',
        [{ codigo: 'EMAIL_REQUIRED', mensagem: 'Informe ao menos um email' }]
      )
    }

    console.log('[Focus NFe] Reenviando email NF-e:', ref)
    await this.request('POST', `/nfe/${ref}/email`, {
      emails: emails,
    })
  }
}

/**
 * Cria uma instância do cliente Focus NFe
 */
export function createFocusNfeClient(
  token: string,
  environment: FocusNfeEnvironment
): FocusNfeClient {
  return new FocusNfeClient({ token, environment })
}
