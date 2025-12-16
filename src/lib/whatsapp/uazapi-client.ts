import {
  CreateInstanceResponse,
  QRCodeResponse,
  ConnectionStatusResponse,
  SendMessageResponse,
  SendTextMessageRequest,
  SendMediaMessageRequest,
  SendLocationRequest,
  SendContactRequest,
  normalizePhone,
} from "./types"

// Funções para obter configuração em runtime (não em build time)
function getBaseUrl(): string {
  return process.env.UAZAPI_BASE_URL || "https://api.uazapi.com"
}

function getApiKey(): string {
  return process.env.UAZAPI_API_KEY || ""
}

interface UazapiClientOptions {
  baseUrl?: string
  apiKey?: string
}

/**
 * Cliente para integração com Uazapi API
 * Docs: https://docs.uazapi.com/
 */
export class UazapiClient {
  private options?: UazapiClientOptions

  constructor(options?: UazapiClientOptions) {
    this.options = options
  }

  // Getters dinâmicos para pegar valores em runtime
  private get baseUrl(): string {
    return this.options?.baseUrl || getBaseUrl()
  }

  private get apiKey(): string {
    return this.options?.apiKey || getApiKey()
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    // Log para debug
    console.log(`[Uazapi] Request to: ${url}`)
    console.log(`[Uazapi] API Key configured: ${this.apiKey ? "Yes (length: " + this.apiKey.length + ")" : "No"}`)

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "admintoken": this.apiKey,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Uazapi] Error ${response.status}:`, errorText)
      throw new Error(`Uazapi API error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  /**
   * Request usando token da instância (para operações da instância específica)
   */
  private async requestWithToken<T>(
    endpoint: string,
    instanceToken: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    console.log(`[Uazapi] Request to: ${url}`)
    console.log(`[Uazapi] Using instance token: ${instanceToken ? "Yes" : "No"}`)

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "token": instanceToken, // Token da instância, não admintoken
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Uazapi] Error ${response.status}:`, errorText)
      throw new Error(`Uazapi API error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  // ============================================
  // Instance Management
  // ============================================

  /**
   * Cria uma nova instância do WhatsApp
   * Docs: https://docs.uazapi.com - POST /instance/init
   */
  async createInstance(name: string): Promise<CreateInstanceResponse> {
    return this.request<CreateInstanceResponse>("/instance/init", {
      method: "POST",
      body: JSON.stringify({
        name,
        systemName: "oduoloc",
        browser: "chrome",
      }),
    })
  }

  /**
   * Conecta uma instância (gera QR Code)
   * Usa o token da instância, não o admintoken
   * Docs: POST /instance/connect - sem phone = QR Code
   */
  async connectInstance(instanceToken: string): Promise<QRCodeResponse> {
    const response = await this.requestWithToken<Record<string, unknown>>("/instance/connect", instanceToken, {
      method: "POST",
      body: JSON.stringify({}), // Body vazio para gerar QR Code
    })

    // Log completo da resposta para debug
    console.log("[Uazapi] Connect raw response:", JSON.stringify(response, null, 2))

    // A resposta pode ter qrcode em vários lugares dependendo da versão da API
    // Tentar múltiplos caminhos possíveis
    const qrcode = (response.qrcode as string) ||
                   (response.qr as string) ||
                   (response.base64 as string) ||
                   (response.instance as Record<string, unknown>)?.qrcode as string ||
                   (response.instance as Record<string, unknown>)?.qr as string ||
                   (response.data as Record<string, unknown>)?.qrcode as string ||
                   (response.data as Record<string, unknown>)?.qr as string ||
                   ""

    const status = (response.status as string) ||
                   (response.state as string) ||
                   (response.instance as Record<string, unknown>)?.status as string ||
                   (response.instance as Record<string, unknown>)?.state as string ||
                   (response.data as Record<string, unknown>)?.status as string ||
                   "disconnected"

    console.log("[Uazapi] Connect parsed - qrcode found:", qrcode ? `Yes (${qrcode.substring(0, 50)}...)` : "No", "status:", status)

    return {
      success: response.success as boolean ?? true,
      qrcode: qrcode || undefined,
      status: status as "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "BANNED",
      message: response.message as string,
    }
  }

  /**
   * Obtém o status de conexão de uma instância
   * Docs: GET /instance/status - usa token da instância
   */
  async getConnectionStatus(instanceToken: string): Promise<ConnectionStatusResponse> {
    const response = await this.requestWithToken<Record<string, unknown>>(
      "/instance/status",
      instanceToken,
      { method: "GET" }
    )

    console.log("[Uazapi] Status raw response:", JSON.stringify(response, null, 2))

    // Parsear status - pode ser objeto { connected: true } ou string
    let status: string = "disconnected"

    // Verificar se status é um objeto com connected: true
    const statusObj = response.status as Record<string, unknown> | undefined
    if (statusObj && typeof statusObj === "object" && statusObj.connected === true) {
      status = "connected"
    } else if (statusObj && typeof statusObj === "object" && statusObj.connected === false) {
      status = "disconnected"
    } else if (typeof response.status === "string") {
      status = response.status
    } else if (typeof response.state === "string") {
      status = response.state
    }

    // Também verificar instance.status (string)
    const instanceData = response.instance as Record<string, unknown> | undefined
    if (instanceData?.status && typeof instanceData.status === "string") {
      status = instanceData.status
    }

    // Extrair telefone
    const phone = (response.phone as string) ||
                  (response.owner as string) ||
                  (instanceData?.owner as string) ||
                  undefined

    console.log("[Uazapi] Status parsed - status:", status, "phone:", phone || "N/A")

    return {
      success: true,
      status: status as "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "BANNED",
      phone,
    }
  }

  /**
   * Desconecta uma instância
   */
  async disconnectInstance(instanceId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/instance/logout/${instanceId}`, {
      method: "DELETE",
    })
  }

  /**
   * Reinicia uma instância
   */
  async restartInstance(instanceId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/instance/restart/${instanceId}`, {
      method: "PUT",
    })
  }

  /**
   * Deleta uma instância
   */
  async deleteInstance(instanceId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/instance/delete/${instanceId}`, {
      method: "DELETE",
    })
  }

  /**
   * Configura o webhook de uma instância
   */
  async setWebhook(
    instanceId: string,
    webhookUrl: string,
    events?: string[]
  ): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/instance/webhook/${instanceId}`, {
      method: "PUT",
      body: JSON.stringify({
        url: webhookUrl,
        webhook_by_events: false,
        events: events || [
          "messages.upsert",
          "messages.update",
          "connection.update",
          "qr.update",
        ],
      }),
    })
  }

  // ============================================
  // Send Messages (usam token da instância)
  // ============================================

  /**
   * Envia mensagem de texto
   * @param instanceToken - Token da instância (apiToken), não o instanceId
   */
  async sendTextMessage(
    instanceToken: string,
    data: SendTextMessageRequest
  ): Promise<SendMessageResponse> {
    const phone = normalizePhone(data.phone)

    // Endpoint correto da Uazapi: /send/text
    return this.requestWithToken<SendMessageResponse>("/send/text", instanceToken, {
      method: "POST",
      body: JSON.stringify({
        number: phone,
        text: data.message,
        ...(data.quotedMessageId && { replyid: data.quotedMessageId }),
      }),
    })
  }

  /**
   * Envia imagem
   * @param instanceToken - Token da instância (apiToken)
   */
  async sendImage(
    instanceToken: string,
    data: SendMediaMessageRequest
  ): Promise<SendMessageResponse> {
    const phone = normalizePhone(data.phone)

    return this.requestWithToken<SendMessageResponse>("/send/image", instanceToken, {
      method: "POST",
      body: JSON.stringify({
        number: phone,
        image: data.media,
        caption: data.caption || "",
        ...(data.quotedMessageId && { replyid: data.quotedMessageId }),
      }),
    })
  }

  /**
   * Envia vídeo
   * @param instanceToken - Token da instância (apiToken)
   */
  async sendVideo(
    instanceToken: string,
    data: SendMediaMessageRequest
  ): Promise<SendMessageResponse> {
    const phone = normalizePhone(data.phone)

    return this.requestWithToken<SendMessageResponse>("/send/video", instanceToken, {
      method: "POST",
      body: JSON.stringify({
        number: phone,
        video: data.media,
        caption: data.caption || "",
        ...(data.quotedMessageId && { replyid: data.quotedMessageId }),
      }),
    })
  }

  /**
   * Envia áudio
   * @param instanceToken - Token da instância (apiToken)
   */
  async sendAudio(
    instanceToken: string,
    data: SendMediaMessageRequest
  ): Promise<SendMessageResponse> {
    const phone = normalizePhone(data.phone)

    return this.requestWithToken<SendMessageResponse>("/send/audio", instanceToken, {
      method: "POST",
      body: JSON.stringify({
        number: phone,
        audio: data.media,
        ...(data.quotedMessageId && { replyid: data.quotedMessageId }),
      }),
    })
  }

  /**
   * Envia documento
   * @param instanceToken - Token da instância (apiToken)
   */
  async sendDocument(
    instanceToken: string,
    data: SendMediaMessageRequest
  ): Promise<SendMessageResponse> {
    const phone = normalizePhone(data.phone)

    return this.requestWithToken<SendMessageResponse>("/send/document", instanceToken, {
      method: "POST",
      body: JSON.stringify({
        number: phone,
        document: data.media,
        filename: data.fileName || "document",
        caption: data.caption || "",
        ...(data.quotedMessageId && { replyid: data.quotedMessageId }),
      }),
    })
  }

  /**
   * Envia localização
   * @param instanceToken - Token da instância (apiToken)
   */
  async sendLocation(
    instanceToken: string,
    data: SendLocationRequest
  ): Promise<SendMessageResponse> {
    const phone = normalizePhone(data.phone)

    return this.requestWithToken<SendMessageResponse>("/send/location", instanceToken, {
      method: "POST",
      body: JSON.stringify({
        number: phone,
        lat: data.latitude,
        lng: data.longitude,
        name: data.name || "",
        address: data.address || "",
      }),
    })
  }

  /**
   * Envia contato
   * @param instanceToken - Token da instância (apiToken)
   */
  async sendContact(
    instanceToken: string,
    data: SendContactRequest
  ): Promise<SendMessageResponse> {
    const phone = normalizePhone(data.phone)

    return this.requestWithToken<SendMessageResponse>("/send/contact", instanceToken, {
      method: "POST",
      body: JSON.stringify({
        number: phone,
        name: data.contactName,
        phone: normalizePhone(data.contactPhone),
      }),
    })
  }

  // ============================================
  // Utilities
  // ============================================

  /**
   * Verifica se um número está no WhatsApp
   */
  async checkNumberExists(
    instanceId: string,
    phone: string
  ): Promise<{ exists: boolean; jid?: string }> {
    const normalized = normalizePhone(phone)

    const response = await this.request<{
      exists: boolean
      jid?: string
      number?: string
    }>(`/chat/whatsappNumbers/${instanceId}`, {
      method: "POST",
      body: JSON.stringify({ numbers: [normalized] }),
    })

    return {
      exists: response.exists,
      jid: response.jid,
    }
  }

  /**
   * Obtém a foto de perfil de um contato
   */
  async getProfilePicture(
    instanceId: string,
    phone: string
  ): Promise<{ profilePic?: string }> {
    const normalized = normalizePhone(phone)

    try {
      const response = await this.request<{ profilePictureUrl?: string }>(
        `/chat/fetchProfilePictureUrl/${instanceId}`,
        {
          method: "POST",
          body: JSON.stringify({ number: normalized }),
        }
      )

      return { profilePic: response.profilePictureUrl }
    } catch {
      return { profilePic: undefined }
    }
  }

  /**
   * Marca mensagens como lidas
   */
  async markAsRead(
    instanceId: string,
    phone: string,
    messageIds: string[]
  ): Promise<{ success: boolean }> {
    const normalized = normalizePhone(phone)

    return this.request<{ success: boolean }>(`/chat/markMessageAsRead/${instanceId}`, {
      method: "PUT",
      body: JSON.stringify({
        readMessages: messageIds.map((id) => ({
          remoteJid: `${normalized}@s.whatsapp.net`,
          id,
        })),
      }),
    })
  }

  /**
   * Define o status de "digitando..."
   */
  async sendTyping(
    instanceId: string,
    phone: string,
    duration = 3000
  ): Promise<{ success: boolean }> {
    const normalized = normalizePhone(phone)

    return this.request<{ success: boolean }>(`/chat/sendPresence/${instanceId}`, {
      method: "POST",
      body: JSON.stringify({
        number: normalized,
        presence: "composing",
        delay: duration,
      }),
    })
  }
}

// Factory function - cria nova instância a cada chamada
// Importante: NÃO usar singleton para garantir que env vars sejam lidas em runtime
export function getUazapiClient(): UazapiClient {
  return new UazapiClient()
}
