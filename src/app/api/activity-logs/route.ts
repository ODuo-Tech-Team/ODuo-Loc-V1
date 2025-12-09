import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission, type Role } from "@/lib/permissions"

// GET /api/activity-logs - Listar logs de atividade
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Apenas ADMIN e SUPER_ADMIN podem ver logs
    if (!hasPermission(session.user.role as Role, 'VIEW_REPORTS')) {
      return NextResponse.json({ error: "Sem permissão para visualizar logs" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)

    // Filtros
    const entity = searchParams.get("entity") // USER, CUSTOMER, EQUIPMENT, BOOKING
    const action = searchParams.get("action") // CREATE, UPDATE, DELETE, etc
    const userId = searchParams.get("userId")
    const entityId = searchParams.get("entityId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Paginação
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      tenantId: session.user.tenantId,
    }

    if (entity) where.entity = entity
    if (action) where.action = action
    if (userId) where.userId = userId
    if (entityId) where.entityId = entityId

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    // Buscar logs com paginação
    const [logs, total] = await Promise.all([
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
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip,
      }),
      prisma.activityLog.count({ where }),
    ])

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching activity logs:", error)
    return NextResponse.json(
      { error: "Erro ao buscar logs de atividade" },
      { status: 500 }
    )
  }
}
