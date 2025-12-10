import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Busca post por slug (API pública)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const post = await prisma.blogPost.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
        publishedAt: { not: null },
      },
      include: {
        category: {
          select: {
            name: true,
            slug: true,
            color: true,
          },
        },
        author: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json({ error: "Post nao encontrado" }, { status: 404 })
    }

    // Buscar posts relacionados (mesma categoria ou tags similares)
    const relatedPosts = await prisma.blogPost.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: { not: null },
        id: { not: post.id },
        OR: [
          post.categoryId ? { categoryId: post.categoryId } : {},
          post.tags.length > 0 ? { tags: { hasSome: post.tags } } : {},
        ],
      },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        publishedAt: true,
        category: {
          select: {
            name: true,
            slug: true,
            color: true,
          },
        },
      },
    })

    return NextResponse.json({
      post,
      relatedPosts,
    })
  } catch (error) {
    console.error("Erro ao buscar post:", error)
    return NextResponse.json({ error: "Erro ao buscar post" }, { status: 500 })
  }
}
