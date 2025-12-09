import { prisma } from "@/lib/prisma"

export interface LimitCheckResult {
  allowed: boolean
  message?: string
  current: number
  max: number
  percentage: number
  isUnlimited: boolean
}

export interface TenantUsage {
  users: {
    current: number
    max: number
    percentage: number
    isUnlimited: boolean
  }
  equipments: {
    current: number
    max: number
    percentage: number
    isUnlimited: boolean
  }
  bookingsThisMonth: {
    current: number
    max: number
    percentage: number
    isUnlimited: boolean
  }
  planName: string | null
  isOverAnyLimit: boolean
  isNearAnyLimit: boolean
}

/**
 * Verifica se o tenant pode adicionar mais usuários
 */
export async function checkUserLimit(tenantId: string): Promise<LimitCheckResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      subscription: {
        include: { plan: true }
      }
    }
  })

  const plan = tenant?.subscription?.plan
  if (!plan) {
    return {
      allowed: false,
      message: "Nenhum plano ativo encontrado",
      current: 0,
      max: 0,
      percentage: 100,
      isUnlimited: false
    }
  }

  // -1 significa ilimitado
  if (plan.maxUsers === -1) {
    const currentCount = await prisma.user.count({
      where: { tenantId }
    })
    return {
      allowed: true,
      current: currentCount,
      max: -1,
      percentage: 0,
      isUnlimited: true
    }
  }

  const currentCount = await prisma.user.count({
    where: { tenantId }
  })

  const percentage = Math.round((currentCount / plan.maxUsers) * 100)

  if (currentCount >= plan.maxUsers) {
    return {
      allowed: false,
      message: `Limite de ${plan.maxUsers} usuários atingido. Faça upgrade para adicionar mais.`,
      current: currentCount,
      max: plan.maxUsers,
      percentage,
      isUnlimited: false
    }
  }

  return {
    allowed: true,
    current: currentCount,
    max: plan.maxUsers,
    percentage,
    isUnlimited: false
  }
}

/**
 * Verifica se o tenant pode adicionar mais equipamentos
 */
export async function checkEquipmentLimit(tenantId: string): Promise<LimitCheckResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      subscription: {
        include: { plan: true }
      }
    }
  })

  const plan = tenant?.subscription?.plan
  if (!plan) {
    return {
      allowed: false,
      message: "Nenhum plano ativo encontrado",
      current: 0,
      max: 0,
      percentage: 100,
      isUnlimited: false
    }
  }

  // -1 significa ilimitado
  if (plan.maxEquipments === -1) {
    const currentCount = await prisma.equipment.count({
      where: { tenantId }
    })
    return {
      allowed: true,
      current: currentCount,
      max: -1,
      percentage: 0,
      isUnlimited: true
    }
  }

  const currentCount = await prisma.equipment.count({
    where: { tenantId }
  })

  const percentage = Math.round((currentCount / plan.maxEquipments) * 100)

  if (currentCount >= plan.maxEquipments) {
    return {
      allowed: false,
      message: `Limite de ${plan.maxEquipments} equipamentos atingido. Faça upgrade para adicionar mais.`,
      current: currentCount,
      max: plan.maxEquipments,
      percentage,
      isUnlimited: false
    }
  }

  return {
    allowed: true,
    current: currentCount,
    max: plan.maxEquipments,
    percentage,
    isUnlimited: false
  }
}

/**
 * Verifica se o tenant pode criar mais reservas neste mês
 */
export async function checkBookingLimit(tenantId: string): Promise<LimitCheckResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      subscription: {
        include: { plan: true }
      }
    }
  })

  const plan = tenant?.subscription?.plan
  if (!plan) {
    return {
      allowed: false,
      message: "Nenhum plano ativo encontrado",
      current: 0,
      max: 0,
      percentage: 100,
      isUnlimited: false
    }
  }

  // -1 significa ilimitado
  if (plan.maxBookingsPerMonth === -1) {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const currentCount = await prisma.booking.count({
      where: {
        tenantId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })
    return {
      allowed: true,
      current: currentCount,
      max: -1,
      percentage: 0,
      isUnlimited: true
    }
  }

  // Contar reservas do mês atual
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const currentCount = await prisma.booking.count({
    where: {
      tenantId,
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  })

  const percentage = Math.round((currentCount / plan.maxBookingsPerMonth) * 100)

  if (currentCount >= plan.maxBookingsPerMonth) {
    return {
      allowed: false,
      message: `Limite de ${plan.maxBookingsPerMonth} reservas/mês atingido. Faça upgrade para criar mais.`,
      current: currentCount,
      max: plan.maxBookingsPerMonth,
      percentage,
      isUnlimited: false
    }
  }

  return {
    allowed: true,
    current: currentCount,
    max: plan.maxBookingsPerMonth,
    percentage,
    isUnlimited: false
  }
}

/**
 * Retorna o uso completo do tenant
 */
export async function getTenantUsage(tenantId: string): Promise<TenantUsage> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      subscription: {
        include: { plan: true }
      }
    }
  })

  const plan = tenant?.subscription?.plan

  // Contagens
  const [userCount, equipmentCount, bookingCount] = await Promise.all([
    prisma.user.count({ where: { tenantId } }),
    prisma.equipment.count({ where: { tenantId } }),
    prisma.booking.count({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59)
        }
      }
    })
  ])

  const maxUsers = plan?.maxUsers ?? 0
  const maxEquipments = plan?.maxEquipments ?? 0
  const maxBookings = plan?.maxBookingsPerMonth ?? 0

  const calcPercentage = (current: number, max: number) => {
    if (max === -1) return 0 // ilimitado
    if (max === 0) return 100
    return Math.round((current / max) * 100)
  }

  const users = {
    current: userCount,
    max: maxUsers,
    percentage: calcPercentage(userCount, maxUsers),
    isUnlimited: maxUsers === -1
  }

  const equipments = {
    current: equipmentCount,
    max: maxEquipments,
    percentage: calcPercentage(equipmentCount, maxEquipments),
    isUnlimited: maxEquipments === -1
  }

  const bookingsThisMonth = {
    current: bookingCount,
    max: maxBookings,
    percentage: calcPercentage(bookingCount, maxBookings),
    isUnlimited: maxBookings === -1
  }

  const isOverAnyLimit =
    (!users.isUnlimited && users.percentage >= 100) ||
    (!equipments.isUnlimited && equipments.percentage >= 100) ||
    (!bookingsThisMonth.isUnlimited && bookingsThisMonth.percentage >= 100)

  const isNearAnyLimit =
    (!users.isUnlimited && users.percentage >= 80) ||
    (!equipments.isUnlimited && equipments.percentage >= 80) ||
    (!bookingsThisMonth.isUnlimited && bookingsThisMonth.percentage >= 80)

  return {
    users,
    equipments,
    bookingsThisMonth,
    planName: plan?.name ?? null,
    isOverAnyLimit,
    isNearAnyLimit
  }
}
