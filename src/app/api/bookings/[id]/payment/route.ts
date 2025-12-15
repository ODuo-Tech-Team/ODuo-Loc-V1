import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail, emailTemplates, EMAIL_FROM } from "@/lib/email"

// Mapeamento de métodos de pagamento para português
const paymentMethodLabels: Record<string, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  BANK_TRANSFER: "Transferência Bancária",
  CASH: "Dinheiro",
  BOLETO: "Boleto Bancário",
  MANUAL: "Pagamento Manual",
}

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

    // Buscar a reserva com dados do cliente, itens e tenant
    const booking = await prisma.booking.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        customer: {
          select: { name: true, email: true },
        },
        tenant: {
          select: { name: true, phone: true },
        },
        items: {
          include: {
            equipment: {
              select: { name: true },
            },
          },
        },
        equipment: {
          select: { name: true },
        },
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

    const paymentDate = new Date()

    // Atualizar a reserva com a data de pagamento
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        paidAt: paymentDate,
        paymentIntentId: paymentMethod || "MANUAL",
        status: "CONFIRMED", // Atualiza status para confirmado quando pago
      },
    })

    // Enviar e-mail de comprovante de pagamento
    if (booking.customer.email) {
      try {
        // Formatar nomes dos equipamentos
        const equipmentNames = booking.items.length > 0
          ? booking.items.map(item => item.equipment.name).join(", ")
          : booking.equipment?.name || "Equipamento"

        // Formatar data para pt-BR
        const formatDate = (date: Date) => date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })

        const emailContent = emailTemplates.paymentReceipt({
          customerName: booking.customer.name,
          equipmentName: equipmentNames,
          bookingId: booking.id,
          amount: booking.totalPrice,
          paymentDate: formatDate(paymentDate),
          tenantName: booking.tenant.name,
          paymentMethod: paymentMethodLabels[paymentMethod] || paymentMethod || "Pagamento Manual",
        })

        await sendEmail({
          to: booking.customer.email,
          subject: emailContent.subject,
          html: emailContent.html,
          from: EMAIL_FROM.FINANCEIRO,
        })

        console.log(`[PAYMENT] E-mail de comprovante enviado para ${booking.customer.email}`)
      } catch (emailError) {
        console.error("[PAYMENT] Erro ao enviar e-mail de comprovante:", emailError)
        // Não falha a operação principal se o e-mail falhar
      }
    }

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
