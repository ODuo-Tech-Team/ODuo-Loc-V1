import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH - Atualizar tags de uma conversa
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { tags } = body

    if (!Array.isArray(tags)) {
      return NextResponse.json(
        { error: "Tags deve ser um array" },
        { status: 400 }
      )
    }

    // Validar que a conversa pertence ao tenant
    const conversation = await prisma.whatsAppConversation.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversa nao encontrada" },
        { status: 404 }
      )
    }

    // Normalizar tags (lowercase, sem duplicados, sem vazios)
    const normalizedTags = [...new Set(
      tags
        .map((t: string) => t.toLowerCase().trim())
        .filter((t: string) => t.length > 0)
    )]

    // Atualizar tags
    const updated = await prisma.whatsAppConversation.update({
      where: { id },
      data: { tags: normalizedTags },
      select: {
        id: true,
        tags: true,
      },
    })

    return NextResponse.json({ conversation: updated })
  } catch (error) {
    console.error("Erro ao atualizar tags:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar tags" },
      { status: 500 }
    )
  }
}

// GET - Listar tags de uma conversa
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const { id } = await params

    const conversation = await prisma.whatsAppConversation.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      select: {
        id: true,
        tags: true,
      },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversa nao encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({ tags: conversation.tags })
  } catch (error) {
    console.error("Erro ao buscar tags:", error)
    return NextResponse.json(
      { error: "Erro ao buscar tags" },
      { status: 500 }
    )
  }
}
