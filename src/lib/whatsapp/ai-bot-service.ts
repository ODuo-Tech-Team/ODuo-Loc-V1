import { prisma } from "@/lib/prisma"
import { getUazapiClient } from "./uazapi-client"
import { getSystemPrompt, shouldTransferToHuman, isWithinBusinessHours } from "./ai-prompts"

interface ProcessMessageResult {
  shouldRespond: boolean
  response?: string
  action?: "respond" | "transfer" | "away" | "ignore"
}

/**
 * Processa uma mensagem recebida e decide se o bot deve responder
 */
export async function processIncomingMessage(
  tenantId: string,
  conversationId: string,
  message: {
    content?: string
    type: string
    contactPhone: string
    contactName?: string
  }
): Promise<ProcessMessageResult> {
  // Buscar configuração do bot
  const instance = await prisma.whatsAppInstance.findUnique({
    where: { tenantId },
    include: {
      botConfig: true,
    },
  })

  if (!instance || !instance.botConfig || !instance.botConfig.enabled) {
    return { shouldRespond: false, action: "ignore" }
  }

  const botConfig = instance.botConfig

  // Verificar se a conversa tem o bot ativo
  const conversation = await prisma.whatsAppConversation.findUnique({
    where: { id: conversationId },
  })

  if (!conversation || !conversation.isBot) {
    return { shouldRespond: false, action: "ignore" }
  }

  // Verificar se tem API key
  if (!botConfig.openaiApiKey) {
    return { shouldRespond: false, action: "ignore" }
  }

  // Ignorar se não for mensagem de texto
  if (message.type !== "text" || !message.content) {
    return { shouldRespond: false, action: "ignore" }
  }

  // Verificar horário comercial
  if (botConfig.businessHours) {
    const isOpen = isWithinBusinessHours(botConfig.businessHours as Record<string, any>)
    if (!isOpen) {
      // Enviar mensagem de ausência
      if (botConfig.awayMessage) {
        return {
          shouldRespond: true,
          response: botConfig.awayMessage,
          action: "away",
        }
      }
      return { shouldRespond: false, action: "ignore" }
    }
  }

  // Verificar se deve transferir para humano
  if (shouldTransferToHuman(message.content, botConfig.transferKeywords)) {
    // Marcar conversa como não-bot
    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: { isBot: false },
    })

    if (botConfig.transferMessage) {
      return {
        shouldRespond: true,
        response: botConfig.transferMessage,
        action: "transfer",
      }
    }

    return { shouldRespond: false, action: "transfer" }
  }

  // Gerar resposta com IA
  try {
    const response = await generateAIResponse(
      botConfig,
      tenantId,
      conversationId,
      message.content,
      message.contactName
    )

    return {
      shouldRespond: true,
      response,
      action: "respond",
    }
  } catch (error) {
    console.error("[AI Bot] Error generating response:", error)
    return { shouldRespond: false, action: "ignore" }
  }
}

/**
 * Gera resposta usando OpenAI
 */
async function generateAIResponse(
  botConfig: {
    openaiApiKey: string | null
    openaiModel: string
    temperature: number
    maxTokens: number
    systemPrompt: string | null
    includeEquipmentCatalog: boolean
    includeRentalPrices: boolean
    autoCreateLeads: boolean
  },
  tenantId: string,
  conversationId: string,
  userMessage: string,
  contactName?: string
): Promise<string> {
  if (!botConfig.openaiApiKey) {
    throw new Error("API key not configured")
  }

  // Buscar histórico de mensagens para contexto (últimas 10)
  const recentMessages = await prisma.whatsAppMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  // Buscar tenant para contexto
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      name: true,
      phone: true,
      address: true,
    },
  })

  // Buscar catálogo se habilitado
  let catalogContext = ""
  if (botConfig.includeEquipmentCatalog) {
    const equipment = await prisma.equipment.findMany({
      where: { tenantId, status: "AVAILABLE" },
      take: 20,
      select: {
        name: true,
        description: true,
        pricePerDay: botConfig.includeRentalPrices,
      },
    })

    if (equipment.length > 0) {
      catalogContext = "\n\nEquipamentos disponíveis:\n" +
        equipment.map((e) => {
          let text = `- ${e.name}`
          if (e.description) text += `: ${e.description}`
          if (botConfig.includeRentalPrices && e.pricePerDay) {
            text += ` (Diária: R$ ${e.pricePerDay})`
          }
          return text
        }).join("\n")
    }
  }

  // Montar system prompt
  const systemPrompt = getSystemPrompt(
    botConfig.systemPrompt,
    tenant?.name || "Locadora",
    catalogContext
  )

  // Montar mensagens para a API
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ]

  // Adicionar histórico (em ordem cronológica)
  const sortedMessages = recentMessages.reverse()
  for (const msg of sortedMessages) {
    if (!msg.content) continue
    messages.push({
      role: msg.direction === "INBOUND" ? "user" : "assistant",
      content: msg.content,
    })
  }

  // Adicionar mensagem atual
  messages.push({
    role: "user",
    content: userMessage,
  })

  // Chamar OpenAI
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${botConfig.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: botConfig.openaiModel || "gpt-4o-mini",
      messages,
      temperature: botConfig.temperature || 0.7,
      max_tokens: botConfig.maxTokens || 500,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error("[AI Bot] OpenAI error:", error)
    throw new Error("OpenAI API error")
  }

  const data = await response.json()
  const aiResponse = data.choices[0]?.message?.content

  if (!aiResponse) {
    throw new Error("Empty response from OpenAI")
  }

  return aiResponse
}

/**
 * Envia resposta do bot para o WhatsApp
 */
export async function sendBotResponse(
  tenantId: string,
  conversationId: string,
  response: string
): Promise<void> {
  // Buscar conversa com instância
  const conversation = await prisma.whatsAppConversation.findUnique({
    where: { id: conversationId },
    include: {
      instance: true,
    },
  })

  if (!conversation || conversation.instance.status !== "CONNECTED") {
    console.error("[AI Bot] Cannot send response: instance not connected")
    return
  }

  const uazapi = getUazapiClient()

  // Enviar mensagem
  const result = await uazapi.sendTextMessage(conversation.instance.instanceId, {
    phone: conversation.contactPhone,
    message: response,
  })

  if (result.success && result.messageId) {
    // Salvar mensagem no banco
    await prisma.whatsAppMessage.create({
      data: {
        externalId: result.messageId,
        conversationId,
        direction: "OUTBOUND",
        type: "TEXT",
        content: response,
        status: "SENT",
        sentAt: new Date(),
        isFromBot: true,
      },
    })

    // Atualizar última mensagem
    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: response.substring(0, 100),
        lastMessageAt: new Date(),
      },
    })
  }
}

/**
 * Processa mensagem e envia resposta (função principal)
 */
export async function handleBotMessage(
  tenantId: string,
  conversationId: string,
  message: {
    content?: string
    type: string
    contactPhone: string
    contactName?: string
  }
): Promise<void> {
  const result = await processIncomingMessage(tenantId, conversationId, message)

  if (result.shouldRespond && result.response) {
    // Adicionar pequeno delay para parecer mais natural
    await new Promise((resolve) => setTimeout(resolve, 1500))

    await sendBotResponse(tenantId, conversationId, result.response)
  }

  // Se ação foi criar lead automaticamente
  const botConfig = await prisma.whatsAppBotConfig.findFirst({
    where: {
      instance: { tenantId },
    },
  })

  if (botConfig?.autoCreateLeads) {
    const conversation = await prisma.whatsAppConversation.findUnique({
      where: { id: conversationId },
    })

    // Se não tem lead vinculado, criar
    if (conversation && !conversation.leadId && !conversation.customerId) {
      const existingLead = await prisma.lead.findFirst({
        where: {
          tenantId,
          OR: [
            { phone: conversation.contactPhone },
            { whatsapp: conversation.contactPhone },
          ],
        },
      })

      if (!existingLead) {
        const newLead = await prisma.lead.create({
          data: {
            tenantId,
            name: conversation.contactName || "Contato WhatsApp",
            phone: conversation.contactPhone,
            whatsapp: conversation.contactPhone,
            source: "SOCIAL_MEDIA",
            status: "NEW",
            interestNotes: "Lead criado automaticamente via WhatsApp Bot",
          },
        })

        await prisma.whatsAppConversation.update({
          where: { id: conversationId },
          data: { leadId: newLead.id },
        })
      }
    }
  }
}
