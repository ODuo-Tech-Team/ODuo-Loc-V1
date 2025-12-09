import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateMaintenanceSchema = z.object({
  type: z.enum(["PREVENTIVE", "CORRECTIVE", "INSPECTION"]).optional(),
  description: z.string().min(1).optional(),
  scheduledDate: z.string().optional(),
  completedDate: z.string().optional().nullable(),
  cost: z.number().optional().nullable(),
  vendor: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
})

// GET - Detalhes de uma manutenção
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

    const maintenance = await prisma.unitMaintenance.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        unit: {
          include: {
            equipment: {
              select: {
                id: true,
                name: true,
                category: true,
                images: true,
              },
            },
          },
        },
      },
    })

    if (!maintenance) {
      return NextResponse.json({ error: "Manutenção não encontrada" }, { status: 404 })
    }

    return NextResponse.json(maintenance)
  } catch (error) {
    console.error("Erro ao buscar manutenção:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PUT - Atualizar manutenção
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Validar dados
    const validation = updateMaintenanceSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const data = validation.data

    // Buscar manutenção atual
    const currentMaintenance = await prisma.unitMaintenance.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        unit: true,
      },
    })

    if (!currentMaintenance) {
      return NextResponse.json({ error: "Manutenção não encontrada" }, { status: 404 })
    }

    // Preparar dados de atualização
    const updateData: any = {}
    if (data.type !== undefined) updateData.type = data.type
    if (data.description !== undefined) updateData.description = data.description
    if (data.status !== undefined) updateData.status = data.status
    if (data.vendor !== undefined) updateData.vendor = data.vendor
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.cost !== undefined) updateData.cost = data.cost
    if (data.scheduledDate !== undefined) {
      updateData.scheduledDate = new Date(data.scheduledDate)
    }
    if (data.completedDate !== undefined) {
      updateData.completedDate = data.completedDate ? new Date(data.completedDate) : null
    }

    // Se completou a manutenção, definir data de conclusão
    if (data.status === "COMPLETED" && !data.completedDate) {
      updateData.completedDate = new Date()
    }

    // Atualizar manutenção
    const maintenance = await prisma.unitMaintenance.update({
      where: { id },
      data: updateData,
      include: {
        unit: {
          include: {
            equipment: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    // Se status mudou para COMPLETED ou IN_PROGRESS, atualizar status da unidade
    if (data.status) {
      const unitStatus =
        data.status === "IN_PROGRESS" || data.status === "SCHEDULED"
          ? "MAINTENANCE"
          : currentMaintenance.unit.status === "MAINTENANCE"
          ? "AVAILABLE"
          : currentMaintenance.unit.status

      // Só atualiza se a unidade estava em manutenção e agora completou
      if (
        currentMaintenance.unit.status === "MAINTENANCE" &&
        (data.status === "COMPLETED" || data.status === "CANCELLED")
      ) {
        await prisma.equipmentUnit.update({
          where: { id: currentMaintenance.unitId },
          data: { status: "AVAILABLE" },
        })

        // Atualizar contagem de estoque
        await prisma.equipment.update({
          where: { id: currentMaintenance.unit.equipmentId },
          data: {
            maintenanceStock: { decrement: 1 },
            availableStock: { increment: 1 },
          },
        })
      }
    }

    return NextResponse.json(maintenance)
  } catch (error) {
    console.error("Erro ao atualizar manutenção:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE - Remover manutenção
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

    // Buscar manutenção
    const maintenance = await prisma.unitMaintenance.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!maintenance) {
      return NextResponse.json({ error: "Manutenção não encontrada" }, { status: 404 })
    }

    // Não permitir excluir manutenções em andamento
    if (maintenance.status === "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Não é possível excluir uma manutenção em andamento" },
        { status: 400 }
      )
    }

    // Deletar manutenção
    await prisma.unitMaintenance.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar manutenção:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
