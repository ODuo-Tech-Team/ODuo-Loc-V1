import { prisma } from "@/lib/prisma"
import { publishSSE } from "./sse-publisher"

/**
 * Serviço de atribuição de conversas a agentes
 * Implementa round-robin e least-busy para distribuição automática
 */

interface AssignmentResult {
  success: boolean
  agentId?: string
  agentName?: string
  error?: string
}

/**
 * Obtém o próximo agente disponível para atribuição
 * Algoritmo: Round-robin com fallback para least-busy
 */
export async function getNextAvailableAgent(
  tenantId: string,
  teamId?: string
): Promise<string | null> {
  try {
    // Se teamId especificado, buscar apenas membros desse time
    // Caso contrário, buscar todos os membros de todos os times do tenant
    const whereClause = teamId
      ? { teamId }
      : { team: { tenantId } }

    // Buscar membros ordenados por:
    // 1. lastAssignedAt (mais antigo primeiro = round-robin)
    // 2. activeConversations (menos ocupado como desempate)
    const members = await prisma.whatsAppTeamMember.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, active: true },
        },
        team: {
          select: { autoAssign: true, assignmentMode: true },
        },
      },
      orderBy: [
        { lastAssignedAt: { sort: "asc", nulls: "first" } },
        { activeConversations: "asc" },
      ],
    })

    // Filtrar apenas usuários ativos e de times com auto-assign ativado
    const availableMembers = members.filter(
      (m) => m.user.active && m.team.autoAssign
    )

    if (availableMembers.length === 0) {
      return null
    }

    // Retornar o primeiro (mais antigo atribuído ou com menos conversas)
    return availableMembers[0].userId
  } catch (error) {
    console.error("[Assignment] Error getting next agent:", error)
    return null
  }
}

/**
 * Atribui uma conversa a um agente específico
 */
export async function assignConversation(
  conversationId: string,
  userId: string,
  teamId?: string
): Promise<AssignmentResult> {
  try {
    // Buscar dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, tenantId: true },
    })

    if (!user) {
      return { success: false, error: "Usuário não encontrado" }
    }

    // Atualizar conversa
    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: {
        assignedToId: userId,
        assignedAt: new Date(),
        ...(teamId && { teamId }),
      },
    })

    // Atualizar métricas do membro do time (se pertencer a um time)
    if (teamId) {
      await prisma.whatsAppTeamMember.updateMany({
        where: { teamId, userId },
        data: {
          lastAssignedAt: new Date(),
          activeConversations: { increment: 1 },
          totalHandled: { increment: 1 },
        },
      })
    }

    // Notificar agente via SSE
    try {
      await publishSSE(userId, "new_assignment", {
        conversationId,
        title: "Nova conversa atribuída",
        playSound: true,
      })
    } catch (sseError) {
      console.warn("[Assignment] Failed to notify via SSE:", sseError)
    }

    return {
      success: true,
      agentId: userId,
      agentName: user.name,
    }
  } catch (error) {
    console.error("[Assignment] Error assigning conversation:", error)
    return { success: false, error: "Erro ao atribuir conversa" }
  }
}

/**
 * Auto-atribui conversa quando bot transfere para humano
 * Usa round-robin para distribuir entre agentes
 */
export async function autoAssignOnBotTransfer(
  tenantId: string,
  conversationId: string,
  teamId?: string
): Promise<AssignmentResult> {
  try {
    // Buscar próximo agente disponível
    const agentId = await getNextAvailableAgent(tenantId, teamId)

    if (!agentId) {
      console.warn("[Assignment] No available agents for auto-assign")
      return { success: false, error: "Nenhum agente disponível" }
    }

    // Atribuir conversa
    const result = await assignConversation(conversationId, agentId, teamId)

    if (result.success) {
      // Notificar com som de transferência do bot
      try {
        await publishSSE(agentId, "bot_transfer", {
          conversationId,
          title: "Bot transferiu conversa",
          body: "Cliente qualificado aguardando atendimento",
          playSound: true,
        })
      } catch (sseError) {
        console.warn("[Assignment] Failed to notify bot transfer:", sseError)
      }
    }

    return result
  } catch (error) {
    console.error("[Assignment] Error in auto-assign:", error)
    return { success: false, error: "Erro no auto-assign" }
  }
}

/**
 * Remove atribuição de conversa e atualiza métricas
 */
export async function unassignConversation(
  conversationId: string
): Promise<{ success: boolean }> {
  try {
    // Buscar conversa atual para saber quem estava atribuído
    const conversation = await prisma.whatsAppConversation.findUnique({
      where: { id: conversationId },
      select: { assignedToId: true, teamId: true },
    })

    if (!conversation) {
      return { success: false }
    }

    // Atualizar conversa
    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: {
        assignedToId: null,
        assignedAt: null,
      },
    })

    // Decrementar métricas do agente anterior
    if (conversation.assignedToId && conversation.teamId) {
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

    return { success: true }
  } catch (error) {
    console.error("[Assignment] Error unassigning conversation:", error)
    return { success: false }
  }
}

/**
 * Atualiza status online de um membro do time
 */
export async function updateMemberOnlineStatus(
  userId: string,
  isOnline: boolean
): Promise<void> {
  try {
    await prisma.whatsAppTeamMember.updateMany({
      where: { userId },
      data: { isOnline },
    })
  } catch (error) {
    console.error("[Assignment] Error updating online status:", error)
  }
}

/**
 * Marca conversa como resolvida e atualiza métricas
 */
export async function resolveConversation(
  conversationId: string,
  resolvedByUserId: string
): Promise<void> {
  try {
    const conversation = await prisma.whatsAppConversation.findUnique({
      where: { id: conversationId },
      select: { assignedToId: true, teamId: true },
    })

    if (!conversation) return

    // Atualizar conversa
    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: {
        status: "RESOLVED",
        closedAt: new Date(),
        closedByUserId: resolvedByUserId,
      },
    })

    // Decrementar conversas ativas do agente
    if (conversation.assignedToId && conversation.teamId) {
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
  } catch (error) {
    console.error("[Assignment] Error resolving conversation:", error)
  }
}
