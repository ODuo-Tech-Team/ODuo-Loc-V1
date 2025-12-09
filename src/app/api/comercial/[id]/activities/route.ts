import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Listar atividades do lead
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

    // Verificar se o lead existe e pertence ao tenant
    const lead = await prisma.lead.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!lead) {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      )
    }

    const activities = await prisma.leadActivity.findMany({
      where: {
        leadId: id,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(activities, { status: 200 })
  } catch (error) {
    console.error("Erro ao buscar atividades:", error)
    return NextResponse.json(
      { error: "Erro ao buscar atividades" },
      { status: 500 }
    )
  }
}

// POST - Criar atividade
export async function POST(
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
    const {
      type,
      description,
      photos,
      scheduledAt,
      completedAt,
      // Dados para atualizar o lead junto
      updateLeadStatus,
      nextAction,
      nextActionDate,
    } = body

    if (!type || !description) {
      return NextResponse.json(
        { error: "Campos obrigatórios: type, description" },
        { status: 400 }
      )
    }

    // Verificar se o lead existe e pertence ao tenant
    const lead = await prisma.lead.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!lead) {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      )
    }

    // Criar atividade
    const activity = await prisma.leadActivity.create({
      data: {
        type,
        description,
        photos: photos || [],
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        completedAt: completedAt ? new Date(completedAt) : new Date(),
        leadId: id,
        userId: session.user.id,
        tenantId: session.user.tenantId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Atualizar lead se necessário
    const leadUpdateData: any = {}

    if (updateLeadStatus) {
      leadUpdateData.status = updateLeadStatus
    }

    if (nextAction !== undefined) {
      leadUpdateData.nextAction = nextAction
    }

    if (nextActionDate !== undefined) {
      leadUpdateData.nextActionDate = nextActionDate ? new Date(nextActionDate) : null
    }

    if (Object.keys(leadUpdateData).length > 0) {
      await prisma.lead.update({
        where: { id },
        data: leadUpdateData,
      })
    }

    return NextResponse.json({ activity }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar atividade:", error)
    return NextResponse.json(
      { error: "Erro ao criar atividade" },
      { status: 500 }
    )
  }
}
