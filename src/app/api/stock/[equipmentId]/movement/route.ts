import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stockMovementSchema, MovementType } from "@/lib/validations/stock"

// POST - Registrar movimentação de estoque
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ equipmentId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId || !session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { equipmentId } = await params
    const body = await request.json()

    // Validar input
    const validation = stockMovementSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { type, quantity, reason, bookingId } = validation.data

    // Buscar equipamento
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

    // Calcular novo estoque baseado no tipo de movimentação
    let newAvailableStock = equipment.availableStock
    let newReservedStock = equipment.reservedStock
    let newMaintenanceStock = equipment.maintenanceStock
    let newDamagedStock = equipment.damagedStock
    let newTotalStock = equipment.totalStock

    switch (type as MovementType) {
      case "PURCHASE":
        // Compra: aumenta total e disponível
        newTotalStock += quantity
        newAvailableStock += quantity
        break

      case "RENTAL_OUT":
        // Saída para locação: move de disponível para reservado
        if (equipment.availableStock < quantity) {
          return NextResponse.json(
            { error: `Estoque insuficiente. Disponível: ${equipment.availableStock}` },
            { status: 400 }
          )
        }
        newAvailableStock -= quantity
        newReservedStock += quantity
        break

      case "RENTAL_RETURN":
        // Retorno de locação: move de reservado para disponível
        if (equipment.reservedStock < quantity) {
          return NextResponse.json(
            { error: `Quantidade inválida. Reservado: ${equipment.reservedStock}` },
            { status: 400 }
          )
        }
        newReservedStock -= quantity
        newAvailableStock += quantity
        break

      case "ADJUSTMENT":
        // Ajuste manual: afeta apenas disponível (pode ser positivo ou negativo através do reason)
        newAvailableStock += quantity
        newTotalStock += quantity
        break

      case "DAMAGE":
        // Avaria: move de disponível ou reservado para danificado
        if (equipment.availableStock >= quantity) {
          newAvailableStock -= quantity
        } else if (equipment.reservedStock >= quantity) {
          newReservedStock -= quantity
        } else {
          return NextResponse.json(
            { error: "Estoque insuficiente para registrar avaria" },
            { status: 400 }
          )
        }
        newDamagedStock += quantity
        break

      case "LOSS":
        // Perda: remove do total e disponível
        if (equipment.availableStock < quantity) {
          return NextResponse.json(
            { error: `Estoque insuficiente. Disponível: ${equipment.availableStock}` },
            { status: 400 }
          )
        }
        newAvailableStock -= quantity
        newTotalStock -= quantity
        break

      case "MAINTENANCE_OUT":
        // Enviado para manutenção: move de disponível para manutenção
        if (equipment.availableStock < quantity) {
          return NextResponse.json(
            { error: `Estoque insuficiente. Disponível: ${equipment.availableStock}` },
            { status: 400 }
          )
        }
        newAvailableStock -= quantity
        newMaintenanceStock += quantity
        break

      case "MAINTENANCE_IN":
        // Retorno de manutenção: move de manutenção para disponível
        if (equipment.maintenanceStock < quantity) {
          return NextResponse.json(
            { error: `Quantidade inválida. Em manutenção: ${equipment.maintenanceStock}` },
            { status: 400 }
          )
        }
        newMaintenanceStock -= quantity
        newAvailableStock += quantity
        break
    }

    // Executar em transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar movimentação
      const movement = await tx.stockMovement.create({
        data: {
          type: type as any,
          quantity,
          previousStock: equipment.availableStock,
          newStock: newAvailableStock,
          reason,
          equipmentId,
          bookingId: bookingId || null,
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
          reservedStock: newReservedStock,
          maintenanceStock: newMaintenanceStock,
          damagedStock: newDamagedStock,
        },
      })

      // Registrar no log de atividades
      await tx.activityLog.create({
        data: {
          action: "CREATE",
          entity: "STOCK_MOVEMENT",
          entityId: movement.id,
          description: `Movimentação de estoque: ${type} - ${quantity} unidade(s) de "${equipment.name}"`,
          metadata: {
            movementType: type,
            quantity,
            previousStock: equipment.availableStock,
            newStock: newAvailableStock,
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
      movement: result.movement,
      equipment: {
        id: result.equipment.id,
        totalStock: result.equipment.totalStock,
        availableStock: result.equipment.availableStock,
        reservedStock: result.equipment.reservedStock,
        maintenanceStock: result.equipment.maintenanceStock,
        damagedStock: result.equipment.damagedStock,
      },
    })
  } catch (error) {
    console.error("Erro ao registrar movimentação:", error)
    return NextResponse.json(
      { error: "Erro ao registrar movimentação" },
      { status: 500 }
    )
  }
}
