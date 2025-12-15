import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH - Habilitar/Desabilitar bot na conversa
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
    const { isBot } = body

    if (typeof isBot !== "boolean") {
      return NextResponse.json(
        { error: "isBot deve ser true ou false" },
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

    const updated = await prisma.whatsAppConversation.update({
      where: { id },
      data: {
        isBot,
        // Se desativando o bot, atribui ao usuário atual
        ...(isBot === false && {
          assignedToId: session.user.id,
          assignedAt: new Date(),
        }),
      },
    })

    return NextResponse.json({
      success: true,
      isBot: updated.isBot,
    })
  } catch (error) {
    console.error("Erro ao alterar status do bot:", error)
    return NextResponse.json(
      { error: "Erro ao alterar status do bot" },
      { status: 500 }
    )
  }
}
