import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Detalhes do estoque de um equipamento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ equipmentId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { equipmentId } = await params

    const equipment = await prisma.equipment.findFirst({
      where: {
        id: equipmentId,
        tenantId: session.user.tenantId,
      },
      include: {
        // Últimas 10 movimentações
        stockMovements: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            user: {
              select: { id: true, name: true },
            },
            booking: {
              select: { id: true, bookingNumber: true },
            },
          },
        },
        // Reservas ativas com este equipamento
        bookingItems: {
          where: {
            booking: {
              status: { in: ["PENDING", "CONFIRMED"] },
            },
          },
          include: {
            booking: {
              select: {
                id: true,
                bookingNumber: true,
                startDate: true,
                endDate: true,
                status: true,
                customer: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        // Custos associados
        costs: {
          orderBy: { date: "desc" },
          take: 5,
        },
        // Incluir unidades para equipamentos serializados
        units: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    if (!equipment) {
      return NextResponse.json(
        { error: "Equipamento não encontrado" },
        { status: 404 }
      )
    }

    // Para equipamentos SERIALIZED, calcular totais a partir das unidades
    // Nota: Locadoras trabalham com Orçamento → Locação (não reserva)
    let stockData = {
      totalStock: equipment.totalStock,
      availableStock: equipment.availableStock,
      rentedStock: equipment.reservedStock, // Campo do DB ainda é reservedStock, mas semântica é "em locação"
      maintenanceStock: equipment.maintenanceStock,
      damagedStock: equipment.damagedStock,
    }

    if (equipment.trackingType === "SERIALIZED" && equipment.units) {
      const units = equipment.units
      stockData = {
        totalStock: units.length,
        availableStock: units.filter(u => u.status === "AVAILABLE").length,
        rentedStock: units.filter(u => u.status === "RENTED").length, // Em locação
        maintenanceStock: units.filter(u => u.status === "MAINTENANCE").length,
        damagedStock: units.filter(u => u.status === "DAMAGED" || u.status === "RETIRED").length,
      }
    }

    // Montar objeto equipment com os dados de estoque corretos
    const equipmentWithStock = {
      ...equipment,
      ...stockData,
    }

    // Calcular métricas adicionais
    const metrics = {
      utilizationRate: stockData.totalStock > 0
        ? ((stockData.rentedStock / stockData.totalStock) * 100).toFixed(1)
        : 0,
      isLowStock: stockData.availableStock <= equipment.minStockLevel,
      totalValue: equipment.unitCost
        ? stockData.totalStock * equipment.unitCost
        : null,
    }

    return NextResponse.json({
      equipment: equipmentWithStock,
      metrics,
    })
  } catch (error) {
    console.error("Erro ao buscar detalhes do estoque:", error)
    return NextResponse.json(
      { error: "Erro ao buscar detalhes do estoque" },
      { status: 500 }
    )
  }
}
