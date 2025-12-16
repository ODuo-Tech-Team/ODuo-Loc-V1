import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleInactivityReactivation } from "@/lib/whatsapp/bot-state-machine"

/**
 * Cron Job: Reativacao de conversas inativas por 48h
 *
 * Verifica conversas que:
 * - Status = OPEN (em atendimento humano)
 * - isBot = false
 * - lastMessageAt < 48 horas atras
 * - Nao estao arquivadas
 *
 * Para cada conversa encontrada:
 * - Muda status para PENDING
 * - Reativa o bot (isBot = true)
 * - Remove atribuicao
 * - Envia mensagem de reativacao
 *
 * Schedule: A cada 4 horas (0 * /4 * * *)
 */

// Tempo de inatividade em horas (48h padrao)
const INACTIVITY_HOURS = 48

export async function GET(request: NextRequest) {
  try {
    // Verificar autorização (Vercel Cron ou CRON_SECRET)
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    // Em produção, verificar o header de autorização
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn("[Cron Inactivity] Unauthorized request")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[Cron Inactivity] Starting inactivity check...")

    // Calcular data de corte (48 horas atrás)
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - INACTIVITY_HOURS)

    // Buscar conversas OPEN inativas por 48h
    const inactiveConversations = await prisma.whatsAppConversation.findMany({
      where: {
        status: "OPEN",
        isBot: false,
        archived: false,
        lastMessageAt: { lt: cutoffDate },
      },
      include: {
        instance: {
          select: {
            id: true,
            status: true,
            apiToken: true,
          },
        },
      },
    })

    console.log(
      `[Cron Inactivity] Found ${inactiveConversations.length} inactive conversations`
    )

    let processed = 0
    let errors = 0

    for (const conversation of inactiveConversations) {
      try {
        // Verificar se instância está conectada
        if (conversation.instance.status !== "CONNECTED") {
          console.log(
            `[Cron Inactivity] Skipping ${conversation.id}: instance not connected`
          )
          continue
        }

        // Reativar conversa
        await handleInactivityReactivation(
          conversation.tenantId,
          conversation.id
        )

        processed++
        console.log(
          `[Cron Inactivity] Reactivated conversation ${conversation.id}`
        )
      } catch (error) {
        errors++
        console.error(
          `[Cron Inactivity] Error processing ${conversation.id}:`,
          error
        )
      }
    }

    console.log(
      `[Cron Inactivity] Completed. Processed: ${processed}, Errors: ${errors}`
    )

    return NextResponse.json({
      success: true,
      found: inactiveConversations.length,
      processed,
      errors,
      cutoffDate: cutoffDate.toISOString(),
    })
  } catch (error) {
    console.error("[Cron Inactivity] Fatal error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
