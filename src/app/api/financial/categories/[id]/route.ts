import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema de validação para atualização
const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
})

// GET - Buscar categoria por ID
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

    const category = await prisma.transactionCategory.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error("Erro ao buscar categoria:", error)
    return NextResponse.json(
      { error: "Erro ao buscar categoria" },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar categoria
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
    const data = updateCategorySchema.parse(body)

    // Verificar se a categoria existe e pertence ao tenant
    const existing = await prisma.transactionCategory.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      )
    }

    // Se está alterando o nome, verificar duplicidade
    if (data.name && data.name !== existing.name) {
      const duplicate = await prisma.transactionCategory.findUnique({
        where: {
          tenantId_name_type: {
            tenantId: session.user.tenantId,
            name: data.name,
            type: existing.type,
          },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: "Já existe uma categoria com esse nome" },
          { status: 400 }
        )
      }
    }

    const category = await prisma.transactionCategory.update({
      where: { id },
      data,
    })

    return NextResponse.json({ category })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Erro ao atualizar categoria:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar categoria" },
      { status: 500 }
    )
  }
}

// DELETE - Excluir categoria
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

    // Verificar se a categoria existe e pertence ao tenant
    const existing = await prisma.transactionCategory.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      )
    }

    // Verificar se existem transações usando essa categoria
    const transactionsCount = await prisma.financialTransaction.count({
      where: { categoryId: id },
    })

    if (transactionsCount > 0) {
      return NextResponse.json(
        {
          error: "Não é possível excluir esta categoria",
          details: `Existem ${transactionsCount} transação(ões) usando esta categoria`
        },
        { status: 400 }
      )
    }

    // Verificar se existem recorrências usando essa categoria
    const recurringCount = await prisma.recurringTransaction.count({
      where: { categoryId: id },
    })

    if (recurringCount > 0) {
      return NextResponse.json(
        {
          error: "Não é possível excluir esta categoria",
          details: `Existem ${recurringCount} transação(ões) recorrente(s) usando esta categoria`
        },
        { status: 400 }
      )
    }

    await prisma.transactionCategory.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir categoria:", error)
    return NextResponse.json(
      { error: "Erro ao excluir categoria" },
      { status: 500 }
    )
  }
}
