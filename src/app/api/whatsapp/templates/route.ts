import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Listar templates
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const templates = await prisma.whatsAppTemplate.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error("Erro ao buscar templates:", error)
    return NextResponse.json(
      { error: "Erro ao buscar templates" },
      { status: 500 }
    )
  }
}

// POST - Criar template
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, category, content, variables, shortcut } = body

    if (!name || !content) {
      return NextResponse.json(
        { error: "Nome e conteúdo são obrigatórios" },
        { status: 400 }
      )
    }

    // Verificar se shortcut já existe
    if (shortcut) {
      const existing = await prisma.whatsAppTemplate.findFirst({
        where: {
          tenantId: session.user.tenantId,
          shortcut,
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: "Atalho já existe" },
          { status: 400 }
        )
      }
    }

    const template = await prisma.whatsAppTemplate.create({
      data: {
        tenantId: session.user.tenantId,
        name,
        category,
        content,
        variables: variables || [],
        shortcut,
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar template:", error)
    return NextResponse.json(
      { error: "Erro ao criar template" },
      { status: 500 }
    )
  }
}
