import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getTenantUsage } from "@/lib/plan-limits"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const usage = await getTenantUsage(session.user.tenantId)

    return NextResponse.json(usage)
  } catch (error) {
    console.error("Erro ao buscar uso do tenant:", error)
    return NextResponse.json(
      { error: "Erro ao buscar informações de uso" },
      { status: 500 }
    )
  }
}
