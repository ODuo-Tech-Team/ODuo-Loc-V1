import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  publishNewMessage,
  publishMessageStatus,
  publishConnectionStatus,
} from "@/lib/whatsapp/sse-publisher"
import { handleBotMessage } from "@/lib/whatsapp/ai-bot-service"

const WEBHOOK_SECRET = process.env.UAZAPI_WEBHOOK_SECRET || ""

// Interface para o formato real da Uazapi
interface UazapiWebhookPayload {
  BaseUrl?: string
  EventType?: string
  event?: string
  instance?: string
  chat?: {
    id?: string
    image?: string
    jid?: string
    name?: string
    phone?: string
  }
  message?: {
    id?: string
    fromMe?: boolean
    type?: string
    content?: string
    text?: string
    body?: string
    timestamp?: number
    messageTimestamp?: number
  }
  data?: any
  [key: string]: any
}

// POST - Receber webhook da Uazapi
export async function POST(request: NextRequest) {
  try {
    // Log raw body para debug
    const rawBody = await request.text()
    console.log("[Webhook] ========== NOVO EVENTO ==========")
    console.log("[Webhook] Raw body:", rawBody.substring(0, 1000))

    let payload: UazapiWebhookPayload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      console.error("[Webhook] Erro ao parsear JSON:", rawBody.substring(0, 200))
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    // Validar secret (se configurado)
    if (WEBHOOK_SECRET) {
      const signature = request.headers.get("x-webhook-secret")
      if (signature !== WEBHOOK_SECRET) {
        console.warn("[Webhook] Invalid secret")
        return NextResponse.json({ error: "Invalid secret" }, { status: 401 })
      }
    }

    // Detectar formato: Uazapi usa EventType, outros usam event
    const eventType = (payload.EventType || payload.event || "").toLowerCase()
    console.log("[Webhook] EventType:", eventType)
    console.log("[Webhook] BaseUrl:", payload.BaseUrl)
    console.log("[Webhook] Chat:", payload.chat ? JSON.stringify(payload.chat).substring(0, 200) : "null")
    console.log("[Webhook] Message:", payload.message ? JSON.stringify(payload.message).substring(0, 200) : "null")

    // Extrair instanceId do BaseUrl (formato: https://oduocombr.uazapi.com)
    // Ou usar o campo instance se existir
    let instanceId = payload.instance
    if (!instanceId && payload.BaseUrl) {
      // Buscar instância pela URL base
      const instance = await prisma.whatsAppInstance.findFirst({
        where: {
          OR: [
            { instanceId: { contains: "oduocombr" } },
            { instanceName: { contains: "oduo" } },
          ]
        }
      })
      if (instance) {
        instanceId = instance.instanceId
      }
    }

    // Se ainda não encontrou, tentar buscar pelo chat.id
    if (!instanceId && payload.chat?.id) {
      // O chat.id pode conter referência à instância
      const chatIdParts = payload.chat.id.split("_")
      if (chatIdParts.length > 0) {
        const possibleInstanceId = chatIdParts[0]
        const instance = await prisma.whatsAppInstance.findFirst({
          where: { instanceId: { startsWith: possibleInstanceId.substring(0, 8) } }
        })
        if (instance) {
          instanceId = instance.instanceId
        }
      }
    }

    // Buscar qualquer instância ativa se não encontrou específica
    let instance = instanceId
      ? await prisma.whatsAppInstance.findFirst({ where: { instanceId } })
      : await prisma.whatsAppInstance.findFirst({ where: { status: "CONNECTED" } })

    if (!instance) {
      console.warn("[Webhook] No instance found, trying first available")
      instance = await prisma.whatsAppInstance.findFirst()
    }

    if (!instance) {
      console.warn("[Webhook] No instance found at all")
      return NextResponse.json({ success: true })
    }

    console.log("[Webhook] Using instance:", instance.id, instance.instanceName)

    // Processar baseado no tipo de evento
    switch (eventType) {
      case "messages":
      case "message":
      case "messages.upsert":
        await handleUazapiMessage(instance.id, instance.tenantId, payload)
        break

      case "messages_update":
      case "messages.update":
      case "message_status":
        await handleUazapiMessageStatus(instance.tenantId, payload)
        break

      case "connection":
      case "connection.update":
      case "status":
        await handleUazapiConnectionUpdate(instance.id, instance.tenantId, payload)
        break

      case "qr":
      case "qr.update":
      case "qrcode":
        await handleUazapiQRUpdate(instance.id, payload)
        break

      default:
        console.log("[Webhook] Evento ignorado:", eventType)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// Handler para mensagens no formato Uazapi
async function handleUazapiMessage(
  instanceId: string,
  tenantId: string,
  payload: UazapiWebhookPayload
) {
  // Extrair dados da mensagem do formato Uazapi
  const chat = payload.chat
  const message = payload.message as any // Cast para acessar propriedades dinâmicas

  console.log("[Webhook] handleUazapiMessage - chat:", chat ? "yes" : "no", "message:", message ? "yes" : "no")

  if (!chat && !message) {
    console.log("[Webhook] No chat or message in payload")
    return
  }

  // Extrair telefone - pode estar em vários lugares
  // Formato chatid: "5511942902107@s.whatsapp.net" ou "5511942902107-1621833676@g.us" (grupo)
  let phone = ""

  // Tentar extrair do message.chatid primeiro
  if (message?.chatid) {
    phone = message.chatid.split("@")[0].split("-")[0] // Remove @s.whatsapp.net e IDs de grupo
  }
  // Fallback para chat.jid
  if (!phone && chat?.jid) {
    phone = chat.jid.split("@")[0].split("-")[0]
  }
  // Fallback para chat.phone
  if (!phone && chat?.phone) {
    phone = chat.phone
  }

  if (!phone) {
    console.log("[Webhook] Could not extract phone from chatid:", message?.chatid, "jid:", chat?.jid)
    return
  }

  console.log("[Webhook] Extracted phone:", phone)

  // Verificar se é mensagem enviada por nós (fromMe)
  const isFromMe = message?.fromMe === true
  if (isFromMe) {
    console.log("[Webhook] Ignoring own message")
    return
  }

  // Extrair conteúdo da mensagem - pode estar em message.content.text ou message.content
  let content = ""
  if (typeof message?.content === "object" && message.content?.text) {
    content = message.content.text
  } else if (typeof message?.content === "string") {
    content = message.content
  } else if (message?.text) {
    content = message.text
  } else if (message?.body) {
    content = message.body
  }

  const messageType = message?.type || "text"
  const messageId = message?.id || `msg_${Date.now()}`
  const contactName = chat?.name || phone

  // Validar timestamp - pode ser em segundos, milissegundos ou inválido
  let messageDate = new Date()
  const rawTimestamp = message?.timestamp || message?.messageTimestamp
  if (rawTimestamp) {
    // Se timestamp é muito grande, provavelmente é milissegundos
    const ts = Number(rawTimestamp)
    if (!isNaN(ts)) {
      if (ts > 1e12) {
        // Milissegundos
        messageDate = new Date(ts)
      } else if (ts > 1e9) {
        // Segundos
        messageDate = new Date(ts * 1000)
      }
    }
    // Validar se a data é razoável (entre 2020 e 2030)
    const year = messageDate.getFullYear()
    if (year < 2020 || year > 2030) {
      console.log("[Webhook] Invalid timestamp, using now:", rawTimestamp)
      messageDate = new Date()
    }
  }

  console.log("[Webhook] Message content:", content?.substring(0, 100), "timestamp:", messageDate.toISOString())

  console.log("[Webhook] Processing message from:", phone, "content:", content?.substring(0, 50))

  // Buscar ou criar conversa
  let conversation = await prisma.whatsAppConversation.findFirst({
    where: {
      instanceId,
      contactPhone: phone,
    },
  })

  if (!conversation) {
    conversation = await prisma.whatsAppConversation.create({
      data: {
        instanceId,
        tenantId,
        contactPhone: phone,
        contactName,
        status: "OPEN",
        isBot: true,
        lastMessage: content?.substring(0, 100) || `[${messageType}]`,
        lastMessageAt: messageDate,
        unreadCount: 1,
      },
    })
    console.log("[Webhook] Created new conversation:", conversation.id)

    // Auto-link com Lead/Customer
    await autoLinkContact(conversation.id, tenantId, phone)
  } else {
    await prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: {
        contactName: contactName || conversation.contactName,
        lastMessage: content?.substring(0, 100) || `[${messageType}]`,
        lastMessageAt: messageDate,
        unreadCount: { increment: 1 },
        status: conversation.status === "CLOSED" ? "OPEN" : conversation.status,
      },
    })
  }

  // Salvar mensagem
  const savedMessage = await prisma.whatsAppMessage.create({
    data: {
      externalId: messageId,
      conversationId: conversation.id,
      direction: "INBOUND",
      type: messageType.toUpperCase() as any,
      content,
      status: "DELIVERED",
    },
  })

  console.log("[Webhook] Saved message:", savedMessage.id)

  // Publicar evento SSE
  await publishNewMessage(tenantId, conversation.id, {
    id: savedMessage.id,
    direction: "INBOUND",
    type: messageType,
    content,
    contactPhone: phone,
    contactName,
  })

  // Processar com bot de IA
  handleBotMessage(tenantId, conversation.id, {
    content,
    type: messageType,
    contactPhone: phone,
    contactName,
  }).catch((error) => {
    console.error("[Webhook] Bot error:", error)
  })
}

// Handler para status de mensagem
async function handleUazapiMessageStatus(
  tenantId: string,
  payload: UazapiWebhookPayload
) {
  const messageId = payload.message?.id
  const status = payload.message?.type || "delivered"

  if (!messageId) return

  const statusMap: Record<string, any> = {
    pending: { status: "PENDING" },
    sent: { status: "SENT", sentAt: new Date() },
    delivered: { status: "DELIVERED", deliveredAt: new Date() },
    read: { status: "READ", readAt: new Date() },
    failed: { status: "FAILED", failedAt: new Date() },
  }

  const data = statusMap[status.toLowerCase()]
  if (!data) return

  await prisma.whatsAppMessage.updateMany({
    where: { externalId: messageId },
    data,
  })

  await publishMessageStatus(tenantId, messageId, status.toUpperCase())
}

// Handler para conexão
async function handleUazapiConnectionUpdate(
  instanceId: string,
  tenantId: string,
  payload: UazapiWebhookPayload
) {
  const state = payload.data?.state || payload.message?.type || "disconnected"

  const statusMap: Record<string, any> = {
    open: "CONNECTED",
    connected: "CONNECTED",
    close: "DISCONNECTED",
    disconnected: "DISCONNECTED",
    connecting: "CONNECTING",
  }

  const newStatus = statusMap[state.toLowerCase()] || "DISCONNECTED"

  const updated = await prisma.whatsAppInstance.update({
    where: { id: instanceId },
    data: {
      status: newStatus,
      qrCode: state === "open" || state === "connected" ? null : undefined,
    },
  })

  await publishConnectionStatus(tenantId, newStatus, updated.phoneNumber || undefined)
}

// Handler para QR Code
async function handleUazapiQRUpdate(instanceId: string, payload: UazapiWebhookPayload) {
  const qrCode = payload.data?.qr || payload.message?.content || ""

  if (!qrCode) return

  await prisma.whatsAppInstance.update({
    where: { id: instanceId },
    data: {
      qrCode,
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
