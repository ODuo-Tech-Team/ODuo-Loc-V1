import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as z from "zod"

// GET - Busca um post por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const { id } = await params

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        category: true,
        author: { select: { name: true, email: true } },
      },
    })

    if (!post) {
      return NextResponse.json({ error: "Post nao encontrado" }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error("Erro ao buscar post:", error)
    return NextResponse.json({ error: "Erro ao buscar post" }, { status: 500 })
  }
}

const updatePostSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  excerpt: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  coverImage: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).optional(),
  publishedAt: z.string().nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  // SEO
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  focusKeyword: z.string().nullable().optional(),
  secondaryKeywords: z.array(z.string()).optional(),
  ogTitle: z.string().nullable().optional(),
  ogDescription: z.string().nullable().optional(),
  ogImage: z.string().nullable().optional(),
  twitterTitle: z.string().nullable().optional(),
  twitterDescription: z.string().nullable().optional(),
  twitterImage: z.string().nullable().optional(),
  canonicalUrl: z.string().nullable().optional(),
  noIndex: z.boolean().optional(),
  noFollow: z.boolean().optional(),
  schemaType: z.string().optional(),
  seoScore: z.number().nullable().optional(),
  readabilityScore: z.number().nullable().optional(),
})

// PUT - Atualiza um post
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
    const data = updatePostSchema.parse(body)

    // Verificar se post existe
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
    })

    if (!existingPost) {
      return NextResponse.json({ error: "Post nao encontrado" }, { status: 404 })
    }

    // Verificar se slug ja existe em outro post
    if (data.slug && data.slug !== existingPost.slug) {
      const slugExists = await prisma.blogPost.findUnique({
        where: { slug: data.slug },
      })
      if (slugExists) {
        return NextResponse.json(
          { error: "Ja existe um post com este slug" },
          { status: 400 }
        )
      }
    }

    // Se mudando para PUBLISHED e nao tinha publishedAt, definir agora
    let publishedAt = data.publishedAt !== undefined
      ? (data.publishedAt ? new Date(data.publishedAt) : null)
      : undefined

    if (
      data.status === "PUBLISHED" &&
      !existingPost.publishedAt &&
      publishedAt === undefined
    ) {
      publishedAt = new Date()
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        ...data,
        publishedAt,
        scheduledAt: data.scheduledAt !== undefined
          ? (data.scheduledAt ? new Date(data.scheduledAt) : null)
          : undefined,
      },
      include: {
        category: true,
        author: { select: { name: true } },
      },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error("Erro ao atualizar post:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados invalidos", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: "Erro ao atualizar post" }, { status: 500 })
  }
}

// DELETE - Deleta um post
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

    await prisma.blogPost.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar post:", error)
    return NextResponse.json({ error: "Erro ao deletar post" }, { status: 500 })
  }
}
