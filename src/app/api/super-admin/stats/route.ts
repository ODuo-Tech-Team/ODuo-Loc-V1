import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/super-admin"

// GET - Estatísticas globais do sistema
export async function GET() {
  const authResult = await requireSuperAdmin()
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    // Executar todas as queries em paralelo
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalEquipments,
      totalCustomers,
      totalBookings,
      revenueData,
      recentTenants,
      bookingsByStatus,
      monthlyStats,
    ] = await Promise.all([
      // Total de tenants
      prisma.tenant.count(),

      // Tenants ativos
      prisma.tenant.count({ where: { active: true } }),

      // Total de usuários
      prisma.user.count(),

      // Total de equipamentos
      prisma.equipment.count(),

      // Total de clientes
      prisma.customer.count(),

      // Total de reservas
      prisma.booking.count(),

      // Receita total (soma de todas as reservas confirmadas/completadas)
      prisma.booking.aggregate({
        _sum: { totalPrice: true },
        where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
      }),

      // Últimos 10 tenants criados
      prisma.tenant.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
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
              customers: true,
            },
          },
        },
      }),

      // Reservas por status
      prisma.booking.groupBy({
        by: ["status"],
        _count: { id: true },
      }),

      // Estatísticas dos últimos 12 meses
      getMonthlyStats(),
    ])

    // Formatar reservas por status
    const bookingsStatusMap = bookingsByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.id
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      overview: {
        totalTenants,
        activeTenants,
        inactiveTenants: totalTenants - activeTenants,
        totalUsers,
        totalEquipments,
        totalCustomers,
        totalBookings,
        totalRevenue: revenueData._sum.totalPrice || 0,
      },
      bookingsByStatus: {
        pending: bookingsStatusMap["PENDING"] || 0,
        confirmed: bookingsStatusMap["CONFIRMED"] || 0,
        completed: bookingsStatusMap["COMPLETED"] || 0,
        cancelled: bookingsStatusMap["CANCELLED"] || 0,
      },
      recentTenants,
      monthlyStats,
    })
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas" },
      { status: 500 }
    )
  }
}

// Função para obter estatísticas mensais - OTIMIZADA (2 queries em vez de 24)
async function getMonthlyStats() {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1)

  // Buscar todos os dados em 2 queries paralelas
  const [tenants, bookings] = await Promise.all([
    prisma.tenant.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
    }),
    prisma.booking.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
      select: { createdAt: true, totalPrice: true },
    }),
  ])

  // Agrupar por mês em memória (muito mais rápido que 24 queries)
  const monthsMap = new Map<string, { tenants: number; bookings: number; revenue: number }>()

  // Inicializar os 12 meses
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    monthsMap.set(key, { tenants: 0, bookings: 0, revenue: 0 })
  }

  // Contar tenants por mês
  tenants.forEach((tenant) => {
    const date = new Date(tenant.createdAt)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const month = monthsMap.get(key)
    if (month) month.tenants++
  })

  // Contar bookings e revenue por mês
  bookings.forEach((booking) => {
    const date = new Date(booking.createdAt)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const month = monthsMap.get(key)
    if (month) {
      month.bookings++
      month.revenue += Number(booking.totalPrice) || 0
    }
  })

  // Converter para array ordenado
  const result: { month: string; tenants: number; bookings: number; revenue: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const data = monthsMap.get(key)!
    result.push({
      month: date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      ...data,
    })
  }

  return result
}
