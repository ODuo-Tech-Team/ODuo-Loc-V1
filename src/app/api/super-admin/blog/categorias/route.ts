import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as z from "zod"

// GET - Lista todas as categorias
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const categories = await prisma.blogCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Erro ao listar categorias:", error)
    return NextResponse.json({ error: "Erro ao listar categorias" }, { status: 500 })
  }
}

const createCategorySchema = z.object({
  name: z.string().min(1, "Nome obrigatorio"),
  slug: z.string().min(1, "Slug obrigatorio"),
  description: z.string().optional(),
  color: z.string().optional(),
})

// POST - Cria uma nova categoria
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const data = createCategorySchema.parse(body)

    // Verificar se slug ja existe
    const existing = await prisma.blogCategory.findUnique({
      where: { slug: data.slug },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Ja existe uma categoria com este slug" },
        { status: 400 }
      )
    }

    const category = await prisma.blogCategory.create({
      data,
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar categoria:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados invalidos", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 })
  }
}
