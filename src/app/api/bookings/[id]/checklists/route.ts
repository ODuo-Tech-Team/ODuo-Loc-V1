import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Buscar checklists de uma reserva
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

    // Buscar checklists
    const checklists = await prisma.bookingChecklist.findMany({
      where: {
        bookingId: id,
        tenantId: session.user.tenantId,
      },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
    })

    // Organizar por tipo
    const pickup = checklists.find((c) => c.type === "PICKUP") || null
    const returnChecklist = checklists.find((c) => c.type === "RETURN") || null

    return NextResponse.json({
      pickup,
      return: returnChecklist,
    })
  } catch (error) {
    console.error("Erro ao buscar checklists:", error)
    return NextResponse.json(
      { error: "Erro ao buscar checklists" },
      { status: 500 }
    )
  }
}

// POST - Criar novo checklist
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
    const body = await request.json()
    const { type, items = [] } = body

    // Verificar se booking existe
    const booking = await prisma.booking.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Orçamento não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se já existe checklist desse tipo
    const existing = await prisma.bookingChecklist.findFirst({
      where: {
        bookingId: id,
        type,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Já existe um checklist desse tipo para este orçamento" },
        { status: 400 }
      )
    }

    // Criar checklist com itens
    const checklist = await prisma.bookingChecklist.create({
      data: {
        type,
        bookingId: id,
        tenantId: session.user.tenantId,
        items: {
          create: items.map((item: { description: string; order: number }, index: number) => ({
            description: item.description,
            order: item.order ?? index,
          })),
        },
      },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
    })

    return NextResponse.json(checklist)
  } catch (error) {
    console.error("Erro ao criar checklist:", error)
    return NextResponse.json(
      { error: "Erro ao criar checklist" },
      { status: 500 }
    )
  }
}
