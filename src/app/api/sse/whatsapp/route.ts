import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { getRecentEvents, SSEEvent } from "@/lib/whatsapp/sse-publisher"
import { Redis } from "@upstash/redis"

// Configuração para SSE
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const CHANNEL_PREFIX = "whatsapp:events:"

// GET - Stream de eventos SSE
export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.tenantId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const tenantId = session.user.tenantId
  const { searchParams } = new URL(request.url)
  const lastEventId = searchParams.get("lastEventId")
  const since = lastEventId ? parseInt(lastEventId) : undefined

  // Criar stream de resposta
  const encoder = new TextEncoder()
  let controller: ReadableStreamDefaultController<Uint8Array>
  let isConnectionOpen = true
  let heartbeatInterval: NodeJS.Timeout

  const stream = new ReadableStream<Uint8Array>({
    async start(ctrl) {
      controller = ctrl

      // Enviar eventos recentes se o cliente reconectou
      if (since) {
        try {
          const recentEvents = await getRecentEvents(tenantId, since)
          for (const event of recentEvents) {
            sendEvent(event)
          }
        } catch (error) {
          console.error("[SSE] Error sending recent events:", error)
        }
      }

      // Iniciar heartbeat para manter conexão viva
      heartbeatInterval = setInterval(() => {
        if (isConnectionOpen) {
          try {
            controller.enqueue(encoder.encode(": heartbeat\n\n"))
          } catch {
            // Conexão fechada
            isConnectionOpen = false
            clearInterval(heartbeatInterval)
          }
        }
      }, 30000) // 30 segundos

      // Polling do Redis para novos eventos
      // Nota: Upstash REST API não suporta pub/sub real,
      // então fazemos polling na lista de eventos recentes
      pollForEvents()
    },

    cancel() {
      isConnectionOpen = false
      clearInterval(heartbeatInterval)
    },
  })

  function sendEvent(event: SSEEvent) {
    if (!isConnectionOpen) return

    try {
      const data = `id: ${event.timestamp}\nevent: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`
      controller.enqueue(encoder.encode(data))
    } catch {
      isConnectionOpen = false
    }
  }

  async function pollForEvents() {
    let lastTimestamp = since || Date.now()

    while (isConnectionOpen) {
      try {
        // Aguarda 1 segundo entre polls
        await new Promise((resolve) => setTimeout(resolve, 1000))

        if (!isConnectionOpen) break

        // Busca eventos novos
        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL!,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        })

        const listKey = `${CHANNEL_PREFIX}${tenantId}:recent`
        const events = await redis.lrange(listKey, 0, 9) // Últimos 10

        if (events && events.length > 0) {
          const newEvents = events
            .map((e) => {
              try {
                return typeof e === "string" ? JSON.parse(e) : e
              } catch {
                return null
              }
            })
            .filter((e): e is SSEEvent => e !== null && e.timestamp > lastTimestamp)
            .reverse() // Ordem cronológica

          for (const event of newEvents) {
            sendEvent(event)
            lastTimestamp = Math.max(lastTimestamp, event.timestamp)
          }
        }
      } catch (error) {
        console.error("[SSE] Polling error:", error)
        // Continua tentando
      }
    }
  }

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Nginx
    },
  })
}
