import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get onboarding status
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        onboardingCompleted: true,
        onboardingCompletedAt: true,
        onboardingSkippedAt: true,
        onboardingTourCompleted: true,
        tenantId: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Check if user has completed various steps based on actual data
    const [equipmentCount, customerCount, bookingCount, tenant] = await Promise.all([
      prisma.equipment.count({ where: { tenantId: user.tenantId } }),
      prisma.customer.count({ where: { tenantId: user.tenantId } }),
      prisma.booking.count({ where: { tenantId: user.tenantId } }),
      prisma.tenant.findUnique({
        where: { id: user.tenantId },
        select: { logo: true, primaryColor: true },
      }),
    ])

    const steps = {
      tour: user.onboardingTourCompleted,
      equipment: equipmentCount > 0,
      customer: customerCount > 0,
      booking: bookingCount > 0,
      settings: tenant?.logo !== null || (tenant?.primaryColor !== null && tenant?.primaryColor !== "#000000"),
    }

    return NextResponse.json({
      userName: user.name,
      onboardingCompleted: user.onboardingCompleted,
      onboardingSkippedAt: user.onboardingSkippedAt,
      steps,
    })
  } catch (error) {
    console.error("Error fetching onboarding status:", error)
    return NextResponse.json(
      { error: "Erro ao buscar status do onboarding" },
      { status: 500 }
    )
  }
}

// PATCH - Update a specific step
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { stepId, completed } = await req.json()

    // For the tour step, save to database
    if (stepId === "tour" && completed) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { onboardingTourCompleted: true },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating onboarding step:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar passo do onboarding" },
      { status: 500 }
    )
  }
}

// POST - Complete onboarding
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { completed } = await req.json()

    if (completed) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error completing onboarding:", error)
    return NextResponse.json(
      { error: "Erro ao completar onboarding" },
      { status: 500 }
    )
  }
}
