import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Buscar informações da assinatura do tenant
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: session.user.tenantId },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            slug: true,
            monthlyPrice: true,
            annualPrice: true,
          },
        },
      },
    })

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        plan: null,
        status: null,
        daysRemaining: 0,
        expiresAt: null,
      })
    }

    // Calcular dias restantes
    const now = new Date()
    const expiresAt = subscription.currentPeriodEnd
    const diffMs = expiresAt.getTime() - now.getTime()
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

    // Verificar se está em trial
    const isInTrial = subscription.status === "TRIAL" && subscription.trialEndsAt && subscription.trialEndsAt > now

    // Calcular dias restantes do trial
    let trialDaysRemaining = 0
    if (isInTrial && subscription.trialEndsAt) {
      const trialDiffMs = subscription.trialEndsAt.getTime() - now.getTime()
      trialDaysRemaining = Math.max(0, Math.ceil(trialDiffMs / (1000 * 60 * 60 * 24)))
    }

    return NextResponse.json({
      hasSubscription: true,
      plan: subscription.plan,
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      daysRemaining: isInTrial ? trialDaysRemaining : daysRemaining,
      expiresAt: isInTrial ? subscription.trialEndsAt : expiresAt,
      isInTrial,
      trialEndsAt: subscription.trialEndsAt,
      currentPeriodEnd: subscription.currentPeriodEnd,
      nextBillingDate: subscription.nextBillingDate,
      canceledAt: subscription.canceledAt,
    })
  } catch (error) {
    console.error("Erro ao buscar assinatura:", error)
    return NextResponse.json(
      { error: "Erro ao buscar assinatura" },
      { status: 500 }
    )
  }
}
