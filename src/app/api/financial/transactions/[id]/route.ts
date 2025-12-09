import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { TransactionStatus } from "@prisma/client"

// Schema de validação para atualização
const updateTransactionSchema = z.object({
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  date: z.string().transform((str) => new Date(str)).optional(),
  dueDate: z.string().transform((str) => new Date(str)).optional().nullable(),
  categoryId: z.string().optional(),
  equipmentId: z.string().optional().nullable(),
  status: z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"]).optional(),
})

// GET - Buscar transação por ID
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

    const transaction = await prisma.financialTransaction.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        category: true,
        equipment: {
          select: { id: true, name: true },
        },
        recurrence: true,
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: "Transação não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error("Erro ao buscar transação:", error)
    return NextResponse.json(
      { error: "Erro ao buscar transação" },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar transação
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
    const data = updateTransactionSchema.parse(body)

    // Verificar se a transação existe e pertence ao tenant
    const existing = await prisma.financialTransaction.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Transação não encontrada" },
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

    // Se está marcando como pago, atualizar paidAt
    const updateData: Record<string, unknown> = { ...data }
    if (data.status === "PAID" && !existing.paidAt) {
      updateData.paidAt = new Date()
    } else if (data.status && data.status !== "PAID") {
      updateData.paidAt = null
    }

    const transaction = await prisma.financialTransaction.update({
      where: { id },
      data: updateData as {
        description?: string
        amount?: number
        date?: Date
        dueDate?: Date | null
        categoryId?: string
        equipmentId?: string | null
        status?: TransactionStatus
        paidAt?: Date | null
      },
      include: {
        category: true,
        equipment: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({ transaction })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Erro ao atualizar transação:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar transação" },
      { status: 500 }
    )
  }
}

// DELETE - Excluir transação
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

    // Verificar se a transação existe e pertence ao tenant
    const existing = await prisma.financialTransaction.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Transação não encontrada" },
        { status: 404 }
      )
    }

    await prisma.financialTransaction.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir transação:", error)
    return NextResponse.json(
      { error: "Erro ao excluir transação" },
      { status: 500 }
    )
  }
}
