import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Listar equipamentos com informações de estoque
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const url = new URL(request.url)
    const category = url.searchParams.get("category")
    const status = url.searchParams.get("status")
    const lowStock = url.searchParams.get("lowStock") === "true"
    const search = url.searchParams.get("search")

    const whereClause: any = {
      tenantId: session.user.tenantId,
    }

    if (category) {
      whereClause.category = category
    }

    if (status) {
      whereClause.status = status
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const equipments = await prisma.equipment.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        category: true,
        images: true,
        status: true,
        pricePerDay: true,
        // Campos de estoque
        totalStock: true,
        availableStock: true,
        reservedStock: true,
        maintenanceStock: true,
        damagedStock: true,
        minStockLevel: true,
        unitCost: true,
        // Contagem de movimentações recentes
        _count: {
          select: {
            stockMovements: true,
            bookingItems: true,
          },
        },
      },
      orderBy: [
        { name: "asc" },
      ],
    })

    // Filtrar por estoque baixo se necessário
    let result = equipments
    if (lowStock) {
      result = equipments.filter(eq => eq.availableStock <= eq.minStockLevel)
    }

    // Calcular estatísticas gerais
    const stats = {
      totalEquipments: equipments.length,
      totalStock: equipments.reduce((sum, eq) => sum + eq.totalStock, 0),
      totalAvailable: equipments.reduce((sum, eq) => sum + eq.availableStock, 0),
      totalReserved: equipments.reduce((sum, eq) => sum + eq.reservedStock, 0),
      totalMaintenance: equipments.reduce((sum, eq) => sum + eq.maintenanceStock, 0),
      totalDamaged: equipments.reduce((sum, eq) => sum + eq.damagedStock, 0),
      lowStockCount: equipments.filter(eq => eq.availableStock <= eq.minStockLevel).length,
    }

    return NextResponse.json({
      equipments: result,
      stats,
    })
  } catch (error) {
    console.error("Erro ao buscar estoque:", error)
    return NextResponse.json(
      { error: "Erro ao buscar estoque" },
      { status: 500 }
    )
  }
}
