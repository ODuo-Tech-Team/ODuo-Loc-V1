import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { TransactionType, TransactionStatus } from "@prisma/client"

// Schema de validação
const createTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.number().positive("Valor deve ser positivo"),
  date: z.string().transform((str) => new Date(str)),
  dueDate: z.string().transform((str) => new Date(str)).optional(),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  equipmentId: z.string().optional().nullable(),
  status: z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"]).optional(),
})

// GET - Listar transações
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") as TransactionType | null
    const status = searchParams.get("status") as TransactionStatus | null
    const categoryId = searchParams.get("categoryId")
    const equipmentId = searchParams.get("equipmentId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")

    const where = {
      tenantId: session.user.tenantId,
      ...(type && { type }),
      ...(status && { status }),
      ...(categoryId && { categoryId }),
      ...(equipmentId && { equipmentId }),
      ...(startDate && endDate && {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    }

    const [transactions, total] = await Promise.all([
      prisma.financialTransaction.findMany({
        where,
        include: {
          category: true,
          equipment: {
            select: { id: true, name: true },
          },
          recurrence: {
            select: { id: true, intervalDays: true, status: true },
          },
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.financialTransaction.count({ where }),
    ])

    // Calcular totais
    const totals = await prisma.financialTransaction.groupBy({
      by: ["type", "status"],
      where: {
        tenantId: session.user.tenantId,
        ...(startDate && endDate && {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      },
      _sum: { amount: true },
    })

    const summary = {
      totalIncome: 0,
      totalExpense: 0,
      pendingIncome: 0,
      pendingExpense: 0,
      paidIncome: 0,
      paidExpense: 0,
    }

    totals.forEach((t) => {
      const amount = t._sum.amount || 0
      if (t.type === "INCOME") {
        summary.totalIncome += amount
        if (t.status === "PENDING" || t.status === "OVERDUE") {
          summary.pendingIncome += amount
        } else if (t.status === "PAID") {
          summary.paidIncome += amount
        }
      } else {
        summary.totalExpense += amount
        if (t.status === "PENDING" || t.status === "OVERDUE") {
          summary.pendingExpense += amount
        } else if (t.status === "PAID") {
          summary.paidExpense += amount
        }
      }
    })

    return NextResponse.json({
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary,
    })
  } catch (error) {
    console.error("Erro ao listar transações:", error)
    return NextResponse.json(
      { error: "Erro ao listar transações" },
      { status: 500 }
    )
  }
}

// POST - Criar transação
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const data = createTransactionSchema.parse(body)

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

    const transaction = await prisma.financialTransaction.create({
      data: {
        tenantId: session.user.tenantId,
        type: data.type as TransactionType,
        description: data.description,
        amount: data.amount,
        date: data.date,
        dueDate: data.dueDate,
        categoryId: data.categoryId,
        equipmentId: data.equipmentId || null,
        status: (data.status as TransactionStatus) || TransactionStatus.PENDING,
        isRecurring: false,
      },
      include: {
        category: true,
        equipment: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Erro ao criar transação:", error)
    return NextResponse.json(
      { error: "Erro ao criar transação" },
      { status: 500 }
    )
  }
}
