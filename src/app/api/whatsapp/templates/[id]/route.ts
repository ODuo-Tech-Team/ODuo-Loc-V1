import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Obter template específico
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

    const template = await prisma.whatsAppTemplate.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error("Erro ao buscar template:", error)
    return NextResponse.json(
      { error: "Erro ao buscar template" },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar template
export async function PATCH(
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
    const { name, category, content, variables, shortcut } = body

    // Verificar se template existe
    const existing = await prisma.whatsAppTemplate.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se novo shortcut já existe
    if (shortcut && shortcut !== existing.shortcut) {
      const duplicateShortcut = await prisma.whatsAppTemplate.findFirst({
        where: {
          tenantId: session.user.tenantId,
          shortcut,
          NOT: { id },
        },
      })

      if (duplicateShortcut) {
        return NextResponse.json(
          { error: "Atalho já existe" },
          { status: 400 }
        )
      }
    }

    const template = await prisma.whatsAppTemplate.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category !== undefined && { category }),
        ...(content && { content }),
        ...(variables !== undefined && { variables }),
        ...(shortcut !== undefined && { shortcut }),
      },
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error("Erro ao atualizar template:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar template" },
      { status: 500 }
    )
  }
}

// DELETE - Deletar template
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

    // Verificar se template existe
    const existing = await prisma.whatsAppTemplate.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      )
    }

    await prisma.whatsAppTemplate.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar template:", error)
    return NextResponse.json(
      { error: "Erro ao deletar template" },
      { status: 500 }
    )
  }
}
