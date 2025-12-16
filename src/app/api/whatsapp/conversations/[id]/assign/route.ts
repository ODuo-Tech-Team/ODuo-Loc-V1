import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH - Atribuir conversa a usuário/time
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
    const { assignedToId, teamId } = body

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

    // Se atribuindo a um usuário, verificar se usuário existe e pertence ao tenant
    if (assignedToId) {
      const user = await prisma.user.findFirst({
        where: {
          id: assignedToId,
          tenantId: session.user.tenantId,
          active: true,
        },
      })

      if (!user) {
        return NextResponse.json(
          { error: "Usuário não encontrado" },
          { status: 404 }
        )
      }
    }

    // Se atribuindo a um time, verificar se time existe e pertence ao tenant
    if (teamId) {
      const team = await prisma.whatsAppTeam.findFirst({
        where: {
          id: teamId,
          tenantId: session.user.tenantId,
        },
      })

      if (!team) {
        return NextResponse.json(
          { error: "Time não encontrado" },
          { status: 404 }
        )
      }
    }

    // Atualizar atribuição
    const updatedConversation = await prisma.whatsAppConversation.update({
      where: { id },
      data: {
        assignedToId: assignedToId || null,
        assignedAt: assignedToId ? new Date() : null,
        teamId: teamId || null,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    })

    // Se atribuiu a um usuário, atualizar métricas do membro do time
    if (assignedToId && teamId) {
      await prisma.whatsAppTeamMember.updateMany({
        where: {
          teamId,
          userId: assignedToId,
        },
        data: {
          lastAssignedAt: new Date(),
          activeConversations: { increment: 1 },
        },
      })
    }

    // Se removeu atribuição anterior, decrementar métricas
    if (conversation.assignedToId && conversation.teamId && !assignedToId) {
      await prisma.whatsAppTeamMember.updateMany({
        where: {
          teamId: conversation.teamId,
          userId: conversation.assignedToId,
        },
        data: {
          activeConversations: { decrement: 1 },
        },
      })
    }

    return NextResponse.json({
      success: true,
      assignedTo: updatedConversation.assignedTo,
      team: updatedConversation.team,
    })
  } catch (error) {
    console.error("Erro ao atribuir conversa:", error)
    return NextResponse.json(
      { error: "Erro ao atribuir conversa" },
      { status: 500 }
    )
  }
}
