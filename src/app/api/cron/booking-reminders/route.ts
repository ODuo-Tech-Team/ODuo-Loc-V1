import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail, emailTemplates, EMAIL_FROM } from "@/lib/email"

// Proteger endpoint com secret
const CRON_SECRET = process.env.CRON_SECRET

// POST - Processar lembretes de reserva (chamado pelo Vercel Cron)
export async function POST(request: NextRequest) {
  try {
    // Verificar autorização
    const authHeader = request.headers.get("authorization")
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Datas para lembretes (1 e 2 dias antes da devolução)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const dayAfterTomorrow = new Date(today)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

    const results = {
      returnReminders: { sent: 0, errors: 0 },
      overdueReminders: { sent: 0, errors: 0 },
      paymentReminders: { sent: 0, errors: 0 },
    }

    // Formatar data para pt-BR
    const formatDate = (date: Date) => date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })

    // ========== 1. Lembretes de Devolução (1-2 dias antes) ==========
    const upcomingReturns = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        endDate: {
          gte: today,
          lte: dayAfterTomorrow,
        },
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

    for (const booking of upcomingReturns) {
      if (!booking.customer.email) continue

      try {
        // Calcular dias até devolução
        const endDate = new Date(booking.endDate)
        const daysUntilReturn = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        // Formatar nomes dos equipamentos
        const equipmentNames = booking.items.length > 0
          ? booking.items.map(item => item.equipment.name).join(", ")
          : booking.equipment?.name || "Equipamento"

        const emailContent = emailTemplates.returnReminder({
          customerName: booking.customer.name,
          equipmentName: equipmentNames,
          endDate: formatDate(booking.endDate),
          daysUntilReturn,
          tenantName: booking.tenant.name,
          tenantPhone: booking.tenant.phone || undefined,
          bookingId: booking.id,
        })

        await sendEmail({
          to: booking.customer.email,
          subject: emailContent.subject,
          html: emailContent.html,
          from: EMAIL_FROM.NOTIFICACOES,
        })

        results.returnReminders.sent++
        console.log(`[CRON] Lembrete de devolução enviado para ${booking.customer.email} - Reserva #${booking.bookingNumber}`)
      } catch (error) {
        results.returnReminders.errors++
        console.error(`[CRON] Erro ao enviar lembrete para reserva #${booking.bookingNumber}:`, error)
      }
    }

    // ========== 2. Alertas de Atraso (reservas vencidas) ==========
    const overdueBookings = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        endDate: {
          lt: today,
        },
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

    for (const booking of overdueBookings) {
      if (!booking.customer.email) continue

      try {
        // Calcular dias de atraso
        const endDate = new Date(booking.endDate)
        const daysOverdue = Math.ceil((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))

        // Enviar apenas se até 7 dias de atraso (evitar spam)
        if (daysOverdue > 7) continue

        // Formatar nomes dos equipamentos
        const equipmentNames = booking.items.length > 0
          ? booking.items.map(item => item.equipment.name).join(", ")
          : booking.equipment?.name || "Equipamento"

        const emailContent = emailTemplates.bookingOverdue({
          customerName: booking.customer.name,
          equipmentName: equipmentNames,
          endDate: formatDate(booking.endDate),
          daysOverdue,
          tenantName: booking.tenant.name,
          tenantPhone: booking.tenant.phone || undefined,
          bookingId: booking.id,
        })

        await sendEmail({
          to: booking.customer.email,
          subject: emailContent.subject,
          html: emailContent.html,
          from: EMAIL_FROM.NOTIFICACOES,
        })

        results.overdueReminders.sent++
        console.log(`[CRON] Alerta de atraso enviado para ${booking.customer.email} - Reserva #${booking.bookingNumber}`)
      } catch (error) {
        results.overdueReminders.errors++
        console.error(`[CRON] Erro ao enviar alerta de atraso para reserva #${booking.bookingNumber}:`, error)
      }
    }

    // ========== 3. Lembretes de Pagamento Atrasado ==========
    // Reservas confirmadas que já iniciaram mas ainda não foram pagas
    const unpaidBookings = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        paidAt: null,
        startDate: {
          lt: today, // Reserva já iniciou
        },
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

    for (const booking of unpaidBookings) {
      if (!booking.customer.email) continue

      try {
        // Calcular dias de atraso no pagamento (desde o início da reserva)
        const startDate = new Date(booking.startDate)
        const daysOverdue = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

        // Enviar apenas se até 14 dias de atraso (evitar spam)
        if (daysOverdue > 14) continue

        // Enviar apenas a cada 3 dias (dia 1, 3, 7, 10, 14)
        if (![1, 3, 7, 10, 14].includes(daysOverdue)) continue

        // Formatar nomes dos equipamentos
        const equipmentNames = booking.items.length > 0
          ? booking.items.map(item => item.equipment.name).join(", ")
          : booking.equipment?.name || "Equipamento"

        const emailContent = emailTemplates.paymentOverdue({
          customerName: booking.customer.name,
          equipmentName: equipmentNames,
          bookingId: booking.id,
          amount: booking.totalPrice,
          dueDate: formatDate(booking.startDate),
          daysOverdue,
          tenantName: booking.tenant.name,
          tenantPhone: booking.tenant.phone || undefined,
        })

        await sendEmail({
          to: booking.customer.email,
          subject: emailContent.subject,
          html: emailContent.html,
          from: EMAIL_FROM.FINANCEIRO,
        })

        results.paymentReminders.sent++
        console.log(`[CRON] Lembrete de pagamento enviado para ${booking.customer.email} - Reserva #${booking.bookingNumber}`)
      } catch (error) {
        results.paymentReminders.errors++
        console.error(`[CRON] Erro ao enviar lembrete de pagamento para reserva #${booking.bookingNumber}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Lembretes processados com sucesso",
      results,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error("[CRON] Erro ao processar lembretes:", error)
    return NextResponse.json(
      { error: "Erro ao processar lembretes" },
      { status: 500 }
    )
  }
}

// GET - Para verificação de saúde do endpoint
export async function GET(request: NextRequest) {
  // Verificar autorização
  const authHeader = request.headers.get("authorization")
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  return NextResponse.json({
    status: "ok",
    endpoint: "/api/cron/booking-reminders",
    description: "Envia lembretes de devolução, alertas de atraso e cobrança de pagamentos pendentes",
  })
}
