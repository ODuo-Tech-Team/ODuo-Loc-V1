import { NextRequest, NextResponse } from "next/server"
import { processAllFollowUps } from "@/lib/whatsapp/follow-up-service"

// Secret para validar chamadas do cron (Vercel)
const CRON_SECRET = process.env.CRON_SECRET

/**
 * GET /api/cron/whatsapp-followup
 *
 * Cron job para processar follow-ups automaticos
 * Deve ser configurado no vercel.json para rodar periodicamente (ex: a cada hora)
 *
 * vercel.json exemplo:
 * {
 *   "crons": [{
 *     "path": "/api/cron/whatsapp-followup",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Validar secret do cron (se configurado)
    if (CRON_SECRET) {
      const authHeader = request.headers.get("authorization")
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        console.warn("[Cron] Invalid or missing authorization")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    console.log("[Cron] Starting follow-up processing...")
    const startTime = Date.now()

    const stats = await processAllFollowUps()

    const duration = Date.now() - startTime
    console.log(`[Cron] Completed in ${duration}ms`, stats)

    return NextResponse.json({
      success: true,
      stats,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Cron] Error processing follow-ups:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Tambem aceita POST para testes manuais
export async function POST(request: NextRequest) {
  return GET(request)
}
