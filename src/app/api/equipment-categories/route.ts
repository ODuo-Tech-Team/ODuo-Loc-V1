import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Listar categorias de equipamentos
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const categories = await prisma.equipmentCategory.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(categories, { status: 200 })
  } catch (error) {
    console.error("Erro ao buscar categorias:", error)
    return NextResponse.json(
      { error: "Erro ao buscar categorias" },
      { status: 500 }
    )
  }
}

// POST - Criar nova categoria
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, color } = body

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Nome da categoria é obrigatório (mínimo 2 caracteres)" },
        { status: 400 }
      )
    }

    // Verificar se categoria já existe
    const existingCategory = await prisma.equipmentCategory.findFirst({
      where: {
        tenantId: session.user.tenantId,
        name: {
          equals: name.trim(),
          mode: "insensitive",
        },
      },
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: "Já existe uma categoria com este nome" },
        { status: 409 }
      )
    }

    const category = await prisma.equipmentCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || null,
        tenantId: session.user.tenantId,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar categoria:", error)
    return NextResponse.json(
      { error: "Erro ao criar categoria" },
      { status: 500 }
    )
  }
}
