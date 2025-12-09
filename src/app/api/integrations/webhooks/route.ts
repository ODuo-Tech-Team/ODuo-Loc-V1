import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { auth } from "@/lib/auth"
import crypto from "crypto"

const prisma = new PrismaClient()

// Gerar secret para webhook
function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString("hex")}`
}

// Eventos disponíveis
export const WEBHOOK_EVENTS = [
  "booking.created",
  "booking.updated",
  "booking.cancelled",
  "booking.completed",
  "customer.created",
  "customer.updated",
  "customer.deleted",
  "equipment.created",
  "equipment.updated",
  "equipment.deleted",
]

// GET - Listar Webhooks do tenant
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const webhooks = await prisma.webhook.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(webhooks, { status: 200 })
  } catch (error) {
    console.error("Erro ao buscar Webhooks:", error)
    return NextResponse.json(
      { error: "Erro ao buscar Webhooks" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Criar novo Webhook
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, url, events } = body

    if (!name || !url) {
      return NextResponse.json(
        { error: "Nome e URL são obrigatórios" },
        { status: 400 }
      )
    }

    // Validar URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: "URL inválida" },
        { status: 400 }
      )
    }

    // Validar eventos
    const validEvents = events?.filter((e: string) => WEBHOOK_EVENTS.includes(e)) || []
    if (validEvents.length === 0) {
      return NextResponse.json(
        { error: "Selecione pelo menos um evento válido" },
        { status: 400 }
      )
    }

    // Gerar secret
    const secret = generateWebhookSecret()

    const webhook = await prisma.webhook.create({
      data: {
        name,
        url,
        events: validEvents,
        secret,
        tenantId: session.user.tenantId,
      },
    })

    return NextResponse.json(webhook, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar Webhook:", error)
    return NextResponse.json(
      { error: "Erro ao criar Webhook" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
