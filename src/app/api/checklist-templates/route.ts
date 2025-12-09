import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Listar templates de checklist
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const templates = await prisma.checklistTemplate.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error("Erro ao buscar templates:", error)
    return NextResponse.json(
      { error: "Erro ao buscar templates" },
      { status: 500 }
    )
  }
}

// POST - Criar novo template
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, items = [] } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: "Nome e tipo são obrigatórios" },
        { status: 400 }
      )
    }

    const template = await prisma.checklistTemplate.create({
      data: {
        name,
        type,
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

    return NextResponse.json(template)
  } catch (error) {
    console.error("Erro ao criar template:", error)
    return NextResponse.json(
      { error: "Erro ao criar template" },
      { status: 500 }
    )
  }
}
