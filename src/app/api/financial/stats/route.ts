import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Estatísticas financeiras baseadas nas reservas
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const tenantId = session.user.tenantId
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Buscar todas as reservas do tenant
    const [
      allBookings,
      confirmedBookings,
      pendingBookings,
      completedBookings,
      cancelledBookings,
      monthlyBookings,
      recentBookings,
      equipmentCosts,
    ] = await Promise.all([
      // Todas as reservas
      prisma.booking.findMany({
        where: { tenantId },
        select: { totalPrice: true, status: true, paidAt: true, createdAt: true },
      }),

      // Receita confirmada (pago)
      prisma.booking.aggregate({
        _sum: { totalPrice: true },
        _count: { id: true },
        where: { tenantId, status: "CONFIRMED", paidAt: { not: null } },
      }),

      // Receita pendente (a receber)
      prisma.booking.aggregate({
        _sum: { totalPrice: true },
        _count: { id: true },
        where: { tenantId, status: { in: ["PENDING", "CONFIRMED"] }, paidAt: null },
      }),

      // Receita completada
      prisma.booking.aggregate({
        _sum: { totalPrice: true },
        where: { tenantId, status: "COMPLETED" },
      }),

      // Reservas canceladas
      prisma.booking.aggregate({
        _sum: { totalPrice: true },
        _count: { id: true },
        where: { tenantId, status: "CANCELLED" },
      }),

      // Reservas do mês atual
      prisma.booking.aggregate({
        _sum: { totalPrice: true },
        _count: { id: true },
        where: {
          tenantId,
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          status: { in: ["CONFIRMED", "COMPLETED"] },
        },
      }),

      // Reservas recentes para fluxo de caixa
      prisma.booking.findMany({
        where: { tenantId },
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { name: true } },
          equipment: { select: { name: true } },
          items: {
            include: {
              equipment: { select: { name: true } },
            },
          },
        },
      }),

      // Custos de equipamentos
      prisma.equipmentCost.aggregate({
        _sum: { amount: true },
        where: { tenantId },
      }),
    ])

    // Calcular totais
    const totalIncome = (confirmedBookings._sum.totalPrice || 0) + (completedBookings._sum.totalPrice || 0)
    const totalPending = pendingBookings._sum.totalPrice || 0
    const totalExpenses = equipmentCosts._sum.amount || 0
    const balance = totalIncome - totalExpenses

    // Formatar transações para o fluxo de caixa
    const transactions = recentBookings.map((booking) => ({
      id: booking.id,
      bookingId: booking.id,
      type: "income" as const,
      category: "Locação",
      description: `${booking.equipment?.name || booking.items[0]?.equipment?.name || "Equipamento"} - ${booking.customer.name}`,
      amount: booking.totalPrice,
      date: booking.createdAt.toISOString(),
      status: booking.paidAt ? "paid" : booking.status === "CANCELLED" ? "cancelled" : "pending",
      dueDate: booking.endDate.toISOString(),
    }))

    // Buscar custos de equipamentos para despesas
    const costs = await prisma.equipmentCost.findMany({
      where: { tenantId },
      take: 20,
      orderBy: { date: "desc" },
      include: {
        equipment: { select: { name: true } },
      },
    })

    const expenseTransactions = costs.map((cost) => ({
      id: cost.id,
      type: "expense" as const,
      category: cost.type,
      description: `${cost.description} - ${cost.equipment.name}`,
      amount: cost.amount,
      date: cost.date.toISOString(),
      status: "paid" as const,
    }))

    // Combinar e ordenar transações
    const allTransactions = [...transactions, ...expenseTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // DRE simplificado
    const dre = {
      receitas: [
        { label: "Receita de Locações", value: totalIncome },
        { label: "Receitas Pendentes", value: totalPending },
      ],
      despesas: await getDespesasByCategory(tenantId),
    }

    // Calcular DRE totais
    const totalReceitas = totalIncome + totalPending
    const totalDespesas = totalExpenses
    const lucroLiquido = totalIncome - totalExpenses
    const margemLucro = totalReceitas > 0 ? ((lucroLiquido / totalReceitas) * 100).toFixed(1) : "0"

    return NextResponse.json({
      transactions: allTransactions,
      dre,
      summary: {
        totalIncome,
        totalExpense: totalExpenses,
        balance,
        pendingIncome: totalPending,
        pendingExpense: 0, // TODO: implementar despesas pendentes
        overdueCount: 0, // TODO: calcular baseado em datas de vencimento
        totalReceitas,
        totalDespesas,
        lucroLiquido,
        margemLucro,
      },
    })
  } catch (error) {
    console.error("Erro ao buscar estatísticas financeiras:", error)
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas" },
      { status: 500 }
    )
  }
}

async function getDespesasByCategory(tenantId: string) {
  const costs = await prisma.equipmentCost.groupBy({
    by: ["type"],
    _sum: { amount: true },
    where: { tenantId },
  })

  const typeLabels: Record<string, string> = {
    PURCHASE: "Compras",
    MAINTENANCE: "Manutenção",
    INSURANCE: "Seguros",
    FUEL: "Combustível",
    REPAIR: "Reparos",
    DEPRECIATION: "Depreciação",
    OTHER: "Outros",
  }

  return costs.map((cost) => ({
    label: typeLabels[cost.type] || cost.type,
    value: cost._sum.amount || 0,
  }))
}
