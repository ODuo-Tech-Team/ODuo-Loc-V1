import {
  WebhookPayload,
  IncomingMessageWebhook,
  MessageStatusWebhook,
  ConnectionUpdateWebhook,
  QRUpdateWebhook,
  ParsedMessage,
  MessageType,
  MESSAGE_STATUS_MAP,
} from "./types"

/**
 * Parseia o payload de uma mensagem recebida
 */
export function parseIncomingMessage(
  webhook: IncomingMessageWebhook
): ParsedMessage | null {
  const { data } = webhook
  const { key, message, pushName, messageTimestamp } = data

  if (!message) return null

  // Extrai o número de telefone do JID
  const phone = key.remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "")

  // Determina o tipo e conteúdo da mensagem
  let type: MessageType = "text"
  let content: string | undefined
  let mediaUrl: string | undefined
  let mediaType: string | undefined
  let mediaFileName: string | undefined
  let mediaDuration: number | undefined
  let latitude: number | undefined
  let longitude: number | undefined
  let locationName: string | undefined
  let locationAddress: string | undefined
  let contactName2: string | undefined
  let contactPhone: string | undefined
  let quotedMessageId: string | undefined

  if (message.conversation) {
    type = "text"
    content = message.conversation
  } else if (message.extendedTextMessage) {
    type = "text"
    content = message.extendedTextMessage.text
    quotedMessageId = message.extendedTextMessage.contextInfo?.stanzaId
  } else if (message.imageMessage) {
    type = "image"
    content = message.imageMessage.caption
    mediaUrl = message.imageMessage.url
    mediaType = message.imageMessage.mimetype
  } else if (message.audioMessage) {
    type = "audio"
    mediaUrl = message.audioMessage.url
    mediaType = message.audioMessage.mimetype
    mediaDuration = message.audioMessage.seconds
  } else if (message.videoMessage) {
    type = "video"
    content = message.videoMessage.caption
    mediaUrl = message.videoMessage.url
    mediaType = message.videoMessage.mimetype
    mediaDuration = message.videoMessage.seconds
  } else if (message.documentMessage) {
    type = "document"
    mediaUrl = message.documentMessage.url
    mediaType = message.documentMessage.mimetype
    mediaFileName = message.documentMessage.fileName
  } else if (message.stickerMessage) {
    type = "sticker"
    mediaUrl = message.stickerMessage.url
    mediaType = message.stickerMessage.mimetype
  } else if (message.locationMessage) {
    type = "location"
    latitude = message.locationMessage.degreesLatitude
    longitude = message.locationMessage.degreesLongitude
    locationName = message.locationMessage.name
    locationAddress = message.locationMessage.address
  } else if (message.contactMessage) {
    type = "contact"
    contactName2 = message.contactMessage.displayName
    // Tenta extraer o telefone do vCard
    const vcardMatch = message.contactMessage.vcard.match(/TEL[^:]*:([^\n]+)/)
    contactPhone = vcardMatch ? vcardMatch[1].replace(/\D/g, "") : undefined
  }

  return {
    id: key.id,
    phone,
    contactName: pushName,
    isFromMe: key.fromMe,
    type,
    content,
    mediaUrl,
    mediaType,
    mediaFileName,
    mediaDuration,
    latitude,
    longitude,
    locationName,
    locationAddress,
    contactName2,
    contactPhone,
    quotedMessageId,
    timestamp: new Date(messageTimestamp * 1000),
  }
}

/**
 * Parseia o payload de atualização de status
 */
export function parseMessageStatus(
  webhook: MessageStatusWebhook
): Array<{
  messageId: string
  phone: string
  status: "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED"
}> {
  return webhook.data.map((item) => ({
    messageId: item.key.id,
    phone: item.key.remoteJid.replace("@s.whatsapp.net", ""),
    status: MESSAGE_STATUS_MAP[item.update.status] || "PENDING",
  }))
}

/**
 * Parseia o payload de atualização de conexão
 */
export function parseConnectionUpdate(
  webhook: ConnectionUpdateWebhook
): {
  state: "CONNECTED" | "DISCONNECTED" | "CONNECTING"
  reason?: number
} {
  const stateMap: Record<string, "CONNECTED" | "DISCONNECTED" | "CONNECTING"> = {
    open: "CONNECTED",
    close: "DISCONNECTED",
    connecting: "CONNECTING",
  }

  return {
    state: stateMap[webhook.data.state] || "DISCONNECTED",
    reason: webhook.data.statusReason,
  }
}

/**
 * Parseia o payload de atualização do QR Code
 */
export function parseQRUpdate(webhook: QRUpdateWebhook): { qrCode: string } {
  return {
    qrCode: webhook.data.qr,
  }
}

/**
 * Identifica o tipo de evento do webhook
 */
export function identifyWebhookEvent(
  payload: WebhookPayload
): {
  type: "message" | "status" | "connection" | "qr" | "unknown"
  data: unknown
} {
  switch (payload.event) {
    case "messages.upsert":
      return { type: "message", data: parseIncomingMessage(payload as IncomingMessageWebhook) }

    case "messages.update":
      return { type: "status", data: parseMessageStatus(payload as MessageStatusWebhook) }

    case "connection.update":
      return { type: "connection", data: parseConnectionUpdate(payload as ConnectionUpdateWebhook) }

    case "qr.update":
      return { type: "qr", data: parseQRUpdate(payload as QRUpdateWebhook) }

    default:
      return { type: "unknown", data: payload.data }
  }
}

/**
 * Valida o webhook secret (HMAC)
 */
export function validateWebhookSecret(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Implementar se a Uazapi usar assinatura HMAC
  // Por enquanto, apenas comparação simples
  if (!secret) return true

  // A Uazapi pode enviar o secret no header x-webhook-secret
  return signature === secret
}
