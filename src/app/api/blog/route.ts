import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Lista posts publicados (API pública)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const categorySlug = searchParams.get("category")
    const tag = searchParams.get("tag")

    const skip = (page - 1) * limit

    const where = {
      status: "PUBLISHED" as const,
      publishedAt: { not: null },
      ...(categorySlug && {
        category: { slug: categorySlug },
      }),
      ...(tag && {
        tags: { has: tag },
      }),
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          publishedAt: true,
          tags: true,
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
      }),
      prisma.blogPost.count({ where }),
    ])

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Erro ao listar posts:", error)
    return NextResponse.json({ error: "Erro ao listar posts" }, { status: 500 })
  }
}
