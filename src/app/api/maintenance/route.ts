import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createMaintenanceSchema = z.object({
  unitId: z.string().min(1, "Unidade é obrigatória"),
  type: z.enum(["PREVENTIVE", "CORRECTIVE", "INSPECTION"]),
  description: z.string().min(1, "Descrição é obrigatória"),
  scheduledDate: z.string().min(1, "Data é obrigatória"),
  cost: z.number().nullish(), // Aceita number, null ou undefined
  vendor: z.string().nullish(),
  notes: z.string().nullish(),
})

// GET - Listar manutenções (com filtros)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unitId = searchParams.get("unitId")
    const equipmentId = searchParams.get("equipmentId")
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: any = {
      tenantId: session.user.tenantId,
    }

    if (unitId) where.unitId = unitId
    if (equipmentId) {
      where.unit = {
        equipmentId: equipmentId,
      }
    }
    if (status) where.status = status
    if (type) where.type = type
    if (startDate || endDate) {
      where.scheduledDate = {}
      if (startDate) where.scheduledDate.gte = new Date(startDate)
      if (endDate) where.scheduledDate.lte = new Date(endDate)
    }

    const maintenances = await prisma.unitMaintenance.findMany({
      where,
      include: {
        unit: {
          include: {
            equipment: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: { scheduledDate: "asc" },
    })

    // Estatísticas
    const stats = {
      total: maintenances.length,
      scheduled: maintenances.filter(m => m.status === "SCHEDULED").length,
      inProgress: maintenances.filter(m => m.status === "IN_PROGRESS").length,
      completed: maintenances.filter(m => m.status === "COMPLETED").length,
      cancelled: maintenances.filter(m => m.status === "CANCELLED").length,
      totalCost: maintenances.filter(m => m.status === "COMPLETED").reduce((sum, m) => sum + (m.cost || 0), 0),
    }

    return NextResponse.json({ maintenances, stats })
  } catch (error) {
    console.error("Erro ao listar manutenções:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST - Criar nova manutenção
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()

    // Validar dados
    const validation = createMaintenanceSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const data = validation.data

    // Verificar se a unidade pertence ao tenant
    const unit = await prisma.equipmentUnit.findFirst({
      where: {
        id: data.unitId,
        tenantId: session.user.tenantId,
      },
    })

    if (!unit) {
      return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 })
    }

    // Criar manutenção
    const maintenance = await prisma.unitMaintenance.create({
      data: {
        unitId: data.unitId,
        tenantId: session.user.tenantId,
        type: data.type,
        description: data.description,
        scheduledDate: new Date(data.scheduledDate),
        cost: data.cost,
        vendor: data.vendor,
        notes: data.notes,
      },
      include: {
        unit: {
          include: {
            equipment: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(maintenance, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar manutenção:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
