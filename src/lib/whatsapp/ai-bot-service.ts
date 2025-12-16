import { prisma } from "@/lib/prisma"
import { getUazapiClient } from "./uazapi-client"
import { getSystemPrompt, shouldTransferToHuman, isWithinBusinessHours } from "./ai-prompts"
import { handleBotTransfer, QualificationData, detectEquipmentMentioned } from "./bot-state-machine"

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
  console.log("[AI Bot] Processing message:", {
    tenantId,
    conversationId,
    messageType: message.type,
    hasContent: !!message.content,
    contentPreview: message.content?.substring(0, 50),
  })

  // Buscar configuração do bot
  const instance = await prisma.whatsAppInstance.findUnique({
    where: { tenantId },
    include: {
      botConfig: true,
    },
  })

  if (!instance) {
    console.log("[AI Bot] No instance found for tenant:", tenantId)
    return { shouldRespond: false, action: "ignore" }
  }

  if (!instance.botConfig) {
    console.log("[AI Bot] No bot config found for instance:", instance.id)
    return { shouldRespond: false, action: "ignore" }
  }

  if (!instance.botConfig.enabled) {
    console.log("[AI Bot] Bot is disabled in config")
    return { shouldRespond: false, action: "ignore" }
  }

  const botConfig = instance.botConfig
  console.log("[AI Bot] Bot config found:", {
    enabled: botConfig.enabled,
    hasApiKey: !!botConfig.openaiApiKey,
    apiKeyLength: botConfig.openaiApiKey?.length || 0,
    model: botConfig.openaiModel,
  })

  // Verificar se a conversa tem o bot ativo
  const conversation = await prisma.whatsAppConversation.findUnique({
    where: { id: conversationId },
  })

  if (!conversation) {
    console.log("[AI Bot] Conversation not found:", conversationId)
    return { shouldRespond: false, action: "ignore" }
  }

  if (!conversation.isBot) {
    console.log("[AI Bot] Bot is disabled for this conversation (isBot=false)")
    return { shouldRespond: false, action: "ignore" }
  }

  // Verificar se tem API key
  if (!botConfig.openaiApiKey) {
    console.log("[AI Bot] No OpenAI API key configured")
    return { shouldRespond: false, action: "ignore" }
  }

  // Ignorar se não for mensagem de texto
  if (message.type.toLowerCase() !== "text" || !message.content) {
    console.log("[AI Bot] Ignoring non-text message:", message.type)
    return { shouldRespond: false, action: "ignore" }
  }

  console.log("[AI Bot] All checks passed, will process message")

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
    console.log("[AI Bot] Generating AI response...")
    const response = await generateAIResponse(
      botConfig,
      tenantId,
      conversationId,
      message.content,
      message.contactName
    )

    console.log("[AI Bot] AI response generated:", response.substring(0, 100))
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
  console.log("[AI Bot] Calling OpenAI:", {
    model: botConfig.openaiModel || "gpt-4o-mini",
    messagesCount: messages.length,
    temperature: botConfig.temperature || 0.7,
    maxTokens: botConfig.maxTokens || 500,
  })

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

  console.log("[AI Bot] OpenAI response status:", response.status)

  if (!response.ok) {
    const error = await response.text()
    console.error("[AI Bot] OpenAI error response:", error)
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  console.log("[AI Bot] OpenAI response data:", {
    hasChoices: !!data.choices,
    choicesCount: data.choices?.length,
    usage: data.usage,
  })

  const aiResponse = data.choices[0]?.message?.content

  if (!aiResponse) {
    console.error("[AI Bot] Empty response from OpenAI, data:", JSON.stringify(data))
    throw new Error("Empty response from OpenAI")
  }

  return aiResponse
}

/**
 * Detecta se a resposta do bot indica qualificação concluída
 * (resumo de locação com dados do cliente)
 */
function detectQualificationComplete(response: string): { isComplete: boolean; data?: Partial<QualificationData> } {
  const lower = response.toLowerCase()

  // Padrões que indicam que o bot finalizou a qualificação
  const qualificationPatterns = [
    // Resumo estruturado
    /resumo.*loca[çc][ãa]o/i,
    /aqui est[áa].*resumo/i,
    /confirma.*dados/i,
    // Campos coletados (2+ = qualificado)
    /nome.*completo.*:/i,
    /equipamento.*:/i,
    /per[ií]odo.*:/i,
    /retirada.*:/i,
    /entrega.*:/i,
    /endere[çc]o.*:/i,
  ]

  // Contar quantos padrões foram encontrados
  let patternCount = 0
  for (const pattern of qualificationPatterns) {
    if (pattern.test(response)) {
      patternCount++
    }
  }

  // Se tem 3+ padrões, considera qualificação concluída
  if (patternCount >= 3) {
    const equipments = detectEquipmentMentioned(response)
    return {
      isComplete: true,
      data: {
        rentalIntent: true,
        equipmentMentioned: equipments.length > 0 ? equipments : undefined,
        score: 85, // Score alto para qualificação concluída
        qualifiedAt: new Date(),
      },
    }
  }

  // Também detectar frases de conclusão
  const conclusionPhrases = [
    "agradeço pela sua locação",
    "ótimo uso do equipamento",
    "bom trabalho com o equipamento",
    "qualquer dúvida estamos à disposição",
    "entraremos em contato",
    "nossa equipe vai entrar em contato",
    "um atendente vai continuar",
  ]

  for (const phrase of conclusionPhrases) {
    if (lower.includes(phrase)) {
      return {
        isComplete: true,
        data: {
          rentalIntent: true,
          score: 80,
          qualifiedAt: new Date(),
        },
      }
    }
  }

  return { isComplete: false }
}

/**
 * Envia resposta do bot para o WhatsApp
 */
export async function sendBotResponse(
  tenantId: string,
  conversationId: string,
  response: string
): Promise<void> {
  console.log("[AI Bot] Sending response:", {
    conversationId,
    responseLength: response.length,
    responsePreview: response.substring(0, 100),
  })

  // Buscar conversa com instância
  const conversation = await prisma.whatsAppConversation.findUnique({
    where: { id: conversationId },
    include: {
      instance: true,
    },
  })

  if (!conversation) {
    console.error("[AI Bot] Cannot send response: conversation not found")
    return
  }

  if (conversation.instance.status !== "CONNECTED") {
    console.error("[AI Bot] Cannot send response: instance not connected, status:", conversation.instance.status)
    return
  }

  if (!conversation.instance.apiToken) {
    console.error("[AI Bot] Cannot send response: no API token configured")
    return
  }

  console.log("[AI Bot] Instance ready:", {
    instanceId: conversation.instance.instanceId,
    hasApiToken: !!conversation.instance.apiToken,
    status: conversation.instance.status,
  })

  const uazapi = getUazapiClient()

  // Enviar mensagem usando apiToken (NÃO instanceId!)
  const result = await uazapi.sendTextMessage(conversation.instance.apiToken, {
    phone: conversation.contactPhone,
    message: response,
  })

  console.log("[AI Bot] Send result:", result)

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

    // Verificar se a resposta indica qualificação concluída
    const qualificationResult = detectQualificationComplete(response)
    if (qualificationResult.isComplete) {
      console.log("[AI Bot] Qualification complete detected, triggering transfer")

      // Buscar dados da conversa para enriquecer qualificação
      const conversation = await prisma.whatsAppConversation.findUnique({
        where: { id: conversationId },
        select: { contactName: true, contactPhone: true },
      })

      const qualificationData: QualificationData = {
        rentalIntent: qualificationResult.data?.rentalIntent ?? true,
        equipmentMentioned: qualificationResult.data?.equipmentMentioned,
        customerName: conversation?.contactName || undefined,
        customerPhone: conversation?.contactPhone,
        score: qualificationResult.data?.score ?? 85,
        qualifiedAt: new Date(),
      }

      // Transferir para humano
      await handleBotTransfer(tenantId, conversationId, qualificationData)
    }
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
