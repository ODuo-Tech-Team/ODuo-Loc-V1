import { NextRequest, NextResponse } from "next/server"
import { unstable_cache } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CACHE_TAGS, CACHE_TIMES } from "@/lib/cache"

// Função de busca cacheada
const getStockAlerts = (tenantId: string) =>
  unstable_cache(
    async () => {
      const equipments = await prisma.equipment.findMany({
        where: {
          tenantId,
          status: { not: "INACTIVE" },
        },
        select: {
          id: true,
          name: true,
          category: true,
          images: true,
          totalStock: true,
          availableStock: true,
          reservedStock: true,
          maintenanceStock: true,
          damagedStock: true,
          minStockLevel: true,
        },
      })

      const alerts = {
        lowStock: equipments.filter(eq => eq.availableStock <= eq.minStockLevel && eq.availableStock > 0),
        outOfStock: equipments.filter(eq => eq.availableStock === 0),
        damaged: equipments.filter(eq => eq.damagedStock > 0),
        inMaintenance: equipments.filter(eq => eq.maintenanceStock > 0),
      }

      const summary = {
        totalAlerts: alerts.lowStock.length + alerts.outOfStock.length + alerts.damaged.length + alerts.inMaintenance.length,
        lowStockCount: alerts.lowStock.length,
        outOfStockCount: alerts.outOfStock.length,
        damagedCount: alerts.damaged.length,
        inMaintenanceCount: alerts.inMaintenance.length,
      }

      const formattedAlerts = [
        ...alerts.outOfStock.map(eq => ({
          id: `out-${eq.id}`,
          type: "OUT_OF_STOCK" as const,
          severity: "critical" as const,
          equipment: {
            id: eq.id,
            name: eq.name,
            category: eq.category,
            image: eq.images[0] || null,
          },
          message: `${eq.name} está sem estoque disponível`,
          details: {
            available: eq.availableStock,
            total: eq.totalStock,
            reserved: eq.reservedStock,
          },
        })),
        ...alerts.lowStock.map(eq => ({
          id: `low-${eq.id}`,
          type: "LOW_STOCK" as const,
          severity: "warning" as const,
          equipment: {
            id: eq.id,
            name: eq.name,
            category: eq.category,
            image: eq.images[0] || null,
          },
          message: `${eq.name} com estoque baixo (${eq.availableStock}/${eq.minStockLevel} mínimo)`,
          details: {
            available: eq.availableStock,
            minLevel: eq.minStockLevel,
            total: eq.totalStock,
          },
        })),
        ...alerts.damaged.map(eq => ({
          id: `dmg-${eq.id}`,
          type: "DAMAGED" as const,
          severity: "warning" as const,
          equipment: {
            id: eq.id,
            name: eq.name,
            category: eq.category,
            image: eq.images[0] || null,
          },
          message: `${eq.name} tem ${eq.damagedStock} unidade(s) avariada(s)`,
          details: {
            damaged: eq.damagedStock,
            total: eq.totalStock,
          },
        })),
        ...alerts.inMaintenance.map(eq => ({
          id: `mnt-${eq.id}`,
          type: "MAINTENANCE" as const,
          severity: "info" as const,
          equipment: {
            id: eq.id,
            name: eq.name,
            category: eq.category,
            image: eq.images[0] || null,
          },
          message: `${eq.name} tem ${eq.maintenanceStock} unidade(s) em manutenção`,
          details: {
            maintenance: eq.maintenanceStock,
            total: eq.totalStock,
          },
        })),
      ]

      const severityOrder = { critical: 0, warning: 1, info: 2 }
      formattedAlerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

      return { alerts: formattedAlerts, summary }
    },
    [`stock-alerts-${tenantId}`],
    {
      tags: [CACHE_TAGS.STOCK_ALERTS, `tenant-${tenantId}`],
      revalidate: CACHE_TIMES.SHORT, // 30 segundos
    }
  )()

// GET - Buscar alertas de estoque (com cache)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const data = await getStockAlerts(session.user.tenantId)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro ao buscar alertas de estoque:", error)
    return NextResponse.json(
      { error: "Erro ao buscar alertas de estoque" },
      { status: 500 }
    )
  }
}
