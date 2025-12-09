import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// Por enquanto, apenas simula salvar as preferências
// Em uma implementação completa, isso salvaria em uma tabela UserPreferences
export async function PUT(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validar campos obrigatórios
    const validKeys = [
      "emailNewBooking",
      "emailBookingConfirmed",
      "emailPaymentReceived",
      "emailMaintenanceDue",
      "emailDailyReport",
      "emailWeeklyReport",
      "pushEnabled",
      "pushNewBooking",
      "pushPaymentReceived",
    ]

    // Verificar se todos os campos são booleanos
    for (const key of validKeys) {
      if (typeof body[key] !== "boolean") {
        return NextResponse.json(
          { error: `Campo ${key} inválido` },
          { status: 400 }
        )
      }
    }

    // TODO: Em uma implementação completa, salvar em UserPreferences
    // await prisma.userPreferences.upsert({
    //   where: { userId: session.user.id },
    //   update: body,
    //   create: {
    //     userId: session.user.id,
    //     ...body,
    //   },
    // })

    console.log("[NOTIFICATIONS] Preferences saved for user:", session.user.id, body)

    return NextResponse.json({
      message: "Preferências salvas com sucesso",
    })
  } catch (error) {
    console.error("Error saving notification preferences:", error)
    return NextResponse.json(
      { error: "Erro ao salvar preferências" },
      { status: 500 }
    )
  }
}
