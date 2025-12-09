import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { TransactionType } from "@prisma/client"

// Schema de validação
const createCategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["INCOME", "EXPENSE"]),
  color: z.string().optional(),
  icon: z.string().optional(),
})

// GET - Listar categorias
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") as TransactionType | null

    const categories = await prisma.transactionCategory.findMany({
      where: {
        tenantId: session.user.tenantId,
        ...(type && { type }),
      },
      orderBy: [
        { isDefault: "desc" },
        { name: "asc" },
      ],
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Erro ao listar categorias:", error)
    return NextResponse.json(
      { error: "Erro ao listar categorias" },
      { status: 500 }
    )
  }
}

// POST - Criar categoria
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const data = createCategorySchema.parse(body)

    // Verificar se já existe uma categoria com esse nome e tipo
    const existing = await prisma.transactionCategory.findUnique({
      where: {
        tenantId_name_type: {
          tenantId: session.user.tenantId,
          name: data.name,
          type: data.type as TransactionType,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma categoria com esse nome" },
        { status: 400 }
      )
    }

    const category = await prisma.transactionCategory.create({
      data: {
        tenantId: session.user.tenantId,
        name: data.name,
        type: data.type as TransactionType,
        color: data.color,
        icon: data.icon,
        isDefault: false,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Erro ao criar categoria:", error)
    return NextResponse.json(
      { error: "Erro ao criar categoria" },
      { status: 500 }
    )
  }
}
