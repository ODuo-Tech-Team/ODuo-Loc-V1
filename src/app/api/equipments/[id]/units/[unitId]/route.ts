import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateUnitSchema = z.object({
  serialNumber: z.string().min(1).optional(),
  internalCode: z.string().optional().nullable(),
  status: z.enum(["AVAILABLE", "RENTED", "MAINTENANCE", "DAMAGED", "RETIRED"]).optional(),
  acquisitionDate: z.string().optional().nullable(),
  acquisitionCost: z.number().optional().nullable(),
  warrantyExpiry: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

// GET - Detalhes de uma unidade
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id: equipmentId, unitId } = await params

    const unit = await prisma.equipmentUnit.findFirst({
      where: {
        id: unitId,
        equipmentId,
        tenantId: session.user.tenantId,
      },
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            category: true,
            images: true,
          },
        },
        maintenances: {
          orderBy: { scheduledDate: "desc" },
          take: 10,
        },
        documents: {
          orderBy: { uploadedAt: "desc" },
        },
        bookingUnits: {
          include: {
            bookingItem: {
              include: {
                booking: {
                  select: {
                    id: true,
                    bookingNumber: true,
                    status: true,
                    startDate: true,
                    endDate: true,
                    customer: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { deliveredAt: "desc" },
          take: 10,
        },
      },
    })

    if (!unit) {
      return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 })
    }

    return NextResponse.json(unit)
  } catch (error) {
    console.error("Erro ao buscar unidade:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PUT - Atualizar unidade
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id: equipmentId, unitId } = await params
    const body = await request.json()

    // Validar dados
    const validation = updateUnitSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const data = validation.data

    // Buscar unidade atual
    const currentUnit = await prisma.equipmentUnit.findFirst({
      where: {
        id: unitId,
        equipmentId,
        tenantId: session.user.tenantId,
      },
    })

    if (!currentUnit) {
      return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 })
    }

    // Se mudou o serial number, verificar duplicidade
    if (data.serialNumber && data.serialNumber !== currentUnit.serialNumber) {
      const existingUnit = await prisma.equipmentUnit.findUnique({
        where: {
          tenantId_serialNumber: {
            tenantId: session.user.tenantId,
            serialNumber: data.serialNumber,
          },
        },
      })

      if (existingUnit && existingUnit.id !== unitId) {
        return NextResponse.json(
          { error: "Já existe uma unidade com esse número de série" },
          { status: 400 }
        )
      }
    }

    // Preparar dados de atualização
    const updateData: any = {}
    if (data.serialNumber !== undefined) updateData.serialNumber = data.serialNumber
    if (data.internalCode !== undefined) updateData.internalCode = data.internalCode
    if (data.status !== undefined) updateData.status = data.status
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.acquisitionDate !== undefined) {
      updateData.acquisitionDate = data.acquisitionDate ? new Date(data.acquisitionDate) : null
    }
    if (data.acquisitionCost !== undefined) updateData.acquisitionCost = data.acquisitionCost
    if (data.warrantyExpiry !== undefined) {
      updateData.warrantyExpiry = data.warrantyExpiry ? new Date(data.warrantyExpiry) : null
    }

    // Atualizar unidade
    const unit = await prisma.equipmentUnit.update({
      where: { id: unitId },
      data: updateData,
    })

    // Se mudou o status, atualizar contagem de estoque do equipamento
    if (data.status && data.status !== currentUnit.status) {
      const stockUpdates: any = {}

      // Decrementar do status anterior
      switch (currentUnit.status) {
        case "AVAILABLE":
          stockUpdates.availableStock = { decrement: 1 }
          break
        case "RENTED":
          stockUpdates.reservedStock = { decrement: 1 }
          break
        case "MAINTENANCE":
          stockUpdates.maintenanceStock = { decrement: 1 }
          break
        case "DAMAGED":
          stockUpdates.damagedStock = { decrement: 1 }
          break
        case "RETIRED":
          stockUpdates.totalStock = { decrement: 1 }
          break
      }

      // Incrementar no novo status
      switch (data.status) {
        case "AVAILABLE":
          stockUpdates.availableStock = { ...stockUpdates.availableStock, increment: 1 }
          break
        case "RENTED":
          stockUpdates.reservedStock = { ...stockUpdates.reservedStock, increment: 1 }
          break
        case "MAINTENANCE":
          stockUpdates.maintenanceStock = { ...stockUpdates.maintenanceStock, increment: 1 }
          break
        case "DAMAGED":
          stockUpdates.damagedStock = { ...stockUpdates.damagedStock, increment: 1 }
          break
        case "RETIRED":
          stockUpdates.totalStock = { ...stockUpdates.totalStock, increment: 1 }
          break
      }

      // Simplificar incrementos
      const finalUpdates: any = {}
      for (const [key, value] of Object.entries(stockUpdates)) {
        if (typeof value === "object" && value !== null) {
          const inc = (value as any).increment || 0
          const dec = (value as any).decrement || 0
          const net = inc - dec
          if (net !== 0) {
            finalUpdates[key] = net > 0 ? { increment: net } : { decrement: -net }
          }
        }
      }

      if (Object.keys(finalUpdates).length > 0) {
        await prisma.equipment.update({
          where: { id: equipmentId },
          data: finalUpdates,
        })
      }
    }

    return NextResponse.json(unit)
  } catch (error) {
    console.error("Erro ao atualizar unidade:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE - Remover unidade
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id: equipmentId, unitId } = await params

    // Buscar unidade
    const unit = await prisma.equipmentUnit.findFirst({
      where: {
        id: unitId,
        equipmentId,
        tenantId: session.user.tenantId,
      },
      include: {
        bookingUnits: {
          where: {
            returnedAt: null,
          },
        },
      },
    })

    if (!unit) {
      return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 })
    }

    // Verificar se está em uso (alugada e não devolvida)
    if (unit.bookingUnits.length > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir uma unidade que está alugada" },
        { status: 400 }
      )
    }

    // Deletar unidade
    await prisma.equipmentUnit.delete({
      where: { id: unitId },
    })

    // Atualizar contagem de estoque do equipamento
    const stockUpdates: any = { totalStock: { decrement: 1 } }
    switch (unit.status) {
      case "AVAILABLE":
        stockUpdates.availableStock = { decrement: 1 }
        break
      case "RENTED":
        stockUpdates.reservedStock = { decrement: 1 }
        break
      case "MAINTENANCE":
        stockUpdates.maintenanceStock = { decrement: 1 }
        break
      case "DAMAGED":
        stockUpdates.damagedStock = { decrement: 1 }
        break
    }

    await prisma.equipment.update({
      where: { id: equipmentId },
      data: stockUpdates,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar unidade:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
