import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        active: true,
        deactivatedReason: true,
        tenant: {
          select: {
            active: true,
          },
        },
      },
    })

    if (!user) {
      // Não revelamos se o usuário existe ou não
      return NextResponse.json({ status: "unknown" })
    }

    if (!user.tenant.active) {
      return NextResponse.json({
        status: "tenant_inactive",
        message: "Esta empresa está com a conta suspensa. Entre em contato com o suporte.",
      })
    }

    if (!user.active) {
      return NextResponse.json({
        status: "user_inactive",
        message: user.deactivatedReason || "Sua conta foi desativada. Entre em contato com o administrador.",
      })
    }

    return NextResponse.json({ status: "active" })
  } catch (error) {
    console.error("[CHECK-USER-STATUS] Error:", error)
    return NextResponse.json({ status: "unknown" })
  }
}
