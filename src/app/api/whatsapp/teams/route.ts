import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema de validação para criar time
const createTeamSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  color: z.string().optional(),
  autoAssign: z.boolean().optional().default(true),
  assignmentMode: z.enum(["round_robin", "least_busy", "manual"]).optional().default("round_robin"),
})

// GET - Listar todos os times do tenant
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const teams = await prisma.whatsAppTeam.findMany({
      where: { tenantId: session.user.tenantId },
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
        _count: {
          select: {
            conversations: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(teams)
  } catch (error) {
    console.error("Erro ao listar times:", error)
    return NextResponse.json(
      { error: "Erro ao listar times" },
      { status: 500 }
    )
  }
}

// POST - Criar novo time
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar permissão (apenas ADMIN e MANAGER)
    if (!["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(session.user.role || "")) {
      return NextResponse.json(
        { error: "Sem permissão para criar times" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = createTeamSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { name, description, color, autoAssign, assignmentMode } = validation.data

    // Verificar se já existe time com mesmo nome
    const existingTeam = await prisma.whatsAppTeam.findUnique({
      where: {
        tenantId_name: {
          tenantId: session.user.tenantId,
          name,
        },
      },
    })

    if (existingTeam) {
      return NextResponse.json(
        { error: "Já existe um time com esse nome" },
        { status: 400 }
      )
    }

    const team = await prisma.whatsAppTeam.create({
      data: {
        tenantId: session.user.tenantId,
        name,
        description,
        color,
        autoAssign,
        assignmentMode,
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
              },
            },
          },
        },
      },
    })

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar time:", error)
    return NextResponse.json(
      { error: "Erro ao criar time" },
      { status: 500 }
    )
  }
}
