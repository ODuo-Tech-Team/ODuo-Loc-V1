import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  WebhookPayload,
  identifyWebhookEvent,
  ParsedMessage,
  MESSAGE_STATUS_MAP,
} from "@/lib/whatsapp"
import {
  publishNewMessage,
  publishMessageStatus,
  publishConversationUpdate,
  publishConnectionStatus,
} from "@/lib/whatsapp/sse-publisher"
import { handleBotMessage } from "@/lib/whatsapp/ai-bot-service"

const WEBHOOK_SECRET = process.env.UAZAPI_WEBHOOK_SECRET || ""

// POST - Receber webhook da Uazapi
export async function POST(request: NextRequest) {
  try {
    // Validar secret (se configurado)
    if (WEBHOOK_SECRET) {
      const signature = request.headers.get("x-webhook-secret")
      if (signature !== WEBHOOK_SECRET) {
        console.warn("[Webhook] Invalid secret")
        return NextResponse.json({ error: "Invalid secret" }, { status: 401 })
      }
    }

    const payload: WebhookPayload = await request.json()
    console.log("[Webhook] Received:", payload.event, "Instance:", payload.instance)

    // Buscar instância pelo instanceId
    const instance = await prisma.whatsAppInstance.findFirst({
      where: { instanceId: payload.instance },
    })

    if (!instance) {
      console.warn("[Webhook] Instance not found:", payload.instance)
      return NextResponse.json({ success: true }) // Retorna OK para não bloquear
    }

    const { type, data } = identifyWebhookEvent(payload)

    switch (type) {
      case "message":
        await handleIncomingMessage(instance.id, instance.tenantId, data as ParsedMessage | null)
        break

      case "status":
        await handleMessageStatus(instance.tenantId, data as Array<{ messageId: string; phone: string; status: string }>)
        break

      case "connection":
        await handleConnectionUpdate(instance.id, instance.tenantId, data as { state: string; reason?: number })
        break

      case "qr":
        await handleQRUpdate(instance.id, data as { qrCode: string })
        break

      default:
        console.log("[Webhook] Unknown event type:", type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// Handler: Nova mensagem recebida
async function handleIncomingMessage(
  instanceId: string,
  tenantId: string,
  message: ParsedMessage | null
) {
  if (!message) return

  // Ignorar mensagens enviadas por nós
  if (message.isFromMe) {
    // Apenas atualizar status da mensagem existente
    await prisma.whatsAppMessage.updateMany({
      where: { externalId: message.id },
      data: { status: "SENT", sentAt: new Date() },
    })
    return
  }

  console.log("[Webhook] New message from:", message.phone, "Type:", message.type)

  // Buscar ou criar conversa
  let conversation = await prisma.whatsAppConversation.findFirst({
    where: {
      instanceId,
      contactPhone: message.phone,
    },
  })

  if (!conversation) {
    // Criar nova conversa
    conversation = await prisma.whatsAppConversation.create({
      data: {
        instanceId,
        tenantId,
        contactPhone: message.phone,
        contactName: message.contactName,
        status: "OPEN",
        isBot: true,
        lastMessage: message.content?.substring(0, 100) || `[${message.type}]`,
        lastMessageAt: message.timestamp,
        unreadCount: 1,
      },
    })

    // Tentar vincular automaticamente com Lead ou Customer
    await autoLinkContact(conversation.id, tenantId, message.phone)
  } else {
    // Atualizar conversa existente
    await prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: {
        contactName: message.contactName || conversation.contactName,
        lastMessage: message.content?.substring(0, 100) || `[${message.type}]`,
        lastMessageAt: message.timestamp,
        unreadCount: { increment: 1 },
        status: conversation.status === "CLOSED" ? "OPEN" : conversation.status,
      },
    })
  }

  // Salvar mensagem
  const savedMessage = await prisma.whatsAppMessage.create({
    data: {
      externalId: message.id,
      conversationId: conversation.id,
      direction: "INBOUND",
      type: message.type.toUpperCase() as any,
      content: message.content,
      mediaUrl: message.mediaUrl,
      mediaType: message.mediaType,
      mediaFileName: message.mediaFileName,
      mediaDuration: message.mediaDuration,
      quotedMessageId: message.quotedMessageId,
      status: "DELIVERED",
      metadata: message.latitude
        ? {
            latitude: message.latitude,
            longitude: message.longitude,
            locationName: message.locationName,
            locationAddress: message.locationAddress,
          }
        : message.contactName2
        ? {
            contactName: message.contactName2,
            contactPhone: message.contactPhone,
          }
        : undefined,
    },
  })

  // Publicar evento SSE para real-time updates
  await publishNewMessage(tenantId, conversation.id, {
    id: savedMessage.id,
    direction: "INBOUND",
    type: message.type,
    content: message.content,
    contactPhone: message.phone,
    contactName: message.contactName,
  })

  // Processar com bot de IA (em background, não bloqueia o webhook)
  handleBotMessage(tenantId, conversation.id, {
    content: message.content,
    type: message.type,
    contactPhone: message.phone,
    contactName: message.contactName,
  }).catch((error) => {
    console.error("[Webhook] Bot error:", error)
  })
}

// Handler: Atualização de status de mensagem
async function handleMessageStatus(
  tenantId: string,
  updates: Array<{ messageId: string; phone: string; status: string }>
) {
  for (const update of updates) {
    const statusMap: Record<string, any> = {
      PENDING: { status: "PENDING" },
      SENT: { status: "SENT", sentAt: new Date() },
      DELIVERED: { status: "DELIVERED", deliveredAt: new Date() },
      READ: { status: "READ", readAt: new Date() },
      FAILED: { status: "FAILED", failedAt: new Date() },
    }

    const data = statusMap[update.status]
    if (!data) continue

    await prisma.whatsAppMessage.updateMany({
      where: { externalId: update.messageId },
      data,
    })

    // Publicar evento SSE
    await publishMessageStatus(tenantId, update.messageId, update.status)
  }
}

// Handler: Atualização de conexão
async function handleConnectionUpdate(
  instanceId: string,
  tenantId: string,
  data: { state: string; reason?: number }
) {
  const statusMap: Record<string, any> = {
    CONNECTED: "CONNECTED",
    DISCONNECTED: "DISCONNECTED",
    CONNECTING: "CONNECTING",
  }

  const newStatus = statusMap[data.state] || "DISCONNECTED"

  const updated = await prisma.whatsAppInstance.update({
    where: { id: instanceId },
    data: {
      status: newStatus,
      qrCode: data.state === "CONNECTED" ? null : undefined, // Limpa QR ao conectar
    },
  })

  // Publicar evento SSE
  await publishConnectionStatus(tenantId, newStatus, updated.phoneNumber || undefined)
}

// Handler: Atualização de QR Code
async function handleQRUpdate(instanceId: string, data: { qrCode: string }) {
  await prisma.whatsAppInstance.update({
    where: { id: instanceId },
    data: {
      qrCode: data.qrCode,
      status: "CONNECTING",
    },
  })
}

// Auto-link: Vincula conversa com Lead ou Customer pelo telefone
async function autoLinkContact(
  conversationId: string,
  tenantId: string,
  phone: string
) {
  // Normaliza o telefone para busca (remove +55, espaços, etc)
  const phoneVariants = [
    phone,
    phone.replace(/^55/, ""),
    `55${phone}`,
    phone.replace(/^(\d{2})(\d{4,5})(\d{4})$/, "$1$2$3"),
  ]

  // Primeiro, busca em Leads
  const lead = await prisma.lead.findFirst({
    where: {
      tenantId,
      OR: phoneVariants.flatMap((p) => [{ phone: p }, { whatsapp: p }]),
    },
  })

  if (lead) {
    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: { leadId: lead.id },
    })
    return
  }

  // Depois, busca em Customers
  const customer = await prisma.customer.findFirst({
    where: {
      tenantId,
      OR: phoneVariants.flatMap((p) => [{ phone: p }, { whatsapp: p }]),
    },
  })

  if (customer) {
    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: { customerId: customer.id },
    })
  }
}
