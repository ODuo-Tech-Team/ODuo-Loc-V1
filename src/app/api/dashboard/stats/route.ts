import { NextRequest, NextResponse } from "next/server"
import { unstable_cache } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CACHE_TAGS, CACHE_TIMES } from "@/lib/cache"

// Função cacheada para buscar estatísticas do dashboard
const getDashboardStats = (tenantId: string) =>
  unstable_cache(
    async () => {
      // Buscar estatísticas em paralelo
      const [
        totalEquipments,
        totalCustomers,
        totalBookings,
        recentBookings,
        equipmentsByCategory,
        bookingsByStatus,
      ] = await Promise.all([
        prisma.equipment.count({ where: { tenantId } }),
        prisma.customer.count({ where: { tenantId } }),
        prisma.booking.count({ where: { tenantId } }),
        prisma.booking.findMany({
          where: { tenantId },
          include: {
            customer: true,
            equipment: true,
            items: {
              include: { equipment: { select: { name: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        prisma.equipment.groupBy({
          by: ["category"],
          where: { tenantId },
          _count: { category: true },
        }),
        prisma.booking.groupBy({
          by: ["status"],
          where: { tenantId },
          _count: { status: true },
        }),
      ])

      const completedBookings = await prisma.booking.aggregate({
        where: { tenantId, status: "COMPLETED" },
        _sum: { totalPrice: true },
      })

      const totalRevenue = completedBookings._sum.totalPrice || 0

      const availableEquipments = await prisma.equipment.count({
        where: { tenantId, status: "AVAILABLE" },
      })

      const activeBookings = bookingsByStatus.find((item) => item.status === "CONFIRMED")?._count.status || 0
      const pendingBookings = bookingsByStatus.find((item) => item.status === "PENDING")?._count.status || 0

      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const thisMonthRevenue = await prisma.booking.aggregate({
        where: {
          tenantId,
          status: "COMPLETED",
          createdAt: { gte: firstDayOfMonth },
        },
        _sum: { totalPrice: true },
      })

      const pendingRevenue = await prisma.booking.aggregate({
        where: {
          tenantId,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        _sum: { totalPrice: true },
      })

      return {
        customers: { total: totalCustomers },
        equipment: { total: totalEquipments, available: availableEquipments },
        bookings: { total: totalBookings, active: activeBookings, pending: pendingBookings },
        revenue: {
          total: totalRevenue,
          thisMonth: thisMonthRevenue._sum.totalPrice || 0,
          pending: pendingRevenue._sum.totalPrice || 0,
        },
        recentBookings: recentBookings.map((booking) => ({
          id: booking.id,
          startDate: booking.startDate.toISOString(),
          endDate: booking.endDate.toISOString(),
          totalPrice: booking.totalPrice,
          status: booking.status,
          customer: { name: booking.customer.name },
          equipment: {
            name: booking.equipment?.name || booking.items[0]?.equipment?.name || "Equipamento",
          },
        })),
      }
    },
    [`dashboard-stats-${tenantId}`],
    {
      tags: [CACHE_TAGS.DASHBOARD, `tenant-${tenantId}`],
      revalidate: CACHE_TIMES.MEDIUM, // 60 segundos
    }
  )()

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const data = await getDashboardStats(session.user.tenantId)
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas" },
      { status: 500 }
    )
  }
}
