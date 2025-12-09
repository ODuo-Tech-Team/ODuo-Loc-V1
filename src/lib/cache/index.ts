import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { EquipmentStatus } from "@prisma/client"

// Tags para invalidação de cache
export const CACHE_TAGS = {
  DASHBOARD: "dashboard",
  EQUIPMENTS: "equipments",
  CUSTOMERS: "customers",
  BOOKINGS: "bookings",
  STOCK_ALERTS: "stock-alerts",
} as const

// Tempos de revalidação em segundos
export const CACHE_TIMES = {
  SHORT: 30,      // 30 segundos - dados muito dinâmicos
  MEDIUM: 60,     // 1 minuto - dados moderadamente dinâmicos
  LONG: 300,      // 5 minutos - dados mais estáveis
  VERY_LONG: 900, // 15 minutos - dados quase estáticos
} as const

// ============ DASHBOARD ============

export const getCachedDashboardStats = (tenantId: string) =>
  unstable_cache(
    async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

      const [
        totalEquipments,
        totalCustomers,
        activeBookings,
        monthlyRevenue,
        pendingBookings,
        lowStockCount,
      ] = await Promise.all([
        prisma.equipment.count({ where: { tenantId } }),
        prisma.customer.count({ where: { tenantId } }),
        prisma.booking.count({
          where: {
            tenantId,
            status: "CONFIRMED",
          },
        }),
        prisma.booking.aggregate({
          where: {
            tenantId,
            status: { in: ["CONFIRMED", "COMPLETED"] },
            startDate: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { totalPrice: true },
        }),
        prisma.booking.count({
          where: { tenantId, status: "PENDING" },
        }),
        prisma.equipment.count({
          where: {
            tenantId,
            availableStock: { lte: 2 },
            totalStock: { gt: 0 },
          },
        }),
      ])

      return {
        totalEquipments,
        totalCustomers,
        activeBookings,
        monthlyRevenue: monthlyRevenue._sum?.totalPrice || 0,
        pendingBookings,
        lowStockCount,
      }
    },
    [`dashboard-stats-${tenantId}`],
    {
      tags: [CACHE_TAGS.DASHBOARD, `tenant-${tenantId}`],
      revalidate: CACHE_TIMES.MEDIUM,
    }
  )()

// ============ EQUIPAMENTOS ============

export const getCachedEquipmentsList = (
  tenantId: string,
  options?: { category?: string; status?: EquipmentStatus; limit?: number }
) =>
  unstable_cache(
    async () => {
      return prisma.equipment.findMany({
        where: {
          tenantId,
          ...(options?.category && { category: options.category }),
          ...(options?.status && { status: options.status }),
        },
        select: {
          id: true,
          name: true,
          category: true,
          status: true,
          pricePerDay: true,
          totalStock: true,
          availableStock: true,
          images: true,
        },
        orderBy: { name: "asc" },
        take: options?.limit,
      })
    },
    [`equipments-list-${tenantId}-${options?.category || "all"}-${options?.status || "all"}`],
    {
      tags: [CACHE_TAGS.EQUIPMENTS, `tenant-${tenantId}`],
      revalidate: CACHE_TIMES.MEDIUM,
    }
  )()

export const getCachedEquipmentCategories = (tenantId: string) =>
  unstable_cache(
    async () => {
      const categories = await prisma.equipment.groupBy({
        by: ["category"],
        where: { tenantId },
        _count: { category: true },
      })
      return categories.map((c) => ({
        name: c.category,
        count: c._count.category,
      }))
    },
    [`equipment-categories-${tenantId}`],
    {
      tags: [CACHE_TAGS.EQUIPMENTS, `tenant-${tenantId}`],
      revalidate: CACHE_TIMES.LONG,
    }
  )()

// ============ CLIENTES ============

export const getCachedCustomersList = (tenantId: string, limit?: number) =>
  unstable_cache(
    async () => {
      return prisma.customer.findMany({
        where: { tenantId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          cpfCnpj: true,
          _count: {
            select: { bookings: true },
          },
        },
        orderBy: { name: "asc" },
        take: limit,
      })
    },
    [`customers-list-${tenantId}-${limit || "all"}`],
    {
      tags: [CACHE_TAGS.CUSTOMERS, `tenant-${tenantId}`],
      revalidate: CACHE_TIMES.MEDIUM,
    }
  )()

// ============ ALERTAS DE ESTOQUE ============

export const getCachedStockAlerts = (tenantId: string) =>
  unstable_cache(
    async () => {
      const equipments = await prisma.equipment.findMany({
        where: {
          tenantId,
          OR: [
            { availableStock: 0 },
            { availableStock: { lte: 2, gt: 0 } },
            { damagedStock: { gt: 0 } },
            { maintenanceStock: { gt: 0 } },
          ],
        },
        select: {
          id: true,
          name: true,
          category: true,
          availableStock: true,
          totalStock: true,
          damagedStock: true,
          maintenanceStock: true,
          images: true,
        },
        orderBy: { availableStock: "asc" },
      })

      const alerts = equipments.map((eq) => {
        let type: "OUT_OF_STOCK" | "LOW_STOCK" | "DAMAGED" | "MAINTENANCE"
        let severity: "critical" | "warning" | "info"
        let message: string

        if (eq.availableStock === 0) {
          type = "OUT_OF_STOCK"
          severity = "critical"
          message = `${eq.name} está sem estoque disponível`
        } else if (eq.damagedStock > 0) {
          type = "DAMAGED"
          severity = "warning"
          message = `${eq.damagedStock} unidade(s) avariada(s)`
        } else if (eq.maintenanceStock > 0) {
          type = "MAINTENANCE"
          severity = "info"
          message = `${eq.maintenanceStock} unidade(s) em manutenção`
        } else {
          type = "LOW_STOCK"
          severity = "warning"
          message = `Apenas ${eq.availableStock} unidade(s) disponível(is)`
        }

        return {
          id: `${eq.id}-${type}`,
          type,
          severity,
          message,
          equipment: {
            id: eq.id,
            name: eq.name,
            category: eq.category,
            image: eq.images?.[0] || null,
          },
        }
      })

      const summary = {
        totalAlerts: alerts.length,
        outOfStockCount: alerts.filter((a) => a.type === "OUT_OF_STOCK").length,
        lowStockCount: alerts.filter((a) => a.type === "LOW_STOCK").length,
        damagedCount: alerts.filter((a) => a.type === "DAMAGED").length,
        inMaintenanceCount: alerts.filter((a) => a.type === "MAINTENANCE").length,
      }

      return { alerts, summary }
    },
    [`stock-alerts-${tenantId}`],
    {
      tags: [CACHE_TAGS.STOCK_ALERTS, `tenant-${tenantId}`],
      revalidate: CACHE_TIMES.SHORT,
    }
  )()

// ============ RESERVAS RECENTES ============

export const getCachedRecentBookings = (tenantId: string, limit = 10) =>
  unstable_cache(
    async () => {
      return prisma.booking.findMany({
        where: { tenantId },
        select: {
          id: true,
          bookingNumber: true,
          status: true,
          startDate: true,
          endDate: true,
          totalPrice: true,
          customer: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
    },
    [`recent-bookings-${tenantId}-${limit}`],
    {
      tags: [CACHE_TAGS.BOOKINGS, `tenant-${tenantId}`],
      revalidate: CACHE_TIMES.SHORT,
    }
  )()
