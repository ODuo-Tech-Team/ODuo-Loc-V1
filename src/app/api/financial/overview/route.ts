import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Visão geral financeira do tenant
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const tenantId = session.user.tenantId

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

    // Receitas - Reservas completadas
    const revenueResult = await prisma.booking.aggregate({
      where: {
        tenantId,
        status: "COMPLETED",
        ...(startDate || endDate ? { createdAt: dateFilter } : {}),
      },
      _sum: { totalPrice: true },
      _count: true,
    })

    // Receitas pendentes (confirmadas mas não completadas)
    const pendingRevenueResult = await prisma.booking.aggregate({
      where: {
        tenantId,
        status: { in: ["PENDING", "CONFIRMED"] },
        ...(startDate || endDate ? { createdAt: dateFilter } : {}),
      },
      _sum: { totalPrice: true },
      _count: true,
    })

    // Custos totais
    const costsResult = await prisma.equipmentCost.aggregate({
      where: {
        tenantId,
        ...(startDate || endDate ? { date: dateFilter } : {}),
      },
      _sum: { amount: true },
    })

    // Custos por tipo
    const costsByType = await prisma.equipmentCost.groupBy({
      by: ["type"],
      where: {
        tenantId,
        ...(startDate || endDate ? { date: dateFilter } : {}),
      },
      _sum: { amount: true },
    })

    // Receitas por mês (últimos 12 meses)
    const now = new Date()
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

    const monthlyRevenue = await prisma.booking.groupBy({
      by: ["createdAt"],
      where: {
        tenantId,
        status: "COMPLETED",
        createdAt: { gte: twelveMonthsAgo },
      },
      _sum: { totalPrice: true },
    })

    // Custos por mês (últimos 12 meses)
    const monthlyCosts = await prisma.equipmentCost.groupBy({
      by: ["date"],
      where: {
        tenantId,
        date: { gte: twelveMonthsAgo },
      },
      _sum: { amount: true },
    })

    // Calcular totais
    const totalRevenue = revenueResult._sum.totalPrice || 0
    const totalPendingRevenue = pendingRevenueResult._sum.totalPrice || 0
    const totalCosts = costsResult._sum.amount || 0
    const profit = totalRevenue - totalCosts
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

    // Agrupar por mês para gráficos
    const monthlyData: Record<string, { revenue: number; costs: number }> = {}

    // Inicializar últimos 12 meses
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      monthlyData[key] = { revenue: 0, costs: 0 }
    }

    // Preencher receitas
    monthlyRevenue.forEach((item) => {
      const d = new Date(item.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      if (monthlyData[key]) {
        monthlyData[key].revenue += item._sum.totalPrice || 0
      }
    })

    // Preencher custos
    monthlyCosts.forEach((item) => {
      const d = new Date(item.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      if (monthlyData[key]) {
        monthlyData[key].costs += item._sum.amount || 0
      }
    })

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalPendingRevenue,
        totalCosts,
        profit,
        profitMargin: Math.round(profitMargin * 100) / 100,
        completedBookings: revenueResult._count,
        pendingBookings: pendingRevenueResult._count,
      },
      costsByType: costsByType.map((item) => ({
        type: item.type,
        total: item._sum.amount || 0,
      })),
      monthlyData: Object.entries(monthlyData).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        costs: data.costs,
        profit: data.revenue - data.costs,
      })),
    })
  } catch (error) {
    console.error("Erro ao buscar visão financeira:", error)
    return NextResponse.json({ error: "Erro ao buscar dados financeiros" }, { status: 500 })
  }
}
