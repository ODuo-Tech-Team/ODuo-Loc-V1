import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { createSystemMessage } from "@/lib/whatsapp/bot-state-machine"

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

    // Preparar dados de update baseado no novo estado do bot
    let updateData: Prisma.WhatsAppConversationUpdateInput

    if (isBot) {
      // Ativando bot: resetar qualificação para permitir nova conversa
      updateData = {
        isBot: true,
        botActivatedAt: new Date(),
        status: "PENDING",
        qualificationScore: null,
        qualificationData: Prisma.JsonNull,
      }
    } else {
      // Desativando bot: atribuir ao usuário atual
      updateData = {
        isBot: false,
        status: "OPEN",
        assignedTo: { connect: { id: session.user.id } },
        assignedAt: new Date(),
      }
    }

    const updated = await prisma.whatsAppConversation.update({
      where: { id },
      data: updateData,
    })

    console.log("[Bot Toggle] Bot", isBot ? "enabled" : "disabled", "for conversation:", id)

    // Registrar atividade de sistema
    const actorName = session.user.name || "Usuário"
    if (isBot) {
      await createSystemMessage(
        session.user.tenantId,
        id,
        "bot_enabled",
        actorName
      )
      await createSystemMessage(
        session.user.tenantId,
        id,
        "status_changed",
        actorName,
        { status: "PENDING" }
      )
    } else {
      await createSystemMessage(
        session.user.tenantId,
        id,
        "bot_disabled",
        actorName
      )
      await createSystemMessage(
        session.user.tenantId,
        id,
        "agent_assigned",
        actorName,
        { agentName: actorName }
      )
    }

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
