import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Buscar notificações do tenant (baseadas em atividades recentes)
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const tenantId = session.user.tenantId
    const now = new Date()
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Processar recorrências vencidas e criar transações
    const overdueRecurrences = await prisma.recurringTransaction.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
        nextDueDate: {
          lte: now,
        },
      },
    })

    // Criar transações para cada recorrência vencida
    for (const recurrence of overdueRecurrences) {
      // Verificar se já existe transação para esta data (evitar duplicatas)
      const existingTransaction = await prisma.financialTransaction.findFirst({
        where: {
          recurrenceId: recurrence.id,
          dueDate: recurrence.nextDueDate,
        },
      })

      if (existingTransaction) {
        // Já existe, apenas atualizar a próxima data
        const nextDate = new Date(recurrence.nextDueDate)
        nextDate.setDate(nextDate.getDate() + recurrence.intervalDays)
        const shouldComplete = recurrence.endDate && nextDate > recurrence.endDate

        await prisma.recurringTransaction.update({
          where: { id: recurrence.id },
          data: {
            nextDueDate: nextDate,
            status: shouldComplete ? "COMPLETED" : "ACTIVE",
          },
        })
        continue
      }

      // Criar a transação financeira
      await prisma.financialTransaction.create({
        data: {
          tenantId,
          type: recurrence.type,
          description: recurrence.description,
          amount: recurrence.amount,
          date: recurrence.nextDueDate,
          dueDate: recurrence.nextDueDate,
          status: "OVERDUE", // Já está vencida
          categoryId: recurrence.categoryId,
          equipmentId: recurrence.equipmentId,
          isRecurring: true,
          recurrenceId: recurrence.id,
        },
      })

      // Calcular próxima data de vencimento
      const nextDate = new Date(recurrence.nextDueDate)
      nextDate.setDate(nextDate.getDate() + recurrence.intervalDays)

      // Verificar se a recorrência deve ser encerrada
      const shouldComplete = recurrence.endDate && nextDate > recurrence.endDate

      // Atualizar a recorrência
      await prisma.recurringTransaction.update({
        where: { id: recurrence.id },
        data: {
          nextDueDate: nextDate,
          status: shouldComplete ? "COMPLETED" : "ACTIVE",
        },
      })
    }

    // Atualizar status de transações vencidas automaticamente
    await prisma.financialTransaction.updateMany({
      where: {
        tenantId,
        status: "PENDING",
        dueDate: {
          lt: now,
        },
      },
      data: {
        status: "OVERDUE",
      },
    })

    // Datas para queries
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const in3Days = new Date(today)
    in3Days.setDate(in3Days.getDate() + 3)

    // Buscar eventos recentes para criar notificações
    const [
      recentBookings,
      pendingBookings,
      upcomingBookings,
      lowStockEquipments,
      recentPayments,
      overdueTransactions,
      upcomingDueTransactions,
    ] = await Promise.all([
      // Reservas criadas nas últimas 24h
      prisma.booking.findMany({
        where: {
          tenantId,
          createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
        include: {
          customer: { select: { name: true } },
          equipment: { select: { name: true } },
          items: { include: { equipment: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // Reservas pendentes de confirmação
      prisma.booking.count({
        where: { tenantId, status: "PENDING" },
      }),

      // Reservas que começam nas próximas 24h
      prisma.booking.findMany({
        where: {
          tenantId,
          status: "CONFIRMED",
          startDate: {
            gte: now,
            lte: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        include: {
          customer: { select: { name: true } },
          equipment: { select: { name: true } },
          items: { include: { equipment: { select: { name: true } } } },
        },
        take: 5,
      }),

      // Equipamentos em manutenção
      prisma.equipment.count({
        where: { tenantId, status: "MAINTENANCE" },
      }),

      // Reservas com pagamento recente
      prisma.booking.findMany({
        where: {
          tenantId,
          paidAt: { gte: last7Days },
        },
        include: {
          customer: { select: { name: true } },
        },
        orderBy: { paidAt: "desc" },
        take: 5,
      }),

      // Contas vencidas (OVERDUE)
      prisma.financialTransaction.findMany({
        where: {
          tenantId,
          status: "OVERDUE",
        },
        include: {
          category: { select: { name: true } },
        },
        orderBy: { dueDate: "asc" },
        take: 10,
      }),

      // Contas próximas do vencimento (próximos 3 dias)
      prisma.financialTransaction.findMany({
        where: {
          tenantId,
          status: "PENDING",
          dueDate: {
            gte: today,
            lte: in3Days,
          },
        },
        include: {
          category: { select: { name: true } },
        },
        orderBy: { dueDate: "asc" },
        take: 10,
      }),
    ])

    // Criar lista de notificações
    const notifications: Array<{
      id: string
      type: "info" | "warning" | "success"
      title: string
      message: string
      time: string
      link?: string
    }> = []

    // Notificações de novas reservas
    recentBookings.forEach((booking) => {
      const timeAgo = getTimeAgo(booking.createdAt)
      const equipmentName = booking.equipment?.name || booking.items[0]?.equipment?.name || "Equipamento"
      notifications.push({
        id: `booking-${booking.id}`,
        type: "info",
        title: "Nova reserva",
        message: `${booking.customer.name} fez uma reserva de ${equipmentName}`,
        time: timeAgo,
        link: `/reservas/${booking.id}`,
      })
    })

    // Notificação de pendentes
    if (pendingBookings > 0) {
      notifications.push({
        id: "pending-bookings",
        type: "warning",
        title: "Reservas pendentes",
        message: `Você tem ${pendingBookings} reserva(s) aguardando confirmação`,
        time: "Agora",
        link: "/reservas?status=PENDING",
      })
    }

    // Notificações de reservas próximas
    upcomingBookings.forEach((booking) => {
      const equipmentName = booking.equipment?.name || booking.items[0]?.equipment?.name || "Equipamento"
      notifications.push({
        id: `upcoming-${booking.id}`,
        type: "info",
        title: "Reserva amanhã",
        message: `${equipmentName} para ${booking.customer.name} começa em breve`,
        time: "Próximas 24h",
        link: `/reservas/${booking.id}`,
      })
    })

    // Notificação de equipamentos em manutenção
    if (lowStockEquipments > 0) {
      notifications.push({
        id: "maintenance",
        type: "warning",
        title: "Equipamentos em manutenção",
        message: `${lowStockEquipments} equipamento(s) em manutenção`,
        time: "Atenção",
        link: "/equipamentos?status=MAINTENANCE",
      })
    }

    // Notificações de pagamentos recebidos
    recentPayments.forEach((booking) => {
      if (booking.paidAt) {
        const timeAgo = getTimeAgo(booking.paidAt)
        notifications.push({
          id: `payment-${booking.id}`,
          type: "success",
          title: "Pagamento recebido",
          message: `Pagamento de R$ ${booking.totalPrice.toFixed(2)} de ${booking.customer.name}`,
          time: timeAgo,
          link: `/reservas/${booking.id}`,
        })
      }
    })

    // Notificações de contas vencidas
    overdueTransactions.forEach((transaction) => {
      const daysOverdue = transaction.dueDate
        ? Math.floor((now.getTime() - transaction.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0

      notifications.push({
        id: `overdue-${transaction.id}`,
        type: "warning",
        title: transaction.type === "EXPENSE" ? "Conta a pagar vencida" : "Conta a receber vencida",
        message: `${transaction.description} - R$ ${transaction.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${daysOverdue} ${daysOverdue === 1 ? "dia" : "dias"} em atraso)`,
        time: transaction.dueDate ? getTimeAgo(transaction.dueDate) : "Vencida",
        link: "/financeiro",
      })
    })

    // Notificações de contas próximas do vencimento
    upcomingDueTransactions.forEach((transaction) => {
      const daysUntilDue = transaction.dueDate
        ? Math.ceil((transaction.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0

      let timeText = ""
      if (daysUntilDue <= 0) {
        timeText = "Vence hoje"
      } else if (daysUntilDue === 1) {
        timeText = "Vence amanhã"
      } else {
        timeText = `Vence em ${daysUntilDue} dias`
      }

      notifications.push({
        id: `upcoming-due-${transaction.id}`,
        type: "info",
        title: transaction.type === "EXPENSE" ? "Conta a pagar" : "Conta a receber",
        message: `${transaction.description} - R$ ${transaction.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        time: timeText,
        link: "/financeiro",
      })
    })

    // Ordenar por relevância (warnings primeiro, depois por tempo)
    notifications.sort((a, b) => {
      if (a.type === "warning" && b.type !== "warning") return -1
      if (b.type === "warning" && a.type !== "warning") return 1
      return 0
    })

    // Contar warnings (contas vencidas, pendentes, etc) como não lidas
    const warningCount = notifications.filter(n => n.type === "warning").length
    const overdueCount = overdueTransactions.length

    return NextResponse.json({
      notifications: notifications.slice(0, 15),
      unreadCount: Math.max(warningCount, overdueCount),
    })
  } catch (error) {
    console.error("Erro ao buscar notificações:", error)
    return NextResponse.json(
      { error: "Erro ao buscar notificações" },
      { status: 500 }
    )
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return "Agora"
  if (diffMins < 60) return `${diffMins} min`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays === 1) return "Ontem"
  if (diffDays < 7) return `${diffDays} dias`
  return date.toLocaleDateString("pt-BR")
}
