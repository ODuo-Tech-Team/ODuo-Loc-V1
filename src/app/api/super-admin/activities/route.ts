import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/super-admin"

// GET - Listar todas as atividades do sistema
export async function GET(request: NextRequest) {
  const authResult = await requireSuperAdmin()
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const tenantId = searchParams.get("tenantId")
    const action = searchParams.get("action")
    const entity = searchParams.get("entity")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {}

    if (tenantId) {
      where.tenantId = tenantId
    }

    if (action) {
      where.action = action
    }

    if (entity) {
      where.entity = entity
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    // Buscar atividades com informações do usuário e tenant
    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ])

    // Estatísticas gerais
    const stats = await prisma.activityLog.groupBy({
      by: ["action"],
      _count: true,
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // últimas 24 horas
        },
      },
    })

    // Buscar lista de tenants para o filtro
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({
      activities,
      tenants,
      stats: stats.reduce((acc, item) => {
        acc[item.action] = item._count
        return acc
      }, {} as Record<string, number>),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Erro ao buscar atividades:", error)
    return NextResponse.json(
      { error: "Erro ao buscar atividades" },
      { status: 500 }
    )
  }
}
