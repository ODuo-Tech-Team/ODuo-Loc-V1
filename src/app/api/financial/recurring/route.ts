import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { TransactionType, RecurrenceStatus } from "@prisma/client"

// Schema de validação
const createRecurringSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.number().positive("Valor deve ser positivo"),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  equipmentId: z.string().optional().nullable(),
  intervalDays: z.number().int().positive("Intervalo deve ser positivo"),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)).optional().nullable(),
})

// GET - Listar recorrências
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") as RecurrenceStatus | null
    const type = searchParams.get("type") as TransactionType | null

    const recurring = await prisma.recurringTransaction.findMany({
      where: {
        tenantId: session.user.tenantId,
        ...(status && { status }),
        ...(type && { type }),
      },
      include: {
        category: true,
        equipment: {
          select: { id: true, name: true },
        },
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { nextDueDate: "asc" },
    })

    // Calcular próximas transações previstas (próximos 30 dias)
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const upcomingTransactions = recurring
      .filter((r) => r.status === RecurrenceStatus.ACTIVE)
      .filter((r) => r.nextDueDate <= thirtyDaysFromNow)
      .map((r) => ({
        recurrenceId: r.id,
        description: r.description,
        amount: r.amount,
        type: r.type,
        dueDate: r.nextDueDate,
        category: r.category,
        equipment: r.equipment,
        intervalDays: r.intervalDays,
      }))
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())

    return NextResponse.json({
      recurring,
      upcomingTransactions,
    })
  } catch (error) {
    console.error("Erro ao listar recorrências:", error)
    return NextResponse.json(
      { error: "Erro ao listar recorrências" },
      { status: 500 }
    )
  }
}

// POST - Criar recorrência
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const data = createRecurringSchema.parse(body)

    // Verificar se a categoria existe e pertence ao tenant
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

    // Se especificou equipamento, verificar se existe
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

    // Calcular a primeira data de vencimento
    const nextDueDate = data.startDate

    // Criar a recorrência e a primeira transação em uma transação do banco
    const result = await prisma.$transaction(async (tx) => {
      // Criar a recorrência
      const recurring = await tx.recurringTransaction.create({
        data: {
          tenantId: session.user.tenantId,
          type: data.type as TransactionType,
          description: data.description,
          amount: data.amount,
          categoryId: data.categoryId,
          equipmentId: data.equipmentId || null,
          intervalDays: data.intervalDays,
          startDate: data.startDate,
          endDate: data.endDate || null,
          nextDueDate,
          status: RecurrenceStatus.ACTIVE,
        },
        include: {
          category: true,
          equipment: {
            select: { id: true, name: true },
          },
        },
      })

      // Determinar o status inicial da transação
      const now = new Date()
      const isOverdue = nextDueDate < now
      const initialStatus = isOverdue ? "OVERDUE" : "PENDING"

      // Criar a primeira transação financeira
      await tx.financialTransaction.create({
        data: {
          tenantId: session.user.tenantId,
          type: data.type as TransactionType,
          description: data.description,
          amount: data.amount,
          date: nextDueDate,
          dueDate: nextDueDate,
          status: initialStatus,
          categoryId: data.categoryId,
          equipmentId: data.equipmentId || null,
          isRecurring: true,
          recurrenceId: recurring.id,
        },
      })

      // Calcular a próxima data de vencimento
      const nextDate = new Date(nextDueDate)
      nextDate.setDate(nextDate.getDate() + data.intervalDays)

      // Atualizar a recorrência com a próxima data
      await tx.recurringTransaction.update({
        where: { id: recurring.id },
        data: { nextDueDate: nextDate },
      })

      return recurring
    })

    return NextResponse.json({ recurring: result }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Erro ao criar recorrência:", error)
    return NextResponse.json(
      { error: "Erro ao criar recorrência" },
      { status: 500 }
    )
  }
}
