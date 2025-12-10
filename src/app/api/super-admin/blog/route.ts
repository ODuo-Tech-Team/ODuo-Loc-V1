import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as z from "zod"

// GET - Lista todos os posts do blog
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: {
          select: { name: true, color: true },
        },
        author: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error("Erro ao listar posts:", error)
    return NextResponse.json({ error: "Erro ao listar posts" }, { status: 500 })
  }
}

const createPostSchema = z.object({
  title: z.string().min(1, "Titulo obrigatorio"),
  slug: z.string().min(1, "Slug obrigatorio"),
  excerpt: z.string().min(1, "Resumo obrigatorio"),
  content: z.string().min(1, "Conteudo obrigatorio"),
  coverImage: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).default("DRAFT"),
  publishedAt: z.string().optional(),
  scheduledAt: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  // SEO
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  focusKeyword: z.string().optional(),
  secondaryKeywords: z.array(z.string()).default([]),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().optional(),
  twitterImage: z.string().optional(),
  canonicalUrl: z.string().optional(),
  noIndex: z.boolean().default(false),
  noFollow: z.boolean().default(false),
  schemaType: z.string().default("Article"),
  seoScore: z.number().optional(),
  readabilityScore: z.number().optional(),
})

// POST - Cria um novo post
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const data = createPostSchema.parse(body)

    // Verificar se slug ja existe
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug: data.slug },
    })

    if (existingPost) {
      return NextResponse.json(
        { error: "Ja existe um post com este slug" },
        { status: 400 }
      )
    }

    const post = await prisma.blogPost.create({
      data: {
        ...data,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : data.status === "PUBLISHED" ? new Date() : null,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        authorId: session.user.id,
      },
      include: {
        category: true,
        author: { select: { name: true } },
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar post:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados invalidos", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: "Erro ao criar post" }, { status: 500 })
  }
}
