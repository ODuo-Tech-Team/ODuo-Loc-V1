import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Registrar pagamento de uma reserva
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { paymentMethod } = body

    // Buscar a reserva
    const booking = await prisma.booking.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Reserva não encontrada" },
        { status: 404 }
      )
    }

    // Verificar se já foi paga
    if (booking.paidAt) {
      return NextResponse.json(
        { error: "Esta reserva já foi paga" },
        { status: 400 }
      )
    }

    // Atualizar a reserva com a data de pagamento
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        paidAt: new Date(),
        paymentIntentId: paymentMethod || "MANUAL",
        status: "CONFIRMED", // Atualiza status para confirmado quando pago
      },
    })

    return NextResponse.json({
      message: "Pagamento registrado com sucesso!",
      booking: updatedBooking,
    })
  } catch (error) {
    console.error("Erro ao registrar pagamento:", error)
    return NextResponse.json(
      { error: "Erro ao registrar pagamento" },
      { status: 500 }
    )
  }
}

// GET - Verificar status do pagamento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      select: {
        id: true,
        paidAt: true,
        paymentIntentId: true,
        totalPrice: true,
        status: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Reserva não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      paid: !!booking.paidAt,
      paidAt: booking.paidAt,
      paymentMethod: booking.paymentIntentId,
      totalPrice: booking.totalPrice,
      status: booking.status,
    })
  } catch (error) {
    console.error("Erro ao buscar status do pagamento:", error)
    return NextResponse.json(
      { error: "Erro ao buscar status do pagamento" },
      { status: 500 }
    )
  }
}
