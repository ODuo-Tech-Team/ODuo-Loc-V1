import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Ranking de rentabilidade por equipamento
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
    const sortBy = searchParams.get("sortBy") || "profit" // profit, revenue, roi, margin

    // Filtro de data
    const dateFilter: Record<string, unknown> = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate)
    }

    // Buscar todos os equipamentos do tenant
    const equipments = await prisma.equipment.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        category: true,
        pricePerDay: true,
        purchasePrice: true,
        status: true,
        images: true,
      },
    })

    // Calcular métricas para cada equipamento
    const equipmentMetrics = await Promise.all(
      equipments.map(async (equipment) => {
        // Receitas (reservas completadas)
        const revenueResult = await prisma.booking.aggregate({
          where: {
            equipmentId: equipment.id,
            tenantId,
            status: "COMPLETED",
            ...(startDate || endDate ? { createdAt: dateFilter } : {}),
          },
          _sum: { totalPrice: true },
          _count: true,
        })

        // Custos
        const costsResult = await prisma.equipmentCost.aggregate({
          where: {
            equipmentId: equipment.id,
            tenantId,
            ...(startDate || endDate ? { date: dateFilter } : {}),
          },
          _sum: { amount: true },
        })

        const totalRevenue = revenueResult._sum.totalPrice || 0
        const totalCosts = costsResult._sum.amount || 0
        const profit = totalRevenue - totalCosts
        const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0
        const purchasePrice = equipment.purchasePrice || 0
        const roi = purchasePrice > 0 ? ((profit / purchasePrice) * 100) : 0

        return {
          id: equipment.id,
          name: equipment.name,
          category: equipment.category,
          pricePerDay: equipment.pricePerDay,
          purchasePrice: equipment.purchasePrice,
          status: equipment.status,
          image: equipment.images[0] || null,
          metrics: {
            totalRevenue,
            totalCosts,
            profit,
            profitMargin: Math.round(profitMargin * 100) / 100,
            roi: Math.round(roi * 100) / 100,
            bookingsCount: revenueResult._count,
          },
        }
      })
    )

    // Ordenar por métrica escolhida
    const sortedEquipments = equipmentMetrics.sort((a, b) => {
      switch (sortBy) {
        case "revenue":
          return b.metrics.totalRevenue - a.metrics.totalRevenue
        case "roi":
          return b.metrics.roi - a.metrics.roi
        case "margin":
          return b.metrics.profitMargin - a.metrics.profitMargin
        case "bookings":
          return b.metrics.bookingsCount - a.metrics.bookingsCount
        case "profit":
        default:
          return b.metrics.profit - a.metrics.profit
      }
    })

    // Calcular totais gerais
    const totals = equipmentMetrics.reduce(
      (acc, eq) => ({
        totalRevenue: acc.totalRevenue + eq.metrics.totalRevenue,
        totalCosts: acc.totalCosts + eq.metrics.totalCosts,
        totalProfit: acc.totalProfit + eq.metrics.profit,
        totalBookings: acc.totalBookings + eq.metrics.bookingsCount,
      }),
      { totalRevenue: 0, totalCosts: 0, totalProfit: 0, totalBookings: 0 }
    )

    // Identificar top e bottom performers
    const topPerformers = sortedEquipments.slice(0, 5)
    const bottomPerformers = sortedEquipments.slice(-5).reverse()

    return NextResponse.json({
      equipments: sortedEquipments,
      totals: {
        ...totals,
        profitMargin: totals.totalRevenue > 0
          ? Math.round((totals.totalProfit / totals.totalRevenue) * 100 * 100) / 100
          : 0,
      },
      topPerformers,
      bottomPerformers,
    })
  } catch (error) {
    console.error("Erro ao buscar rentabilidade:", error)
    return NextResponse.json({ error: "Erro ao buscar dados de rentabilidade" }, { status: 500 })
  }
}
