import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { getRecentEvents } from "@/lib/whatsapp/sse-publisher"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Intervalo de polling em ms (2 segundos)
const POLL_INTERVAL = 2000

// Timeout maximo da conexao (5 minutos)
const CONNECTION_TIMEOUT = 5 * 60 * 1000

export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.tenantId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const tenantId = session.user.tenantId

  // Pegar lastEventId do query param (para reconexao)
  const lastEventId = request.nextUrl.searchParams.get("lastEventId")
  let lastTimestamp = lastEventId ? parseInt(lastEventId, 10) : Date.now()

  // Headers para SSE
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  })

  const encoder = new TextEncoder()
  let isConnected = true
  const startTime = Date.now()

  const stream = new ReadableStream({
    async start(controller) {
      // Enviar evento de conexao
      controller.enqueue(
        encoder.encode(`event: connected\ndata: {"status":"connected"}\n\n`)
      )

      // Funcao para buscar e enviar eventos
      const pollEvents = async () => {
        if (!isConnected) return

        // Verificar timeout
        if (Date.now() - startTime > CONNECTION_TIMEOUT) {
          controller.enqueue(
            encoder.encode(`event: timeout\ndata: {"message":"Connection timeout"}\n\n`)
          )
          controller.close()
          return
        }

        try {
          const events = await getRecentEvents(tenantId, lastTimestamp)

          for (const event of events) {
            if (event.timestamp > lastTimestamp) {
              // Enviar evento formatado para SSE
              const sseData = `event: ${event.type}\nid: ${event.timestamp}\ndata: ${JSON.stringify(event.data)}\n\n`
              controller.enqueue(encoder.encode(sseData))
              lastTimestamp = event.timestamp
            }
          }
        } catch (error) {
          console.error("[SSE] Error polling events:", error)
        }

        // Enviar heartbeat para manter conexao viva
        controller.enqueue(encoder.encode(`: heartbeat\n\n`))

        // Agendar proximo poll
        if (isConnected) {
          setTimeout(pollEvents, POLL_INTERVAL)
        }
      }

      // Iniciar polling
      pollEvents()
    },

    cancel() {
      isConnected = false
    },
  })

  return new Response(stream, { headers })
}
