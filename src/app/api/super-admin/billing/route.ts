import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/super-admin"

// GET - Estatísticas de faturamento do sistema
export async function GET(request: NextRequest) {
  const authResult = await requireSuperAdmin()
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "month" // month, quarter, year

    // Calcular intervalo de datas baseado no período
    const now = new Date()
    let startDate: Date

    switch (period) {
      case "quarter":
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        break
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    // Receita total por tenant (reservas confirmadas/completadas)
    const revenueByTenant = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        active: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            equipments: true,
            bookings: true,
          },
        },
        bookings: {
          where: {
            status: { in: ["CONFIRMED", "COMPLETED"] },
            createdAt: { gte: startDate },
          },
          select: {
            totalPrice: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Processar dados de receita por tenant
    const tenantsWithRevenue = revenueByTenant.map((tenant) => {
      const periodRevenue = tenant.bookings.reduce((sum, b) => sum + b.totalPrice, 0)
      const confirmedBookings = tenant.bookings.filter(b => b.status === "CONFIRMED").length
      const completedBookings = tenant.bookings.filter(b => b.status === "COMPLETED").length

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        email: tenant.email,
        active: tenant.active,
        createdAt: tenant.createdAt,
        usersCount: tenant._count.users,
        equipmentsCount: tenant._count.equipments,
        bookingsCount: tenant._count.bookings,
        periodRevenue,
        confirmedBookings,
        completedBookings,
      }
    })

    // Receita total do período
    const totalPeriodRevenue = tenantsWithRevenue.reduce(
      (sum, t) => sum + t.periodRevenue,
      0
    )

    // Receita total histórica
    const allTimeRevenue = await prisma.booking.aggregate({
      _sum: { totalPrice: true },
      where: {
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
    })

    // Reservas por status no período
    const bookingsByStatus = await prisma.booking.groupBy({
      by: ["status"],
      _count: true,
      _sum: { totalPrice: true },
      where: {
        createdAt: { gte: startDate },
      },
    })

    // Estatísticas mensais (últimos 6 meses)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const monthlyBookings = await prisma.booking.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo },
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
      select: {
        totalPrice: true,
        createdAt: true,
      },
    })

    // Agrupar por mês
    const monthlyStats: Record<string, { revenue: number; bookings: number }> = {}
    monthlyBookings.forEach((booking) => {
      const monthKey = `${booking.createdAt.getFullYear()}-${String(
        booking.createdAt.getMonth() + 1
      ).padStart(2, "0")}`

      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { revenue: 0, bookings: 0 }
      }
      monthlyStats[monthKey].revenue += booking.totalPrice
      monthlyStats[monthKey].bookings += 1
    })

    // Converter para array ordenado
    const monthlyData = Object.entries(monthlyStats)
      .map(([month, data]) => ({
        month,
        monthLabel: new Date(month + "-01").toLocaleDateString("pt-BR", {
          month: "short",
          year: "numeric",
        }),
        ...data,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // Novos tenants no período
    const newTenantsCount = await prisma.tenant.count({
      where: {
        createdAt: { gte: startDate },
      },
    })

    // Top 5 tenants por receita
    const topTenants = [...tenantsWithRevenue]
      .sort((a, b) => b.periodRevenue - a.periodRevenue)
      .slice(0, 5)

    return NextResponse.json({
      period,
      startDate,
      summary: {
        periodRevenue: totalPeriodRevenue,
        allTimeRevenue: allTimeRevenue._sum.totalPrice || 0,
        newTenants: newTenantsCount,
        totalTenants: tenantsWithRevenue.length,
        activeTenants: tenantsWithRevenue.filter(t => t.active).length,
      },
      bookingsByStatus: bookingsByStatus.reduce(
        (acc, item) => ({
          ...acc,
          [item.status]: {
            count: item._count,
            revenue: item._sum.totalPrice || 0,
          },
        }),
        {}
      ),
      monthlyData,
      topTenants,
      allTenants: tenantsWithRevenue.sort((a, b) => b.periodRevenue - a.periodRevenue),
    })
  } catch (error) {
    console.error("Erro ao buscar dados de faturamento:", error)
    return NextResponse.json(
      { error: "Erro ao buscar dados de faturamento" },
      { status: 500 }
    )
  }
}
