import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as z from "zod"

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
})

// PUT - Atualiza uma categoria
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const data = updateCategorySchema.parse(body)

    const existing = await prisma.blogCategory.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Categoria nao encontrada" }, { status: 404 })
    }

    // Verificar se slug ja existe em outra categoria
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.blogCategory.findUnique({
        where: { slug: data.slug },
      })
      if (slugExists) {
        return NextResponse.json(
          { error: "Ja existe uma categoria com este slug" },
          { status: 400 }
        )
      }
    }

    const category = await prisma.blogCategory.update({
      where: { id },
      data,
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados invalidos", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: "Erro ao atualizar categoria" }, { status: 500 })
  }
}

// DELETE - Deleta uma categoria
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const { id } = await params

    // Verificar se tem posts vinculados
    const category = await prisma.blogCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { posts: true } },
      },
    })

    if (!category) {
      return NextResponse.json({ error: "Categoria nao encontrada" }, { status: 404 })
    }

    if (category._count.posts > 0) {
      return NextResponse.json(
        { error: `Esta categoria possui ${category._count.posts} post(s) vinculado(s). Remova-os primeiro.` },
        { status: 400 }
      )
    }

    await prisma.blogCategory.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar categoria:", error)
    return NextResponse.json({ error: "Erro ao deletar categoria" }, { status: 500 })
  }
}
