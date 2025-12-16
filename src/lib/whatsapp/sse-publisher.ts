import { Redis } from "@upstash/redis"

// Tipos de eventos SSE
export type SSEEventType =
  | "new_message"
  | "message_status"
  | "conversation_update"
  | "connection_status"
  | "typing"
  | "new_assignment"
  | "bot_transfer"

export interface SSEEvent {
  type: SSEEventType
  tenantId: string
  data: unknown
  timestamp: number
}

// Cliente Redis para pub/sub - pode ser null se não configurado
let redis: Redis | null = null

// Verificar se Redis está configurado
const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

if (redisUrl && redisToken) {
  redis = new Redis({
    url: redisUrl,
    token: redisToken,
  })
} else {
  console.warn("[SSE Publisher] Redis não configurado - eventos SSE desabilitados")
}

const CHANNEL_PREFIX = "whatsapp:events:"

/**
 * Publica um evento SSE para um tenant específico
 * Se Redis não estiver configurado, apenas loga o evento (não bloqueia)
 */
export async function publishSSEEvent(
  tenantId: string,
  type: SSEEventType,
  data: unknown
): Promise<void> {
  const event: SSEEvent = {
    type,
    tenantId,
    data,
    timestamp: Date.now(),
  }

  // Se Redis não está configurado, apenas logar e retornar
  if (!redis) {
    console.log(`[SSE] Event (no Redis): ${type}`, JSON.stringify(data).substring(0, 100))
    return
  }

  const channel = `${CHANNEL_PREFIX}${tenantId}`

  try {
    // Publica no Redis
    await redis.publish(channel, JSON.stringify(event))

    // Também salva em uma lista para clientes que reconectam
    // Mantém apenas os últimos 100 eventos por 5 minutos
    const listKey = `${channel}:recent`
    await redis.lpush(listKey, JSON.stringify(event))
    await redis.ltrim(listKey, 0, 99)
    await redis.expire(listKey, 300) // 5 minutos
  } catch (error) {
    console.error("[SSE] Error publishing event:", error)
  }
}

/**
 * Busca eventos recentes (para clientes que reconectam)
 */
export async function getRecentEvents(
  tenantId: string,
  since?: number
): Promise<SSEEvent[]> {
  // Se Redis não está configurado, retornar array vazio
  if (!redis) {
    return []
  }

  const listKey = `${CHANNEL_PREFIX}${tenantId}:recent`

  try {
    const events = await redis.lrange(listKey, 0, -1)

    if (!events || events.length === 0) return []

    const parsed = events
      .map((e) => {
        try {
          return typeof e === "string" ? JSON.parse(e) : e
        } catch {
          return null
        }
      })
      .filter((e): e is SSEEvent => e !== null)

    // Filtra eventos desde o timestamp especificado
    if (since) {
      return parsed.filter((e) => e.timestamp > since)
    }

    return parsed
  } catch (error) {
    console.error("[SSE] Error getting recent events:", error)
    return []
  }
}

// Helpers para publicar eventos específicos

export async function publishNewMessage(
  tenantId: string,
  conversationId: string,
  message: {
    id: string
    direction: string
    type: string
    content?: string
    contactPhone?: string
    contactName?: string
    metadata?: Record<string, any>
    // Campos de grupo
    isGroup?: boolean
    groupName?: string
    senderName?: string
  }
): Promise<void> {
  await publishSSEEvent(tenantId, "new_message", {
    conversationId,
    message,
  })
}

export async function publishMessageStatus(
  tenantId: string,
  messageId: string,
  status: string
): Promise<void> {
  await publishSSEEvent(tenantId, "message_status", {
    messageId,
    status,
  })
}

export async function publishConversationUpdate(
  tenantId: string,
  conversationId: string,
  updates: {
    status?: string
    unreadCount?: number
    lastMessage?: string
    assignedToId?: string
  }
): Promise<void> {
  await publishSSEEvent(tenantId, "conversation_update", {
    conversationId,
    ...updates,
  })
}

export async function publishConnectionStatus(
  tenantId: string,
  status: string,
  phoneNumber?: string
): Promise<void> {
  await publishSSEEvent(tenantId, "connection_status", {
    status,
    phoneNumber,
  })
}

export async function publishTyping(
  tenantId: string,
  conversationId: string,
  isTyping: boolean
): Promise<void> {
  await publishSSEEvent(tenantId, "typing", {
    conversationId,
    isTyping,
  })
}

/**
 * Publica notificação para um usuário específico
 * Usado para atribuições e transferências do bot
 */
export async function publishSSE(
  userId: string,
  type: "new_assignment" | "bot_transfer",
  data: {
    conversationId: string
    title?: string
    body?: string
    playSound?: boolean
  }
): Promise<void> {
  // Buscar tenantId do usuário para publicar no canal correto
  const { prisma } = await import("@/lib/prisma")

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tenantId: true },
  })

  if (!user) {
    console.warn(`[SSE] User not found: ${userId}`)
    return
  }

  await publishSSEEvent(user.tenantId, type, {
    targetUserId: userId,
    ...data,
  })
}

/**
 * Publica nova atribuição de conversa
 */
export async function publishNewAssignment(
  tenantId: string,
  userId: string,
  conversationId: string,
  contactName?: string
): Promise<void> {
  await publishSSEEvent(tenantId, "new_assignment", {
    targetUserId: userId,
    conversationId,
    title: "Nova conversa atribuída",
    body: contactName ? `Conversa com ${contactName}` : "Nova conversa para atendimento",
    playSound: true,
  })
}

/**
 * Publica transferência do bot para humano
 */
export async function publishBotTransfer(
  tenantId: string,
  userId: string,
  conversationId: string,
  contactName?: string
): Promise<void> {
  await publishSSEEvent(tenantId, "bot_transfer", {
    targetUserId: userId,
    conversationId,
    title: "Bot transferiu conversa",
    body: contactName
      ? `${contactName} foi qualificado pelo bot`
      : "Cliente qualificado aguardando atendimento",
    playSound: true,
  })
}
