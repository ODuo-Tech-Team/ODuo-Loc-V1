import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stockAdjustmentSchema } from "@/lib/validations/stock"

// PUT - Ajuste manual de estoque total
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ equipmentId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId || !session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar permissão (apenas ADMIN e SUPER_ADMIN podem ajustar estoque)
    if (!["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(session.user.role || "")) {
      return NextResponse.json(
        { error: "Sem permissão para ajustar estoque" },
        { status: 403 }
      )
    }

    const { equipmentId } = await params
    const body = await request.json()

    // Validar input
    const validation = stockAdjustmentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { newTotalStock, reason } = validation.data

    // Buscar equipamento atual
    const equipment = await prisma.equipment.findFirst({
      where: {
        id: equipmentId,
        tenantId: session.user.tenantId,
      },
    })

    if (!equipment) {
      return NextResponse.json(
        { error: "Equipamento não encontrado" },
        { status: 404 }
      )
    }

    // Calcular diferença
    const stockDifference = newTotalStock - equipment.totalStock

    // Não permitir reduzir abaixo do que está comprometido
    const minPossibleStock = equipment.reservedStock + equipment.maintenanceStock + equipment.damagedStock
    if (newTotalStock < minPossibleStock) {
      return NextResponse.json(
        {
          error: `Não é possível reduzir o estoque para ${newTotalStock}. Mínimo necessário: ${minPossibleStock} (${equipment.reservedStock} reservados + ${equipment.maintenanceStock} em manutenção + ${equipment.damagedStock} avariados)`,
        },
        { status: 400 }
      )
    }

    // Calcular novo estoque disponível
    const newAvailableStock = newTotalStock - equipment.reservedStock - equipment.maintenanceStock - equipment.damagedStock

    // Executar em transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar movimentação de ajuste
      const movement = await tx.stockMovement.create({
        data: {
          type: "ADJUSTMENT",
          quantity: Math.abs(stockDifference),
          previousStock: equipment.availableStock,
          newStock: newAvailableStock,
          reason: `Ajuste manual: ${reason}. Estoque total ${stockDifference >= 0 ? "aumentado" : "reduzido"} de ${equipment.totalStock} para ${newTotalStock}`,
          equipmentId,
          userId: session.user.id,
          tenantId: session.user.tenantId,
        },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      })

      // Atualizar equipamento
      const updatedEquipment = await tx.equipment.update({
        where: { id: equipmentId },
        data: {
          totalStock: newTotalStock,
          availableStock: newAvailableStock,
        },
      })

      // Registrar no log de atividades
      await tx.activityLog.create({
        data: {
          action: "UPDATE",
          entity: "EQUIPMENT",
          entityId: equipmentId,
          description: `Ajuste de estoque: "${equipment.name}" - De ${equipment.totalStock} para ${newTotalStock} unidades. Motivo: ${reason}`,
          metadata: {
            previousTotalStock: equipment.totalStock,
            newTotalStock,
            previousAvailableStock: equipment.availableStock,
            newAvailableStock,
            difference: stockDifference,
            reason,
          },
          userId: session.user.id,
          tenantId: session.user.tenantId,
        },
      })

      return { movement, equipment: updatedEquipment }
    })

    return NextResponse.json({
      success: true,
      message: `Estoque ajustado de ${equipment.totalStock} para ${newTotalStock} unidades`,
      movement: result.movement,
      equipment: {
        id: result.equipment.id,
        name: result.equipment.name,
        totalStock: result.equipment.totalStock,
        availableStock: result.equipment.availableStock,
        reservedStock: result.equipment.reservedStock,
        maintenanceStock: result.equipment.maintenanceStock,
        damagedStock: result.equipment.damagedStock,
      },
    })
  } catch (error) {
    console.error("Erro ao ajustar estoque:", error)
    return NextResponse.json(
      { error: "Erro ao ajustar estoque" },
      { status: 500 }
    )
  }
}
