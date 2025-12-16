import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH - Arquivar/Desarquivar conversa
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
    const { archived } = body

    if (typeof archived !== "boolean") {
      return NextResponse.json(
        { error: "Campo 'archived' deve ser boolean" },
        { status: 400 }
      )
    }

    // Verificar se conversa pertence ao tenant
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

    // Atualizar status de arquivamento
    const updatedConversation = await prisma.whatsAppConversation.update({
      where: { id },
      data: {
        archived,
        archivedAt: archived ? new Date() : null,
        archivedByUserId: archived ? session.user.id : null,
      },
    })

    return NextResponse.json({
      success: true,
      archived: updatedConversation.archived,
    })
  } catch (error) {
    console.error("Erro ao arquivar conversa:", error)
    return NextResponse.json(
      { error: "Erro ao arquivar conversa" },
      { status: 500 }
    )
  }
}
