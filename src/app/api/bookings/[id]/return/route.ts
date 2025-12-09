import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { returnItemSchema } from "@/lib/validations/stock"
import { z } from "zod"

// Schema para devolução completa
const returnBookingSchema = z.object({
  items: z.array(returnItemSchema),
  notes: z.string().optional(),
})

// POST - Processar devolução de reserva com avarias
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId || !session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id: bookingId } = await params
    const body = await request.json()

    // Validar input
    const validation = returnBookingSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { items, notes } = validation.data

    // Buscar reserva com itens
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        tenantId: session.user.tenantId,
      },
      include: {
        items: {
          include: {
            equipment: true,
          },
        },
        equipment: true,
        customer: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Reserva não encontrada" },
        { status: 404 }
      )
    }

    // Verificar se a reserva pode ser devolvida
    if (booking.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Esta reserva já foi concluída" },
        { status: 400 }
      )
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Esta reserva foi cancelada" },
        { status: 400 }
      )
    }

    // Processar devolução em transação
    const result = await prisma.$transaction(async (tx) => {
      let totalDamaged = 0
      let totalReturned = 0
      const movements: any[] = []

      for (const returnItem of items) {
        // Buscar o BookingItem
        const bookingItem = booking.items.find(
          (item) => item.id === returnItem.bookingItemId
        )

        if (!bookingItem) {
          throw new Error(`Item ${returnItem.bookingItemId} não encontrado na reserva`)
        }

        const equipment = bookingItem.equipment

        // Validar quantidades
        const totalReturn = returnItem.returnedQty + returnItem.damagedQty
        const pendingQty = bookingItem.quantity - bookingItem.returnedQty - bookingItem.damagedQty

        if (totalReturn > pendingQty) {
          throw new Error(
            `Quantidade de devolução (${totalReturn}) excede o pendente (${pendingQty}) para "${equipment.name}"`
          )
        }

        // Atualizar BookingItem
        await tx.bookingItem.update({
          where: { id: bookingItem.id },
          data: {
            returnedQty: { increment: returnItem.returnedQty },
            damagedQty: { increment: returnItem.damagedQty },
            notes: returnItem.damageNotes
              ? `${bookingItem.notes || ""}\nAvaria: ${returnItem.damageNotes}`.trim()
              : bookingItem.notes,
          },
        })

        // Atualizar estoque do equipamento
        if (returnItem.returnedQty > 0) {
          await tx.equipment.update({
            where: { id: equipment.id },
            data: {
              reservedStock: { decrement: returnItem.returnedQty },
              availableStock: { increment: returnItem.returnedQty },
            },
          })

          // Registrar movimentação de retorno
          const returnMovement = await tx.stockMovement.create({
            data: {
              type: "RENTAL_RETURN",
              quantity: returnItem.returnedQty,
              previousStock: equipment.availableStock,
              newStock: equipment.availableStock + returnItem.returnedQty,
              reason: `Devolução - Reserva #${booking.bookingNumber}`,
              equipmentId: equipment.id,
              bookingId,
              userId: session.user.id,
              tenantId: session.user.tenantId,
            },
          })
          movements.push(returnMovement)
          totalReturned += returnItem.returnedQty
        }

        // Se houver avarias
        if (returnItem.damagedQty > 0) {
          await tx.equipment.update({
            where: { id: equipment.id },
            data: {
              reservedStock: { decrement: returnItem.damagedQty },
              damagedStock: { increment: returnItem.damagedQty },
            },
          })

          // Registrar movimentação de avaria
          const damageMovement = await tx.stockMovement.create({
            data: {
              type: "DAMAGE",
              quantity: returnItem.damagedQty,
              previousStock: equipment.damagedStock,
              newStock: equipment.damagedStock + returnItem.damagedQty,
              reason: returnItem.damageNotes || `Avaria na devolução - Reserva #${booking.bookingNumber}`,
              equipmentId: equipment.id,
              bookingId,
              userId: session.user.id,
              tenantId: session.user.tenantId,
            },
          })
          movements.push(damageMovement)
          totalDamaged += returnItem.damagedQty

          // Se tiver custo de reparo, registrar como custo do equipamento
          if (returnItem.repairCost && returnItem.repairCost > 0) {
            await tx.equipmentCost.create({
              data: {
                type: "REPAIR",
                description: `Reparo de avaria - Reserva #${booking.bookingNumber}`,
                amount: returnItem.repairCost,
                date: new Date(),
                equipmentId: equipment.id,
                tenantId: session.user.tenantId,
              },
            })
          }
        }
      }

      // Verificar se todos os itens foram devolvidos
      const updatedItems = await tx.bookingItem.findMany({
        where: { bookingId },
      })

      const allReturned = updatedItems.every(
        (item) => item.returnedQty + item.damagedQty >= item.quantity
      )

      // Se todos devolvidos, marcar reserva como concluída
      if (allReturned) {
        await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: "COMPLETED",
            notes: notes
              ? `${booking.notes || ""}\n\nNotas da devolução: ${notes}`.trim()
              : booking.notes,
          },
        })
      }

      // Registrar atividade
      await tx.activityLog.create({
        data: {
          action: "UPDATE",
          entity: "BOOKING",
          entityId: bookingId,
          description: `Devolução registrada - Reserva #${booking.bookingNumber}: ${totalReturned} item(ns) OK, ${totalDamaged} com avaria`,
          metadata: {
            totalReturned,
            totalDamaged,
            items: items,
            completed: allReturned,
          },
          userId: session.user.id,
          tenantId: session.user.tenantId,
        },
      })

      return {
        totalReturned,
        totalDamaged,
        allReturned,
        movements,
      }
    })

    // Buscar reserva atualizada
    const updatedBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        items: {
          include: {
            equipment: {
              select: {
                id: true,
                name: true,
                availableStock: true,
                damagedStock: true,
              },
            },
          },
        },
        customer: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: result.allReturned
        ? "Devolução completa registrada. Reserva concluída."
        : "Devolução parcial registrada.",
      summary: {
        totalReturned: result.totalReturned,
        totalDamaged: result.totalDamaged,
        completed: result.allReturned,
      },
      booking: updatedBooking,
    })
  } catch (error) {
    console.error("Erro ao processar devolução:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao processar devolução" },
      { status: 500 }
    )
  }
}

// GET - Obter status de devolução de uma reserva
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id: bookingId } = await params

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        tenantId: session.user.tenantId,
      },
      include: {
        items: {
          include: {
            equipment: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        },
        customer: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Reserva não encontrada" },
        { status: 404 }
      )
    }

    // Calcular status de cada item
    const itemsStatus = booking.items.map((item) => ({
      id: item.id,
      equipment: item.equipment,
      quantity: item.quantity,
      returnedQty: item.returnedQty,
      damagedQty: item.damagedQty,
      pendingQty: item.quantity - item.returnedQty - item.damagedQty,
      isComplete: item.returnedQty + item.damagedQty >= item.quantity,
    }))

    const summary = {
      totalItems: itemsStatus.length,
      totalQuantity: itemsStatus.reduce((sum, item) => sum + item.quantity, 0),
      totalReturned: itemsStatus.reduce((sum, item) => sum + item.returnedQty, 0),
      totalDamaged: itemsStatus.reduce((sum, item) => sum + item.damagedQty, 0),
      totalPending: itemsStatus.reduce((sum, item) => sum + item.pendingQty, 0),
      allComplete: itemsStatus.every((item) => item.isComplete),
    }

    return NextResponse.json({
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        customer: booking.customer,
        startDate: booking.startDate,
        endDate: booking.endDate,
      },
      items: itemsStatus,
      summary,
    })
  } catch (error) {
    console.error("Erro ao buscar status de devolução:", error)
    return NextResponse.json(
      { error: "Erro ao buscar status de devolução" },
      { status: 500 }
    )
  }
}
