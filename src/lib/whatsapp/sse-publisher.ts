import { Redis } from "@upstash/redis"

// Tipos de eventos SSE
export type SSEEventType =
  | "new_message"
  | "message_status"
  | "conversation_update"
  | "connection_status"
  | "typing"

export interface SSEEvent {
  type: SSEEventType
  tenantId: string
  data: unknown
  timestamp: number
}

// Cliente Redis para pub/sub
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const CHANNEL_PREFIX = "whatsapp:events:"

/**
 * Publica um evento SSE para um tenant específico
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
    contactPhone: string
    contactName?: string
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
