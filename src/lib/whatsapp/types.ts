// Types para integração com Uazapi API
// Docs: https://docs.uazapi.com/

// ============================================
// Instance Types
// ============================================

export type InstanceStatus = "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "BANNED"

export interface UazapiInstance {
  id: string
  name: string
  status: InstanceStatus
  phone?: string
  qrcode?: string
  webhookUrl?: string
}

export interface CreateInstanceResponse {
  success: boolean
  instance: {
    id: string
    name: string
    token: string  // Token único para autenticação desta instância
  }
}

export interface QRCodeResponse {
  success: boolean
  qrcode?: string
  status: InstanceStatus
  message?: string
}

export interface ConnectionStatusResponse {
  success: boolean
  status: InstanceStatus
  phone?: string
  name?: string
  profilePic?: string
}

// ============================================
// Message Types
// ============================================

export type MessageType =
  | "text"
  | "image"
  | "audio"
  | "video"
  | "document"
  | "sticker"
  | "location"
  | "contact"

export interface SendTextMessageRequest {
  phone: string
  message: string
  quotedMessageId?: string
}

export interface SendMediaMessageRequest {
  phone: string
  media: string // URL or base64
  caption?: string
  fileName?: string
  quotedMessageId?: string
}

export interface SendLocationRequest {
  phone: string
  latitude: number
  longitude: number
  name?: string
  address?: string
}

export interface SendContactRequest {
  phone: string
  contactName: string
  contactPhone: string
}

export interface SendMessageResponse {
  success: boolean
  messageId?: string
  status?: string
  error?: string
}

// ============================================
// Webhook Types (eventos recebidos da Uazapi)
// ============================================

export type WebhookEventType =
  | "messages.upsert"       // Nova mensagem
  | "messages.update"       // Status atualizado
  | "connection.update"     // Status de conexão
  | "qr.update"            // QR Code atualizado

export interface WebhookPayload {
  event: WebhookEventType
  instance: string
  data: unknown
}

export interface IncomingMessageWebhook {
  event: "messages.upsert"
  instance: string
  data: {
    key: {
      remoteJid: string
      fromMe: boolean
      id: string
    }
    pushName?: string
    message?: {
      conversation?: string
      extendedTextMessage?: {
        text: string
        contextInfo?: {
          quotedMessage?: unknown
          stanzaId?: string
        }
      }
      imageMessage?: {
        url: string
        mimetype: string
        caption?: string
        fileSha256: string
        fileLength: string
      }
      audioMessage?: {
        url: string
        mimetype: string
        seconds: number
        ptt: boolean
      }
      videoMessage?: {
        url: string
        mimetype: string
        caption?: string
        seconds: number
      }
      documentMessage?: {
        url: string
        mimetype: string
        fileName: string
        fileLength: string
      }
      stickerMessage?: {
        url: string
        mimetype: string
      }
      locationMessage?: {
        degreesLatitude: number
        degreesLongitude: number
        name?: string
        address?: string
      }
      contactMessage?: {
        displayName: string
        vcard: string
      }
    }
    messageTimestamp: number
    status?: number
  }
}

export interface MessageStatusWebhook {
  event: "messages.update"
  instance: string
  data: {
    key: {
      remoteJid: string
      fromMe: boolean
      id: string
    }
    update: {
      status: number // 1=pending, 2=sent, 3=delivered, 4=read, 5=played
    }
  }[]
}

export interface ConnectionUpdateWebhook {
  event: "connection.update"
  instance: string
  data: {
    state: "open" | "close" | "connecting"
    statusReason?: number
  }
}

export interface QRUpdateWebhook {
  event: "qr.update"
  instance: string
  data: {
    qr: string
  }
}

// ============================================
// Helper Types
// ============================================

export interface ParsedMessage {
  id: string
  phone: string
  contactName?: string
  isFromMe: boolean
  type: MessageType
  content?: string
  mediaUrl?: string
  mediaType?: string
  mediaFileName?: string
  mediaDuration?: number
  latitude?: number
  longitude?: number
  locationName?: string
  locationAddress?: string
  contactName2?: string
  contactPhone?: string
  quotedMessageId?: string
  timestamp: Date
}

// Função para normalizar número de telefone (remove caracteres especiais)
export function normalizePhone(phone: string): string {
  // Remove tudo que não é número
  let cleaned = phone.replace(/\D/g, "")

  // Se começa com 55 (Brasil), mantém
  // Se não começa com 55 e tem 10-11 dígitos, adiciona 55
  if (!cleaned.startsWith("55") && (cleaned.length === 10 || cleaned.length === 11)) {
    cleaned = "55" + cleaned
  }

  return cleaned
}

// Função para formatar número para exibição
export function formatPhoneDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")

  // Formato brasileiro: +55 (11) 99999-9999
  if (cleaned.startsWith("55") && cleaned.length >= 12) {
    const ddd = cleaned.slice(2, 4)
    const prefix = cleaned.length === 13 ? cleaned.slice(4, 9) : cleaned.slice(4, 8)
    const suffix = cleaned.length === 13 ? cleaned.slice(9) : cleaned.slice(8)
    return `+55 (${ddd}) ${prefix}-${suffix}`
  }

  return phone
}

// Map de status numérico para string
export const MESSAGE_STATUS_MAP: Record<number, "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED"> = {
  0: "PENDING",
  1: "PENDING",
  2: "SENT",
  3: "DELIVERED",
  4: "READ",
  5: "READ", // played (para áudio/vídeo)
}
