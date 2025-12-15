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

// Configuração base da API
const UAZAPI_BASE_URL = process.env.UAZAPI_BASE_URL || "https://api.uazapi.com"
const UAZAPI_API_KEY = process.env.UAZAPI_API_KEY || ""

interface UazapiClientOptions {
  baseUrl?: string
  apiKey?: string
}

/**
 * Cliente para integração com Uazapi API
 * Docs: https://docs.uazapi.com/
 */
export class UazapiClient {
  private baseUrl: string
  private apiKey: string

  constructor(options?: UazapiClientOptions) {
    this.baseUrl = options?.baseUrl || UAZAPI_BASE_URL
    this.apiKey = options?.apiKey || UAZAPI_API_KEY
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        apikey: this.apiKey,
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
   */
  async createInstance(name: string): Promise<CreateInstanceResponse> {
    return this.request<CreateInstanceResponse>("/instance/create", {
      method: "POST",
      body: JSON.stringify({ instanceName: name }),
    })
  }

  /**
   * Conecta uma instância (gera QR Code)
   */
  async connectInstance(instanceId: string): Promise<QRCodeResponse> {
    return this.request<QRCodeResponse>(`/instance/connect/${instanceId}`, {
      method: "GET",
    })
  }

  /**
   * Obtém o QR Code atual de uma instância
   */
  async getQRCode(instanceId: string): Promise<QRCodeResponse> {
    return this.request<QRCodeResponse>(`/instance/qrcode/${instanceId}`, {
      method: "GET",
    })
  }

  /**
   * Obtém o status de conexão de uma instância
   */
  async getConnectionStatus(instanceId: string): Promise<ConnectionStatusResponse> {
    return this.request<ConnectionStatusResponse>(`/instance/connectionState/${instanceId}`, {
      method: "GET",
    })
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
  // Send Messages
  // ============================================

  /**
   * Envia mensagem de texto
   */
  async sendTextMessage(
    instanceId: string,
    data: SendTextMessageRequest
  ): Promise<SendMessageResponse> {
    const phone = normalizePhone(data.phone)

    return this.request<SendMessageResponse>(`/message/sendText/${instanceId}`, {
      method: "POST",
      body: JSON.stringify({
        number: phone,
        text: data.message,
        ...(data.quotedMessageId && { quoted: { messageId: data.quotedMessageId } }),
      }),
    })
  }

  /**
   * Envia imagem
   */
  async sendImage(
    instanceId: string,
    data: SendMediaMessageRequest
  ): Promise<SendMessageResponse> {
    const phone = normalizePhone(data.phone)

    return this.request<SendMessageResponse>(`/message/sendMedia/${instanceId}`, {
      method: "POST",
      body: JSON.stringify({
        number: phone,
        mediatype: "image",
        media: data.media,
        caption: data.caption || "",
        ...(data.quotedMessageId && { quoted: { messageId: data.quotedMessageId } }),
      }),
    })
  }

  /**
   * Envia vídeo
   */
  async sendVideo(
    instanceId: string,
    data: SendMediaMessageRequest
  ): Promise<SendMessageResponse> {
    const phone = normalizePhone(data.phone)

    return this.request<SendMessageResponse>(`/message/sendMedia/${instanceId}`, {
      method: "POST",
      body: JSON.stringify({
        number: phone,
        mediatype: "video",
        media: data.media,
        caption: data.caption || "",
        ...(data.quotedMessageId && { quoted: { messageId: data.quotedMessageId } }),
      }),
    })
  }

  /**
   * Envia áudio
   */
  async sendAudio(
    instanceId: string,
    data: SendMediaMessageRequest
  ): Promise<SendMessageResponse> {
    const phone = normalizePhone(data.phone)

    return this.request<SendMessageResponse>(`/message/sendMedia/${instanceId}`, {
      method: "POST",
      body: JSON.stringify({
        number: phone,
        mediatype: "audio",
        media: data.media,
        ...(data.quotedMessageId && { quoted: { messageId: data.quotedMessageId } }),
      }),
    })
  }

  /**
   * Envia documento
   */
  async sendDocument(
    instanceId: string,
    data: SendMediaMessageRequest
  ): Promise<SendMessageResponse> {
    const phone = normalizePhone(data.phone)

    return this.request<SendMessageResponse>(`/message/sendMedia/${instanceId}`, {
      method: "POST",
      body: JSON.stringify({
        number: phone,
        mediatype: "document",
        media: data.media,
        fileName: data.fileName || "document",
        caption: data.caption || "",
        ...(data.quotedMessageId && { quoted: { messageId: data.quotedMessageId } }),
      }),
    })
  }

  /**
   * Envia localização
   */
  async sendLocation(
    instanceId: string,
    data: SendLocationRequest
  ): Promise<SendMessageResponse> {
    const phone = normalizePhone(data.phone)

    return this.request<SendMessageResponse>(`/message/sendLocation/${instanceId}`, {
      method: "POST",
      body: JSON.stringify({
        number: phone,
        latitude: data.latitude,
        longitude: data.longitude,
        name: data.name || "",
        address: data.address || "",
      }),
    })
  }

  /**
   * Envia contato
   */
  async sendContact(
    instanceId: string,
    data: SendContactRequest
  ): Promise<SendMessageResponse> {
    const phone = normalizePhone(data.phone)

    return this.request<SendMessageResponse>(`/message/sendContact/${instanceId}`, {
      method: "POST",
      body: JSON.stringify({
        number: phone,
        contact: {
          fullName: data.contactName,
          phoneNumber: normalizePhone(data.contactPhone),
        },
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

// Singleton para uso global
let uazapiClient: UazapiClient | null = null

export function getUazapiClient(): UazapiClient {
  if (!uazapiClient) {
    uazapiClient = new UazapiClient()
  }
  return uazapiClient
}

// Export para uso direto
export const uazapi = getUazapiClient()
