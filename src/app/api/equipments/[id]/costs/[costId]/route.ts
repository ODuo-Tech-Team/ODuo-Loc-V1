import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateCostSchema = z.object({
  type: z.enum(["PURCHASE", "MAINTENANCE", "INSURANCE", "FUEL", "REPAIR", "DEPRECIATION", "OTHER"]).optional(),
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  date: z.string().transform((str) => new Date(str)).optional(),
  recurring: z.boolean().optional(),
})

// GET - Buscar custo específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; costId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id, costId } = await params
    const tenantId = session.user.tenantId

    const cost = await prisma.equipmentCost.findFirst({
      where: {
        id: costId,
        equipmentId: id,
        tenantId,
      },
    })

    if (!cost) {
      return NextResponse.json({ error: "Custo não encontrado" }, { status: 404 })
    }

    return NextResponse.json(cost)
  } catch (error) {
    console.error("Erro ao buscar custo:", error)
    return NextResponse.json({ error: "Erro ao buscar custo" }, { status: 500 })
  }
}

// PUT - Atualizar custo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; costId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id, costId } = await params
    const tenantId = session.user.tenantId

    // Verificar se o custo existe e pertence ao tenant
    const existingCost = await prisma.equipmentCost.findFirst({
      where: {
        id: costId,
        equipmentId: id,
        tenantId,
      },
    })

    if (!existingCost) {
      return NextResponse.json({ error: "Custo não encontrado" }, { status: 404 })
    }

    const body = await request.json()
    const validationResult = updateCostSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const data = validationResult.data

    const cost = await prisma.equipmentCost.update({
      where: { id: costId },
      data: {
        ...(data.type && { type: data.type }),
        ...(data.description && { description: data.description }),
        ...(data.amount && { amount: data.amount }),
        ...(data.date && { date: data.date }),
        ...(data.recurring !== undefined && { recurring: data.recurring }),
      },
    })

    return NextResponse.json(cost)
  } catch (error) {
    console.error("Erro ao atualizar custo:", error)
    return NextResponse.json({ error: "Erro ao atualizar custo" }, { status: 500 })
  }
}

// DELETE - Remover custo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; costId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id, costId } = await params
    const tenantId = session.user.tenantId

    // Verificar se o custo existe e pertence ao tenant
    const existingCost = await prisma.equipmentCost.findFirst({
      where: {
        id: costId,
        equipmentId: id,
        tenantId,
      },
    })

    if (!existingCost) {
      return NextResponse.json({ error: "Custo não encontrado" }, { status: 404 })
    }

    await prisma.equipmentCost.delete({
      where: { id: costId },
    })

    return NextResponse.json({ message: "Custo removido com sucesso" })
  } catch (error) {
    console.error("Erro ao remover custo:", error)
    return NextResponse.json({ error: "Erro ao remover custo" }, { status: 500 })
  }
}
