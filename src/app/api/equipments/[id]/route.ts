import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidateEquipments } from "@/lib/cache/revalidate"

// GET - Buscar equipamento por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const includeUnits = searchParams.get("includeUnits") === "true"

    const equipment = await prisma.equipment.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        rentalPeriods: {
          orderBy: { days: "asc" },
        },
        ...(includeUnits && {
          units: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              serialNumber: true,
              internalCode: true,
              status: true,
            },
          },
        }),
      },
    })

    if (!equipment) {
      return NextResponse.json(
        { error: "Equipamento não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(equipment, { status: 200 })
  } catch (error) {
    console.error("Erro ao buscar equipamento:", error)
    return NextResponse.json(
      { error: "Erro ao buscar equipamento" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar equipamento
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId || !session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, category, pricePerDay, pricePerHour, quantity, status, images, rentalPeriods, trackingType } = body

    // Verificar se equipamento existe e pertence ao tenant (incluindo campos de estoque)
    const existingEquipment = await prisma.equipment.findFirst({
      where: { id, tenantId: session.user.tenantId },
      select: {
        id: true,
        tenantId: true,
        totalStock: true,
        availableStock: true,
        reservedStock: true,
        maintenanceStock: true,
        damagedStock: true,
      },
    })

    if (!existingEquipment) {
      return NextResponse.json(
        { error: "Equipamento não encontrado" },
        { status: 404 }
      )
    }

    // Calcular pricePerDay a partir dos períodos se fornecidos
    let calculatedPricePerDay = pricePerDay ? parseFloat(pricePerDay) : undefined
    if (rentalPeriods?.length) {
      const sortedPeriods = [...rentalPeriods].sort((a: { days: number }, b: { days: number }) => a.days - b.days)
      calculatedPricePerDay = sortedPeriods[0].price / sortedPeriods[0].days
    }

    // Verificar se quantity está sendo alterado e sincronizar com estoque
    let stockUpdate: Record<string, number> = {}
    let stockMovementData: {
      type: "PURCHASE" | "ADJUSTMENT"
      quantity: number
      previousStock: number
      newStock: number
      reason: string
    } | null = null

    if (quantity !== undefined) {
      const newQuantity = parseInt(quantity)
      const currentTotalStock = existingEquipment.totalStock
      const diff = newQuantity - currentTotalStock

      if (diff !== 0) {
        // Verificar se é possível reduzir o estoque
        const minRequired = existingEquipment.reservedStock + existingEquipment.maintenanceStock + existingEquipment.damagedStock
        if (newQuantity < minRequired) {
          return NextResponse.json(
            {
              error: `Não é possível reduzir para ${newQuantity} unidades. Mínimo necessário: ${minRequired} (${existingEquipment.reservedStock} reservados, ${existingEquipment.maintenanceStock} em manutenção, ${existingEquipment.damagedStock} danificados)`
            },
            { status: 400 }
          )
        }

        // Calcular novo availableStock
        const newAvailableStock = newQuantity - existingEquipment.reservedStock - existingEquipment.maintenanceStock - existingEquipment.damagedStock

        stockUpdate = {
          totalStock: newQuantity,
          availableStock: newAvailableStock,
        }

        stockMovementData = {
          type: diff > 0 ? "PURCHASE" : "ADJUSTMENT",
          quantity: Math.abs(diff),
          previousStock: currentTotalStock,
          newStock: newQuantity,
          reason: diff > 0
            ? `Aumento de estoque: ${currentTotalStock} → ${newQuantity} (+${diff})`
            : `Redução de estoque: ${currentTotalStock} → ${newQuantity} (${diff})`,
        }
      }
    }

    // Atualizar equipamento e períodos em uma transação
    const equipment = await prisma.$transaction(async (tx) => {
      // Se rentalPeriods foi fornecido, deletar os antigos e criar novos
      if (rentalPeriods !== undefined) {
        await tx.rentalPeriod.deleteMany({
          where: { equipmentId: id },
        })

        if (rentalPeriods.length > 0) {
          await tx.rentalPeriod.createMany({
            data: rentalPeriods.map((period: { days: number; price: number; label?: string }) => ({
              equipmentId: id,
              days: period.days,
              price: period.price,
              label: period.label || null,
            })),
          })
        }
      }

      // Registrar movimentação de estoque se houve alteração
      if (stockMovementData) {
        await tx.stockMovement.create({
          data: {
            equipmentId: id,
            type: stockMovementData.type,
            quantity: stockMovementData.quantity,
            previousStock: stockMovementData.previousStock,
            newStock: stockMovementData.newStock,
            reason: stockMovementData.reason,
            userId: session.user.id,
            tenantId: session.user.tenantId,
          },
        })
      }

      // Atualizar equipamento
      return tx.equipment.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(category && { category }),
          ...(calculatedPricePerDay !== undefined && { pricePerDay: calculatedPricePerDay }),
          ...(pricePerHour !== undefined && { pricePerHour: pricePerHour ? parseFloat(pricePerHour) : null }),
          ...(quantity !== undefined && { quantity: parseInt(quantity) }),
          ...(status && { status }),
          ...(images && { images }),
          ...(trackingType && { trackingType }),
          ...stockUpdate,
        },
        include: {
          rentalPeriods: {
            orderBy: { days: "asc" },
          },
        },
      })
    })

    // Invalidar cache
    revalidateEquipments(session.user.tenantId)

    return NextResponse.json(equipment, { status: 200 })
  } catch (error) {
    console.error("Erro ao atualizar equipamento:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar equipamento" },
      { status: 500 }
    )
  }
}

// DELETE - Deletar equipamento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params

    // Verificar se equipamento existe
    const equipment = await prisma.equipment.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: {
            bookings: true,
            bookingItems: true,
            leadInterests: true,
            units: true,
            stockMovements: true,
          }
        }
      }
    })

    if (!equipment) {
      return NextResponse.json(
        { error: "Equipamento não encontrado" },
        { status: 404 }
      )
    }

    // Verificar dependências críticas que impedem deleção
    const dependencies = []
    if (equipment._count.bookings > 0) {
      dependencies.push(`${equipment._count.bookings} reserva(s)`)
    }

    // Buscar BookingItems para verificar quais têm bookings válidos
    const bookingItems = await prisma.bookingItem.findMany({
      where: { equipmentId: id },
      select: {
        id: true,
        bookingId: true,
        booking: {
          select: { id: true }
        }
      }
    })

    // Separar órfãos (booking foi deletado) de ativos (booking ainda existe)
    const orphanedItems = bookingItems.filter(item => !item.booking)
    const activeItems = bookingItems.filter(item => item.booking)

    // Limpar BookingItems órfãos antes de verificar dependências
    if (orphanedItems.length > 0) {
      await prisma.bookingItem.deleteMany({
        where: {
          id: { in: orphanedItems.map(item => item.id) }
        }
      })
      console.log(`[Equipment DELETE] Limpou ${orphanedItems.length} BookingItems órfãos do equipamento ${id}`)
    }

    if (activeItems.length > 0) {
      dependencies.push(`${activeItems.length} item(ns) em reservas ativas`)
    }

    if (dependencies.length > 0) {
      return NextResponse.json(
        {
          error: "Não é possível deletar este equipamento",
          reason: `Este equipamento possui ${dependencies.join(", ")}. Para preservar o histórico, você pode inativar o equipamento em vez de deletá-lo.`,
          suggestion: "INATIVAR",
          dependencies: {
            bookings: equipment._count.bookings,
            bookingItems: activeItems.length,
            leadInterests: equipment._count.leadInterests,
          }
        },
        { status: 400 }
      )
    }

    // Deletar em cascata os registros relacionados que não são críticos
    // LeadEquipmentInterest: Interesse de leads pode ser deletado junto
    if (equipment._count.leadInterests > 0) {
      await prisma.leadEquipmentInterest.deleteMany({
        where: { equipmentId: id }
      })
      console.log(`[Equipment DELETE] Deletou ${equipment._count.leadInterests} LeadEquipmentInterest do equipamento ${id}`)
    }

    // Se não tem dependências críticas, pode deletar
    await prisma.equipment.delete({
      where: {
        id,
      },
    })

    // Invalidar cache
    revalidateEquipments(session.user.tenantId)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Erro ao deletar equipamento:", error)

    // Verificar se é erro de constraint do banco
    if (error instanceof Error && error.message.includes("Foreign key constraint")) {
      return NextResponse.json(
        {
          error: "Não é possível deletar este equipamento",
          reason: "Este equipamento está sendo usado em outras partes do sistema. Você pode inativá-lo em vez de deletá-lo.",
          suggestion: "INATIVAR"
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erro ao deletar equipamento" },
      { status: 500 }
    )
  }
}
