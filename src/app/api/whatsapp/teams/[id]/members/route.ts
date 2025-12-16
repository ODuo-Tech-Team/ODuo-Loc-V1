import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema de validação para adicionar membro
const addMemberSchema = z.object({
  userId: z.string().min(1, "ID do usuário é obrigatório"),
  role: z.enum(["agent", "leader"]).optional().default("agent"),
})

// GET - Listar membros de um time
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

    const members = await prisma.whatsAppTeamMember.findMany({
      where: { teamId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
            active: true,
          },
        },
      },
      orderBy: [
        { role: "asc" }, // leaders primeiro
        { createdAt: "asc" },
      ],
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error("Erro ao listar membros:", error)
    return NextResponse.json(
      { error: "Erro ao listar membros" },
      { status: 500 }
    )
  }
}

// POST - Adicionar membro ao time
export async function POST(
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
        { error: "Sem permissão para adicionar membros" },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validation = addMemberSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { userId, role } = validation.data

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

    // Verificar se usuário existe e pertence ao mesmo tenant
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
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

    // Verificar se usuário já é membro do time
    const existingMember = await prisma.whatsAppTeamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: id,
          userId,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: "Usuário já é membro deste time" },
        { status: 400 }
      )
    }

    const member = await prisma.whatsAppTeamMember.create({
      data: {
        teamId: id,
        userId,
        role,
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

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error("Erro ao adicionar membro:", error)
    return NextResponse.json(
      { error: "Erro ao adicionar membro" },
      { status: 500 }
    )
  }
}
