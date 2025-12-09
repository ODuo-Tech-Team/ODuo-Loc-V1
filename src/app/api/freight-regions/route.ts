import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createRegionSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cities: z.array(z.string()).default([]),
  price: z.number().min(0, "Preço deve ser maior ou igual a zero"),
})

// GET - Listar regiões de frete do tenant
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const regions = await prisma.freightRegion.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ regions })
  } catch (error) {
    console.error("Erro ao listar regiões de frete:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST - Criar nova região de frete
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()

    // Validar dados
    const validation = createRegionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const data = validation.data

    // Verificar se já existe região com mesmo nome no tenant
    const existing = await prisma.freightRegion.findUnique({
      where: {
        tenantId_name: {
          tenantId: session.user.tenantId,
          name: data.name,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma região com esse nome" },
        { status: 400 }
      )
    }

    // Criar região
    const region = await prisma.freightRegion.create({
      data: {
        tenantId: session.user.tenantId,
        name: data.name,
        cities: data.cities,
        price: data.price,
      },
    })

    return NextResponse.json(region, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar região de frete:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
