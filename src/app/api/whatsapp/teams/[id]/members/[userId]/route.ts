import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema de validação para atualizar membro
const updateMemberSchema = z.object({
  role: z.enum(["agent", "leader"]).optional(),
  isOnline: z.boolean().optional(),
})

// GET - Obter detalhes de um membro
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id, userId } = await params

    // Verificar se time existe e pertence ao tenant
    const team = await prisma.whatsAppTeam.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!team) {
      return NextResponse.json(
        { error: "Time não encontrado" },
        { status: 404 }
      )
    }

    const member = await prisma.whatsAppTeamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: id,
          userId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: "Membro não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(member)
  } catch (error) {
    console.error("Erro ao buscar membro:", error)
    return NextResponse.json(
      { error: "Erro ao buscar membro" },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar membro (role, isOnline)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id, userId } = await params
    const body = await request.json()
    const validation = updateMemberSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    // Verificar se time existe e pertence ao tenant
    const team = await prisma.whatsAppTeam.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!team) {
      return NextResponse.json(
        { error: "Time não encontrado" },
        { status: 404 }
      )
    }

    // Verificar permissão para alterar role (apenas ADMIN/MANAGER)
    // Mas qualquer usuário pode alterar seu próprio isOnline
    const isChangingRole = validation.data.role !== undefined
    const isChangingOwnOnline = validation.data.isOnline !== undefined && userId === session.user.id

    if (isChangingRole && !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(session.user.role || "")) {
      return NextResponse.json(
        { error: "Sem permissão para alterar papel do membro" },
        { status: 403 }
      )
    }

    const member = await prisma.whatsAppTeamMember.update({
      where: {
        teamId_userId: {
          teamId: id,
          userId,
        },
      },
      data: validation.data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json(member)
  } catch (error) {
    console.error("Erro ao atualizar membro:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar membro" },
      { status: 500 }
    )
  }
}

// DELETE - Remover membro do time
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar permissão
    if (!["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(session.user.role || "")) {
      return NextResponse.json(
        { error: "Sem permissão para remover membros" },
        { status: 403 }
      )
    }

    const { id, userId } = await params

    // Verificar se time existe e pertence ao tenant
    const team = await prisma.whatsAppTeam.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!team) {
      return NextResponse.json(
        { error: "Time não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se membro existe
    const member = await prisma.whatsAppTeamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: id,
          userId,
        },
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: "Membro não encontrado" },
        { status: 404 }
      )
    }

    // Remover atribuição de conversas do membro que está sendo removido
    // (opcional - pode querer manter as atribuições)
    // await prisma.whatsAppConversation.updateMany({
    //   where: { teamId: id, assignedToId: userId },
    //   data: { assignedToId: null },
    // })

    await prisma.whatsAppTeamMember.delete({
      where: {
        teamId_userId: {
          teamId: id,
          userId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao remover membro:", error)
    return NextResponse.json(
      { error: "Erro ao remover membro" },
      { status: 500 }
    )
  }
}
