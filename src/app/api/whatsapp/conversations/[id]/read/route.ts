import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH - Marcar conversa como lida/não lida
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
    const { read } = body

    if (typeof read !== "boolean") {
      return NextResponse.json(
        { error: "Campo 'read' deve ser boolean" },
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

    // Se marcando como lida, zerar unreadCount
    // Se marcando como não lida, setar unreadCount = 1 (indicador visual)
    const updatedConversation = await prisma.whatsAppConversation.update({
      where: { id },
      data: {
        unreadCount: read ? 0 : 1,
      },
    })

    return NextResponse.json({
      success: true,
      unreadCount: updatedConversation.unreadCount,
    })
  } catch (error) {
    console.error("Erro ao marcar conversa:", error)
    return NextResponse.json(
      { error: "Erro ao marcar conversa" },
      { status: 500 }
    )
  }
}
