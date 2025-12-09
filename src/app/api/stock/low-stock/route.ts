import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Listar equipamentos com estoque baixo
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Buscar equipamentos com estoque baixo ou zerado
    const equipments = await prisma.equipment.findMany({
      where: {
        tenantId: session.user.tenantId,
        status: { not: "INACTIVE" },
        OR: [
          // Estoque zerado
          { availableStock: 0 },
          // Estoque abaixo do mínimo (usando raw query pois Prisma não suporta comparação entre campos)
        ],
      },
      select: {
        id: true,
        name: true,
        category: true,
        images: true,
        pricePerDay: true,
        totalStock: true,
        availableStock: true,
        reservedStock: true,
        maintenanceStock: true,
        damagedStock: true,
        minStockLevel: true,
        // Incluir última movimentação
        stockMovements: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            type: true,
            quantity: true,
            createdAt: true,
          },
        },
        // Incluir reservas ativas
        _count: {
          select: {
            bookingItems: {
              where: {
                booking: {
                  status: { in: ["PENDING", "CONFIRMED"] },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { availableStock: "asc" },
        { name: "asc" },
      ],
    })

    // Filtrar apenas os que realmente estão com estoque baixo
    const lowStockEquipments = equipments.filter(
      eq => eq.availableStock <= eq.minStockLevel
    )

    // Calcular estatísticas
    const stats = {
      totalLowStock: lowStockEquipments.length,
      outOfStock: lowStockEquipments.filter(eq => eq.availableStock === 0).length,
      criticallyLow: lowStockEquipments.filter(eq => eq.availableStock > 0 && eq.availableStock <= eq.minStockLevel / 2).length,
    }

    // Formatar resposta
    const formattedEquipments = lowStockEquipments.map(eq => ({
      id: eq.id,
      name: eq.name,
      category: eq.category,
      image: eq.images[0] || null,
      pricePerDay: eq.pricePerDay,
      stock: {
        total: eq.totalStock,
        available: eq.availableStock,
        reserved: eq.reservedStock,
        maintenance: eq.maintenanceStock,
        damaged: eq.damagedStock,
        minLevel: eq.minStockLevel,
      },
      status: eq.availableStock === 0
        ? "OUT_OF_STOCK"
        : eq.availableStock <= eq.minStockLevel / 2
          ? "CRITICAL"
          : "LOW",
      lastMovement: eq.stockMovements[0] || null,
      activeBookings: eq._count.bookingItems,
    }))

    return NextResponse.json({
      equipments: formattedEquipments,
      stats,
    })
  } catch (error) {
    console.error("Erro ao buscar equipamentos com estoque baixo:", error)
    return NextResponse.json(
      { error: "Erro ao buscar equipamentos com estoque baixo" },
      { status: 500 }
    )
  }
}
