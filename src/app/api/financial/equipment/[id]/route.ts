import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Análise financeira de um equipamento específico
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
    const tenantId = session.user.tenantId

    // Verificar se o equipamento pertence ao tenant
    const equipment = await prisma.equipment.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        name: true,
        category: true,
        pricePerDay: true,
        pricePerHour: true,
        purchasePrice: true,
        purchaseDate: true,
        status: true,
        trackingType: true,
      },
    })

    if (!equipment) {
      return NextResponse.json({ error: "Equipamento não encontrado" }, { status: 404 })
    }

    // Buscar parâmetros de filtro
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Filtro de data
    const dateFilter: Record<string, unknown> = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate)
    }

    // Receitas do equipamento (reservas completadas)
    const revenueResult = await prisma.booking.aggregate({
      where: {
        equipmentId: id,
        tenantId,
        status: "COMPLETED",
        ...(startDate || endDate ? { createdAt: dateFilter } : {}),
      },
      _sum: { totalPrice: true },
      _count: true,
    })

    // Todas as reservas do equipamento
    const allBookingsResult = await prisma.booking.aggregate({
      where: {
        equipmentId: id,
        tenantId,
        ...(startDate || endDate ? { createdAt: dateFilter } : {}),
      },
      _count: true,
    })

    // Custos do equipamento
    const costsResult = await prisma.equipmentCost.aggregate({
      where: {
        equipmentId: id,
        tenantId,
        ...(startDate || endDate ? { date: dateFilter } : {}),
      },
      _sum: { amount: true },
    })

    // Custos por tipo
    const costsByType = await prisma.equipmentCost.groupBy({
      by: ["type"],
      where: {
        equipmentId: id,
        tenantId,
        ...(startDate || endDate ? { date: dateFilter } : {}),
      },
      _sum: { amount: true },
    })

    // Últimos custos
    const recentCosts = await prisma.equipmentCost.findMany({
      where: {
        equipmentId: id,
        tenantId,
      },
      orderBy: { date: "desc" },
      take: 10,
    })

    // Últimas reservas
    const recentBookings = await prisma.booking.findMany({
      where: {
        equipmentId: id,
        tenantId,
      },
      include: {
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    // Receitas por mês (últimos 12 meses)
    const now = new Date()
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

    const monthlyRevenue = await prisma.booking.groupBy({
      by: ["createdAt"],
      where: {
        equipmentId: id,
        tenantId,
        status: "COMPLETED",
        createdAt: { gte: twelveMonthsAgo },
      },
      _sum: { totalPrice: true },
    })

    const monthlyCosts = await prisma.equipmentCost.groupBy({
      by: ["date"],
      where: {
        equipmentId: id,
        tenantId,
        date: { gte: twelveMonthsAgo },
      },
      _sum: { amount: true },
    })

    // Calcular totais
    const totalRevenue = revenueResult._sum.totalPrice || 0
    const totalCosts = costsResult._sum.amount || 0
    const profit = totalRevenue - totalCosts
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

    // Calcular ROI
    const purchasePrice = equipment.purchasePrice || 0
    const roi = purchasePrice > 0 ? ((profit / purchasePrice) * 100) : 0

    // Taxa de utilização (dias locados / dias totais)
    const totalDaysRented = recentBookings.reduce((sum, booking) => {
      const start = new Date(booking.startDate)
      const end = new Date(booking.endDate)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      return sum + days
    }, 0)

    // Agrupar por mês
    const monthlyData: Record<string, { revenue: number; costs: number }> = {}

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      monthlyData[key] = { revenue: 0, costs: 0 }
    }

    monthlyRevenue.forEach((item) => {
      const d = new Date(item.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      if (monthlyData[key]) {
        monthlyData[key].revenue += item._sum.totalPrice || 0
      }
    })

    monthlyCosts.forEach((item) => {
      const d = new Date(item.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      if (monthlyData[key]) {
        monthlyData[key].costs += item._sum.amount || 0
      }
    })

    return NextResponse.json({
      equipment,
      summary: {
        totalRevenue,
        totalCosts,
        profit,
        profitMargin: Math.round(profitMargin * 100) / 100,
        roi: Math.round(roi * 100) / 100,
        completedBookings: revenueResult._count,
        totalBookings: allBookingsResult._count,
        totalDaysRented,
      },
      costsByType: costsByType.map((item) => ({
        type: item.type,
        total: item._sum.amount || 0,
      })),
      recentCosts,
      recentBookings: recentBookings.map((booking) => ({
        id: booking.id,
        customerName: booking.customer.name,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalPrice: booking.totalPrice,
        status: booking.status,
      })),
      monthlyData: Object.entries(monthlyData).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        costs: data.costs,
        profit: data.revenue - data.costs,
      })),
    })
  } catch (error) {
    console.error("Erro ao buscar análise do equipamento:", error)
    return NextResponse.json({ error: "Erro ao buscar dados financeiros" }, { status: 500 })
  }
}
