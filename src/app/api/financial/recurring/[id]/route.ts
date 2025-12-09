import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { RecurrenceStatus } from "@prisma/client"

// Schema de validação para atualização
const updateRecurringSchema = z.object({
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  categoryId: z.string().optional(),
  equipmentId: z.string().optional().nullable(),
  intervalDays: z.number().int().positive().optional(),
  endDate: z.string().transform((str) => new Date(str)).optional().nullable(),
  updateFuture: z.boolean().optional(), // Se deve atualizar transações futuras
})

// GET - Buscar recorrência por ID
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

    const recurring = await prisma.recurringTransaction.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        category: true,
        equipment: {
          select: { id: true, name: true },
        },
        transactions: {
          orderBy: { date: "desc" },
          take: 10,
          include: {
            category: true,
          },
        },
      },
    })

    if (!recurring) {
      return NextResponse.json(
        { error: "Recorrência não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({ recurring })
  } catch (error) {
    console.error("Erro ao buscar recorrência:", error)
    return NextResponse.json(
      { error: "Erro ao buscar recorrência" },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar recorrência
export async function PATCH(
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
    const data = updateRecurringSchema.parse(body)

    // Verificar se a recorrência existe e pertence ao tenant
    const existing = await prisma.recurringTransaction.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Recorrência não encontrada" },
        { status: 404 }
      )
    }

    // Se está alterando a categoria, verificar se existe
    if (data.categoryId) {
      const category = await prisma.transactionCategory.findFirst({
        where: {
          id: data.categoryId,
          tenantId: session.user.tenantId,
        },
      })

      if (!category) {
        return NextResponse.json(
          { error: "Categoria não encontrada" },
          { status: 404 }
        )
      }
    }

    // Se está alterando equipamento, verificar se existe
    if (data.equipmentId) {
      const equipment = await prisma.equipment.findFirst({
        where: {
          id: data.equipmentId,
          tenantId: session.user.tenantId,
        },
      })

      if (!equipment) {
        return NextResponse.json(
          { error: "Equipamento não encontrado" },
          { status: 404 }
        )
      }
    }

    // Verificar se deve atualizar transações futuras pendentes
    const updateFuture = data.updateFuture ?? false
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { updateFuture: _, ...updateData } = data

    const recurring = await prisma.recurringTransaction.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        equipment: {
          select: { id: true, name: true },
        },
      },
    })

    // Se solicitado, atualizar transações futuras pendentes
    if (updateFuture) {
      const now = new Date()
      await prisma.financialTransaction.updateMany({
        where: {
          recurrenceId: id,
          status: "PENDING",
          date: { gte: now },
        },
        data: {
          ...(data.description && { description: data.description }),
          ...(data.amount && { amount: data.amount }),
          ...(data.categoryId && { categoryId: data.categoryId }),
          ...(data.equipmentId !== undefined && { equipmentId: data.equipmentId }),
        },
      })
    }

    return NextResponse.json({ recurring })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Erro ao atualizar recorrência:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar recorrência" },
      { status: 500 }
    )
  }
}

// DELETE - Cancelar recorrência
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

    // Verificar se a recorrência existe e pertence ao tenant
    const existing = await prisma.recurringTransaction.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Recorrência não encontrada" },
        { status: 404 }
      )
    }

    // Marcar como cancelada ao invés de deletar (mantém histórico)
    await prisma.recurringTransaction.update({
      where: { id },
      data: { status: RecurrenceStatus.CANCELLED },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao cancelar recorrência:", error)
    return NextResponse.json(
      { error: "Erro ao cancelar recorrência" },
      { status: 500 }
    )
  }
}
