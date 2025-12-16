import { prisma } from "@/lib/prisma"
import { autoAssignOnBotTransfer } from "./assignment-service"
import { getUazapiClient } from "./uazapi-client"

/**
 * Máquina de Estados do Bot WhatsApp
 *
 * Estados:
 * - PENDING: Bot ativo, aguardando qualificação
 * - OPEN: Bot desativado, atendimento humano
 * - RESOLVED: Atendimento finalizado
 * - CLOSED: Encerrado permanentemente
 *
 * Transições:
 * 1. Nova conversa → PENDING, isBot: true
 * 2. Bot qualifica → OPEN, isBot: false, auto-assign
 * 3. Agente msg proativa → OPEN, isBot: false
 * 4. Inatividade 48h → PENDING, isBot: true
 * 5. Agente resolve → RESOLVED
 */

export interface QualificationData {
  rentalIntent: boolean
  equipmentMentioned?: string[]
  customerName?: string
  customerPhone?: string
  customerCpf?: string
  rentalPeriod?: {
    start?: string
    end?: string
    days?: number
  }
  score: number // 0-100
  qualifiedAt?: Date
}

// Palavras-chave para detectar intenção de locação
const RENTAL_INTENT_KEYWORDS = [
  "alugar",
  "locar",
  "locação",
  "locacao",
  "aluguel",
  "preciso",
  "quero",
  "gostaria",
  "disponível",
  "disponivel",
  "preço",
  "preco",
  "valor",
  "diária",
  "diaria",
  "orçamento",
  "orcamento",
  "quanto custa",
  "quanto fica",
  "tem para alugar",
  "vocês têm",
  "voces tem",
  "trabalham com",
]

// Palavras que indicam equipamentos
const EQUIPMENT_KEYWORDS = [
  "betoneira",
  "andaime",
  "compactador",
  "gerador",
  "escavadeira",
  "retroescavadeira",
  "rompedor",
  "martelete",
  "furadeira",
  "cortadora",
  "serra",
  "guincho",
  "plataforma",
  "empilhadeira",
  "container",
  "trator",
  "bobcat",
  "minicarregadeira",
]

/**
 * Detecta intenção de locação em uma mensagem
 */
export function detectRentalIntent(message: string): boolean {
  const lower = message.toLowerCase()
  return RENTAL_INTENT_KEYWORDS.some((kw) => lower.includes(kw))
}

/**
 * Detecta equipamentos mencionados na mensagem
 */
export function detectEquipmentMentioned(message: string): string[] {
  const lower = message.toLowerCase()
  return EQUIPMENT_KEYWORDS.filter((eq) => lower.includes(eq))
}

/**
 * Calcula score de qualificação (0-100)
 */
export function calculateQualificationScore(
  messages: { content: string | null; direction: string }[]
): number {
  let score = 0

  for (const msg of messages) {
    if (!msg.content) continue
    const lower = msg.content.toLowerCase()

    // Intenção de locação (+30)
    if (RENTAL_INTENT_KEYWORDS.some((kw) => lower.includes(kw))) {
      score += 30
    }

    // Equipamento mencionado (+20)
    if (EQUIPMENT_KEYWORDS.some((eq) => lower.includes(eq))) {
      score += 20
    }

    // Pergunta sobre preço (+15)
    if (
      lower.includes("quanto") ||
      lower.includes("preço") ||
      lower.includes("valor")
    ) {
      score += 15
    }

    // Pergunta sobre disponibilidade (+15)
    if (
      lower.includes("disponível") ||
      lower.includes("tem") ||
      lower.includes("vocês têm")
    ) {
      score += 15
    }

    // Menciona período (+10)
    if (
      lower.includes("dia") ||
      lower.includes("semana") ||
      lower.includes("mês")
    ) {
      score += 10
    }
  }

  return Math.min(score, 100) // Cap em 100
}

/**
 * Handler para nova conversa
 * Conversa inicia como PENDING com bot ativo
 */
export async function handleNewConversation(
  tenantId: string,
  conversationId: string
): Promise<void> {
  console.log(`[BotStateMachine] New conversation: ${conversationId}`)

  await prisma.whatsAppConversation.update({
    where: { id: conversationId },
    data: {
      status: "PENDING",
      isBot: true,
      botActivatedAt: new Date(),
    },
  })
}

/**
 * Handler para quando bot transfere para humano
 * Muda para OPEN, desativa bot, auto-assign
 */
export async function handleBotTransfer(
  tenantId: string,
  conversationId: string,
  qualificationData?: QualificationData
): Promise<void> {
  console.log(`[BotStateMachine] Bot transfer: ${conversationId}`)

  // Atualizar conversa
  await prisma.whatsAppConversation.update({
    where: { id: conversationId },
    data: {
      status: "OPEN",
      isBot: false,
      botTransferredAt: new Date(),
      qualificationData: qualificationData as any,
      qualificationScore: qualificationData?.score,
    },
  })

  // Auto-atribuir a um agente
  await autoAssignOnBotTransfer(tenantId, conversationId)
}

/**
 * Handler para mensagem proativa de agente
 * Muda para OPEN, desativa bot, atribui ao agente que enviou
 */
export async function handleAgentProactiveMessage(
  conversationId: string,
  agentId: string
): Promise<void> {
  console.log(
    `[BotStateMachine] Agent proactive message: ${conversationId} by ${agentId}`
  )

  await prisma.whatsAppConversation.update({
    where: { id: conversationId },
    data: {
      status: "OPEN",
      isBot: false,
      assignedToId: agentId,
      assignedAt: new Date(),
      lastAgentMessageAt: new Date(),
    },
  })
}

/**
 * Handler para reativação por inatividade (48h)
 * Volta para PENDING, reativa bot
 */
export async function handleInactivityReactivation(
  tenantId: string,
  conversationId: string
): Promise<void> {
  console.log(`[BotStateMachine] Inactivity reactivation: ${conversationId}`)

  const conversation = await prisma.whatsAppConversation.findUnique({
    where: { id: conversationId },
    include: {
      instance: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true },
      },
    },
  })

  if (!conversation) return

  // Atualizar conversa
  await prisma.whatsAppConversation.update({
    where: { id: conversationId },
    data: {
      status: "PENDING",
      isBot: true,
      assignedToId: null,
      botActivatedAt: new Date(),
    },
  })

  // Enviar greeting de reativação
  if (conversation.instance.apiToken) {
    const greeting = generateReactivationGreeting(
      conversation.contactName,
      conversation.messages[0]?.content
    )

    try {
      const uazapi = getUazapiClient()
      await uazapi.sendTextMessage(conversation.instance.apiToken, {
        phone: conversation.contactPhone,
        message: greeting,
      })

      // Salvar mensagem enviada
      await prisma.whatsAppMessage.create({
        data: {
          conversationId,
          direction: "OUTBOUND",
          type: "TEXT",
          content: greeting,
          status: "SENT",
          sentAt: new Date(),
          isFromBot: true,
        },
      })

      // Atualizar última mensagem
      await prisma.whatsAppConversation.update({
        where: { id: conversationId },
        data: {
          lastMessage: greeting.substring(0, 100),
          lastMessageAt: new Date(),
        },
      })
    } catch (error) {
      console.error("[BotStateMachine] Error sending reactivation message:", error)
    }
  }
}

/**
 * Gera mensagem de reativação contextual
 */
function generateReactivationGreeting(
  contactName?: string | null,
  lastMessageContent?: string | null
): string {
  const name = contactName || "cliente"

  if (lastMessageContent) {
    // Tentar extrair contexto do último assunto
    const equipment = EQUIPMENT_KEYWORDS.find((eq) =>
      lastMessageContent.toLowerCase().includes(eq)
    )

    if (equipment) {
      return `Olá${contactName ? ` ${contactName}` : ""}! Vi que você havia demonstrado interesse em ${equipment}. Posso ajudar com mais alguma informação?`
    }
  }

  return `Olá${contactName ? ` ${contactName}` : ""}! Vi que havíamos conversado anteriormente. Posso ajudar com algo mais?`
}

/**
 * Handler para resolver conversa
 */
export async function handleConversationResolved(
  conversationId: string,
  resolvedByUserId: string
): Promise<void> {
  console.log(`[BotStateMachine] Conversation resolved: ${conversationId}`)

  await prisma.whatsAppConversation.update({
    where: { id: conversationId },
    data: {
      status: "RESOLVED",
      isBot: false,
      closedAt: new Date(),
      closedByUserId: resolvedByUserId,
    },
  })
}

/**
 * Verifica se deve transferir para humano baseado na qualificação
 */
export async function shouldTransferToHuman(
  conversationId: string
): Promise<{ shouldTransfer: boolean; qualificationData?: QualificationData }> {
  // Buscar últimas mensagens da conversa
  const messages = await prisma.whatsAppMessage.findMany({
    where: { conversationId, direction: "INBOUND" },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { content: true, direction: true },
  })

  // Calcular score de qualificação
  const score = calculateQualificationScore(
    messages.map((m) => ({ content: m.content, direction: m.direction }))
  )

  // Se score >= 60, qualificado para transferência
  if (score >= 60) {
    const allContent = messages.map((m) => m.content || "").join(" ")

    return {
      shouldTransfer: true,
      qualificationData: {
        rentalIntent: detectRentalIntent(allContent),
        equipmentMentioned: detectEquipmentMentioned(allContent),
        score,
        qualifiedAt: new Date(),
      },
    }
  }

  return { shouldTransfer: false }
}

/**
 * Processa estado da conversa após nova mensagem
 */
export async function processConversationState(
  tenantId: string,
  conversationId: string,
  messageDirection: "INBOUND" | "OUTBOUND",
  senderId?: string
): Promise<void> {
  const conversation = await prisma.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: { status: true, isBot: true },
  })

  if (!conversation) return

  // Se mensagem é do agente (OUTBOUND de humano)
  if (messageDirection === "OUTBOUND" && senderId) {
    // Se conversa estava PENDING ou CLOSED, abrir e desativar bot
    if (conversation.status === "PENDING" || conversation.status === "CLOSED") {
      await handleAgentProactiveMessage(conversationId, senderId)
    }
    return
  }

  // Se mensagem é do cliente (INBOUND) e bot está ativo
  if (messageDirection === "INBOUND" && conversation.isBot) {
    // Verificar se deve transferir para humano
    const { shouldTransfer, qualificationData } =
      await shouldTransferToHuman(conversationId)

    if (shouldTransfer) {
      await handleBotTransfer(tenantId, conversationId, qualificationData)
    }
  }
}
