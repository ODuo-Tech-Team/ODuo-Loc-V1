import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Por enquanto, retornamos configurações de notificação padrão
    // Em uma implementação completa, isso viria de uma tabela UserPreferences
    const notifications = {
      emailNewBooking: true,
      emailBookingConfirmed: true,
      emailPaymentReceived: true,
      emailMaintenanceDue: true,
      emailDailyReport: false,
      emailWeeklyReport: true,
      pushEnabled: true,
      pushNewBooking: true,
      pushPaymentReceived: true,
    }

    return NextResponse.json({
      user,
      notifications,
    })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json(
      { error: "Erro ao buscar perfil" },
      { status: 500 }
    )
  }
}
