import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema de validação para atualizar time
const updateTeamSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  autoAssign: z.boolean().optional(),
  assignmentMode: z.enum(["round_robin", "least_busy", "manual"]).optional(),
})

// GET - Obter detalhes de um time
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

    const team = await prisma.whatsAppTeam.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        members: {
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
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: {
            conversations: true,
          },
        },
      },
    })

    if (!team) {
      return NextResponse.json(
        { error: "Time não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(team)
  } catch (error) {
    console.error("Erro ao buscar time:", error)
    return NextResponse.json(
      { error: "Erro ao buscar time" },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar time
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar permissão
    if (!["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(session.user.role || "")) {
      return NextResponse.json(
        { error: "Sem permissão para editar times" },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validation = updateTeamSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    // Verificar se time existe e pertence ao tenant
    const existingTeam = await prisma.whatsAppTeam.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existingTeam) {
      return NextResponse.json(
        { error: "Time não encontrado" },
        { status: 404 }
      )
    }

    // Se está mudando o nome, verificar se já existe
    if (validation.data.name && validation.data.name !== existingTeam.name) {
      const duplicateName = await prisma.whatsAppTeam.findUnique({
        where: {
          tenantId_name: {
            tenantId: session.user.tenantId,
            name: validation.data.name,
          },
        },
      })

      if (duplicateName) {
        return NextResponse.json(
          { error: "Já existe um time com esse nome" },
          { status: 400 }
        )
      }
    }

    const team = await prisma.whatsAppTeam.update({
      where: { id },
      data: validation.data,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(team)
  } catch (error) {
    console.error("Erro ao atualizar time:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar time" },
      { status: 500 }
    )
  }
}

// DELETE - Excluir time
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar permissão (apenas ADMIN)
    if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role || "")) {
      return NextResponse.json(
        { error: "Sem permissão para excluir times" },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verificar se time existe e pertence ao tenant
    const team = await prisma.whatsAppTeam.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: {
            conversations: true,
          },
        },
      },
    })

    if (!team) {
      return NextResponse.json(
        { error: "Time não encontrado" },
        { status: 404 }
      )
    }

    // Remover teamId das conversas antes de excluir
    await prisma.whatsAppConversation.updateMany({
      where: { teamId: id },
      data: { teamId: null },
    })

    // Excluir time (membros serão excluídos automaticamente pelo onDelete: Cascade)
    await prisma.whatsAppTeam.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir time:", error)
    return NextResponse.json(
      { error: "Erro ao excluir time" },
      { status: 500 }
    )
  }
}
