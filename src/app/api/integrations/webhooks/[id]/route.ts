import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { auth } from "@/lib/auth"
import { WEBHOOK_EVENTS } from "../route"

const prisma = new PrismaClient()

// GET - Buscar webhook específico
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

    const webhook = await prisma.webhook.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!webhook) {
      return NextResponse.json(
        { error: "Webhook não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(webhook, { status: 200 })
  } catch (error) {
    console.error("Erro ao buscar Webhook:", error)
    return NextResponse.json(
      { error: "Erro ao buscar Webhook" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Atualizar webhook
export async function PUT(
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
    const { name, url, events, active } = body

    // Validar URL se fornecida
    if (url) {
      try {
        new URL(url)
      } catch {
        return NextResponse.json(
          { error: "URL inválida" },
          { status: 400 }
        )
      }
    }

    // Validar eventos se fornecidos
    let validEvents
    if (events) {
      validEvents = events.filter((e: string) => WEBHOOK_EVENTS.includes(e))
      if (validEvents.length === 0) {
        return NextResponse.json(
          { error: "Selecione pelo menos um evento válido" },
          { status: 400 }
        )
      }
    }

    const result = await prisma.webhook.updateMany({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      data: {
        ...(name && { name }),
        ...(url && { url }),
        ...(validEvents && { events: validEvents }),
        ...(active !== undefined && { active }),
      },
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Webhook não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Erro ao atualizar Webhook:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar Webhook" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Deletar webhook
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params

    const result = await prisma.webhook.deleteMany({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Webhook não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Erro ao deletar Webhook:", error)
    return NextResponse.json(
      { error: "Erro ao deletar Webhook" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
