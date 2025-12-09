import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Skip onboarding
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboardingSkippedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error skipping onboarding:", error)
    return NextResponse.json(
      { error: "Erro ao pular onboarding" },
      { status: 500 }
    )
  }
}
