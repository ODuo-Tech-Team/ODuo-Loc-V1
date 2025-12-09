import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateRegionSchema = z.object({
  name: z.string().min(1).optional(),
  cities: z.array(z.string()).optional(),
  price: z.number().min(0).optional(),
})

// GET - Detalhes de uma região
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

    const region = await prisma.freightRegion.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!region) {
      return NextResponse.json({ error: "Região não encontrada" }, { status: 404 })
    }

    return NextResponse.json(region)
  } catch (error) {
    console.error("Erro ao buscar região:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PUT - Atualizar região
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Validar dados
    const validation = updateRegionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const data = validation.data

    // Verificar se região pertence ao tenant
    const currentRegion = await prisma.freightRegion.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!currentRegion) {
      return NextResponse.json({ error: "Região não encontrada" }, { status: 404 })
    }

    // Verificar duplicidade de nome
    if (data.name && data.name !== currentRegion.name) {
      const existing = await prisma.freightRegion.findUnique({
        where: {
          tenantId_name: {
            tenantId: session.user.tenantId,
            name: data.name,
          },
        },
      })

      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: "Já existe uma região com esse nome" },
          { status: 400 }
        )
      }
    }

    // Atualizar região
    const region = await prisma.freightRegion.update({
      where: { id },
      data,
    })

    return NextResponse.json(region)
  } catch (error) {
    console.error("Erro ao atualizar região:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE - Remover região
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params

    // Verificar se região pertence ao tenant
    const region = await prisma.freightRegion.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    })

    if (!region) {
      return NextResponse.json({ error: "Região não encontrada" }, { status: 404 })
    }

    // Verificar se está em uso
    if (region._count.bookings > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir uma região que está em uso em orçamentos" },
        { status: 400 }
      )
    }

    // Deletar região
    await prisma.freightRegion.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar região:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
