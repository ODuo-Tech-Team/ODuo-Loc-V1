import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createUnitSchema = z.object({
  serialNumber: z.string().min(1, "Número de série é obrigatório"),
  internalCode: z.string().optional(),
  status: z.enum(["AVAILABLE", "RENTED", "MAINTENANCE", "DAMAGED", "RETIRED"]).default("AVAILABLE"),
  acquisitionDate: z.string().optional(),
  acquisitionCost: z.number().optional(),
  warrantyExpiry: z.string().optional(),
  notes: z.string().optional(),
})

// GET - Listar unidades de um equipamento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id: equipmentId } = await params

    // Verificar se o equipamento pertence ao tenant
    const equipment = await prisma.equipment.findFirst({
      where: {
        id: equipmentId,
        tenantId: session.user.tenantId,
      },
    })

    if (!equipment) {
      return NextResponse.json({ error: "Equipamento não encontrado" }, { status: 404 })
    }

    const units = await prisma.equipmentUnit.findMany({
      where: {
        equipmentId,
        tenantId: session.user.tenantId,
      },
      include: {
        maintenances: {
          where: {
            status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          },
          orderBy: { scheduledDate: "asc" },
          take: 1,
        },
        _count: {
          select: {
            maintenances: true,
            documents: true,
            bookingUnits: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Estatísticas
    const stats = {
      total: units.length,
      available: units.filter(u => u.status === "AVAILABLE").length,
      rented: units.filter(u => u.status === "RENTED").length,
      maintenance: units.filter(u => u.status === "MAINTENANCE").length,
      damaged: units.filter(u => u.status === "DAMAGED").length,
      retired: units.filter(u => u.status === "RETIRED").length,
    }

    return NextResponse.json({ units, stats })
  } catch (error) {
    console.error("Erro ao listar unidades:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST - Criar nova unidade
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id: equipmentId } = await params
    const body = await request.json()

    // Validar dados
    const validation = createUnitSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const data = validation.data

    // Verificar se o equipamento pertence ao tenant
    const equipment = await prisma.equipment.findFirst({
      where: {
        id: equipmentId,
        tenantId: session.user.tenantId,
      },
    })

    if (!equipment) {
      return NextResponse.json({ error: "Equipamento não encontrado" }, { status: 404 })
    }

    // Verificar se já existe unidade com esse serial number no tenant
    const existingUnit = await prisma.equipmentUnit.findUnique({
      where: {
        tenantId_serialNumber: {
          tenantId: session.user.tenantId,
          serialNumber: data.serialNumber,
        },
      },
    })

    if (existingUnit) {
      return NextResponse.json(
        { error: "Já existe uma unidade com esse número de série" },
        { status: 400 }
      )
    }

    // Criar unidade
    const unit = await prisma.equipmentUnit.create({
      data: {
        equipmentId,
        tenantId: session.user.tenantId,
        serialNumber: data.serialNumber,
        internalCode: data.internalCode,
        status: data.status,
        acquisitionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : null,
        acquisitionCost: data.acquisitionCost,
        warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
        notes: data.notes,
      },
    })

    // Atualizar contagem de estoque do equipamento
    await prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        totalStock: { increment: 1 },
        availableStock: data.status === "AVAILABLE" ? { increment: 1 } : undefined,
        maintenanceStock: data.status === "MAINTENANCE" ? { increment: 1 } : undefined,
        damagedStock: data.status === "DAMAGED" ? { increment: 1 } : undefined,
      },
    })

    return NextResponse.json(unit, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar unidade:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
