import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Obter detalhes de uma conversa
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

    const conversation = await prisma.whatsAppConversation.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
            phone: true,
            status: true,
            expectedValue: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            tradeName: true,
            email: true,
            phone: true,
            cpfCnpj: true,
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        instance: {
          select: { status: true, phoneNumber: true },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversa não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error("Erro ao buscar conversa:", error)
    return NextResponse.json(
      { error: "Erro ao buscar conversa" },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar conversa (status, atribuição, etc)
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
    const { status, assignedToId, isBot, tags } = body

    // Verificar se conversa existe e pertence ao tenant
    const conversation = await prisma.whatsAppConversation.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversa não encontrada" },
        { status: 404 }
      )
    }

    // Preparar dados para atualização
    const updateData: any = {}

    if (status !== undefined) {
      updateData.status = status
      if (status === "CLOSED") {
        updateData.closedAt = new Date()
        updateData.closedByUserId = session.user.id
      }
    }

    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId || null
      if (assignedToId) {
        updateData.assignedAt = new Date()
      }
    }

    if (isBot !== undefined) {
      updateData.isBot = isBot
    }

    if (tags !== undefined) {
      updateData.tags = tags
    }

    const updated = await prisma.whatsAppConversation.update({
      where: { id },
      data: updateData,
      include: {
        lead: {
          select: { id: true, name: true, company: true },
        },
        customer: {
          select: { id: true, name: true },
        },
        assignedTo: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({ conversation: updated })
  } catch (error) {
    console.error("Erro ao atualizar conversa:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar conversa" },
      { status: 500 }
    )
  }
}

// DELETE - Deletar conversa (soft delete ou hard delete)
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

    // Verificar se conversa existe e pertence ao tenant
    const conversation = await prisma.whatsAppConversation.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversa não encontrada" },
        { status: 404 }
      )
    }

    // Deletar mensagens primeiro (cascade)
    await prisma.whatsAppMessage.deleteMany({
      where: { conversationId: id },
    })

    // Deletar conversa
    await prisma.whatsAppConversation.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar conversa:", error)
    return NextResponse.json(
      { error: "Erro ao deletar conversa" },
      { status: 500 }
    )
  }
}
