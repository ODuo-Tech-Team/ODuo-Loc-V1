import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Histórico de movimentações de um equipamento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ equipmentId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { equipmentId } = await params
    const url = new URL(request.url)

    // Parâmetros de paginação
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    // Filtros
    const type = url.searchParams.get("type")
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")

    // Verificar se o equipamento existe e pertence ao tenant
    const equipment = await prisma.equipment.findFirst({
      where: {
        id: equipmentId,
        tenantId: session.user.tenantId,
      },
      select: { id: true, name: true },
    })

    if (!equipment) {
      return NextResponse.json(
        { error: "Equipamento não encontrado" },
        { status: 404 }
      )
    }

    const whereClause: any = {
      equipmentId,
      tenantId: session.user.tenantId,
    }

    if (type) {
      whereClause.type = type
    }

    if (startDate || endDate) {
      whereClause.createdAt = {}
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate)
      }
    }

    // Buscar movimentações com paginação
    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true },
          },
          booking: {
            select: {
              id: true,
              bookingNumber: true,
              customer: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.stockMovement.count({ where: whereClause }),
    ])

    // Calcular resumo por tipo
    const summary = await prisma.stockMovement.groupBy({
      by: ["type"],
      where: {
        equipmentId,
        tenantId: session.user.tenantId,
      },
      _sum: {
        quantity: true,
      },
      _count: true,
    })

    return NextResponse.json({
      equipment: {
        id: equipment.id,
        name: equipment.name,
      },
      movements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: summary.map(s => ({
        type: s.type,
        totalQuantity: s._sum.quantity || 0,
        count: s._count,
      })),
    })
  } catch (error) {
    console.error("Erro ao buscar histórico de movimentações:", error)
    return NextResponse.json(
      { error: "Erro ao buscar histórico de movimentações" },
      { status: 500 }
    )
  }
}
