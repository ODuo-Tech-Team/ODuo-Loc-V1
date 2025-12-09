import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const costSchema = z.object({
  type: z.enum(["PURCHASE", "MAINTENANCE", "INSURANCE", "FUEL", "REPAIR", "DEPRECIATION", "OTHER"]),
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.number().positive("Valor deve ser positivo"),
  date: z.string().transform((str) => new Date(str)),
  recurring: z.boolean().optional().default(false),
})

// GET - Listar custos do equipamento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const tenantId = session.user.tenantId

    // Verificar se o equipamento pertence ao tenant
    const equipment = await prisma.equipment.findFirst({
      where: { id, tenantId },
    })

    if (!equipment) {
      return NextResponse.json({ error: "Equipamento não encontrado" }, { status: 404 })
    }

    // Buscar parâmetros de filtro
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Construir filtro
    const where: Record<string, unknown> = {
      equipmentId: id,
      tenantId,
    }

    if (type) {
      where.type = type
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        (where.date as Record<string, Date>).gte = new Date(startDate)
      }
      if (endDate) {
        (where.date as Record<string, Date>).lte = new Date(endDate)
      }
    }

    const costs = await prisma.equipmentCost.findMany({
      where,
      orderBy: { date: "desc" },
    })

    // Calcular totais por tipo
    const totalsByType = await prisma.equipmentCost.groupBy({
      by: ["type"],
      where: { equipmentId: id, tenantId },
      _sum: { amount: true },
    })

    // Total geral
    const totalCosts = totalsByType.reduce((sum, item) => sum + (item._sum.amount || 0), 0)

    return NextResponse.json({
      costs,
      totalsByType: totalsByType.map((item) => ({
        type: item.type,
        total: item._sum.amount || 0,
      })),
      totalCosts,
    })
  } catch (error) {
    console.error("Erro ao buscar custos:", error)
    return NextResponse.json({ error: "Erro ao buscar custos" }, { status: 500 })
  }
}

// POST - Adicionar custo ao equipamento
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const tenantId = session.user.tenantId

    // Verificar se o equipamento pertence ao tenant
    const equipment = await prisma.equipment.findFirst({
      where: { id, tenantId },
    })

    if (!equipment) {
      return NextResponse.json({ error: "Equipamento não encontrado" }, { status: 404 })
    }

    const body = await request.json()
    const validationResult = costSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const data = validationResult.data

    const cost = await prisma.equipmentCost.create({
      data: {
        type: data.type,
        description: data.description,
        amount: data.amount,
        date: data.date,
        recurring: data.recurring,
        equipmentId: id,
        tenantId,
      },
    })

    return NextResponse.json(cost, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar custo:", error)
    return NextResponse.json({ error: "Erro ao criar custo" }, { status: 500 })
  }
}
