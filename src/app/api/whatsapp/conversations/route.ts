import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUazapiClient, normalizePhone } from "@/lib/whatsapp"

// GET - Listar conversas
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const leadId = searchParams.get("leadId")
    const customerId = searchParams.get("customerId")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Buscar instância do tenant
    const instance = await prisma.whatsAppInstance.findUnique({
      where: { tenantId: session.user.tenantId },
    })

    if (!instance) {
      return NextResponse.json({ conversations: [], total: 0 })
    }

    // Construir filtros
    const where: any = {
      instanceId: instance.id,
      tenantId: session.user.tenantId,
    }

    if (status && status !== "all") {
      where.status = status
    }

    if (search) {
      where.OR = [
        { contactPhone: { contains: search } },
        { contactName: { contains: search, mode: "insensitive" } },
      ]
    }

    if (leadId) {
      where.leadId = leadId
    }

    if (customerId) {
      where.customerId = customerId
    }

    // Buscar conversas
    const [conversations, total] = await Promise.all([
      prisma.whatsAppConversation.findMany({
        where,
        include: {
          lead: {
            select: { id: true, name: true, company: true, status: true },
          },
          customer: {
            select: { id: true, name: true, tradeName: true },
          },
          assignedTo: {
            select: { id: true, name: true },
          },
        },
        orderBy: { lastMessageAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.whatsAppConversation.count({ where }),
    ])

    return NextResponse.json({ conversations, total })
  } catch (error) {
    console.error("Erro ao buscar conversas:", error)
    return NextResponse.json(
      { error: "Erro ao buscar conversas" },
      { status: 500 }
    )
  }
}

// POST - Iniciar nova conversa
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { phone, message, leadId, customerId } = body

    if (!phone) {
      return NextResponse.json(
        { error: "Telefone é obrigatório" },
        { status: 400 }
      )
    }

    // Buscar instância
    const instance = await prisma.whatsAppInstance.findUnique({
      where: { tenantId: session.user.tenantId },
    })

    if (!instance || instance.status !== "CONNECTED") {
      return NextResponse.json(
        { error: "WhatsApp não conectado" },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizePhone(phone)

    // Verificar se já existe conversa com esse número
    let conversation = await prisma.whatsAppConversation.findFirst({
      where: {
        instanceId: instance.id,
        contactPhone: normalizedPhone,
      },
    })

    if (conversation) {
      // Reabrir se fechada
      if (conversation.status === "CLOSED") {
        await prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: { status: "OPEN" },
        })
      }
    } else {
      // Buscar nome do contato (Lead ou Customer)
      let contactName: string | undefined

      if (leadId) {
        const lead = await prisma.lead.findFirst({
          where: { id: leadId, tenantId: session.user.tenantId },
        })
        contactName = lead?.name
      } else if (customerId) {
        const customer = await prisma.customer.findFirst({
          where: { id: customerId, tenantId: session.user.tenantId },
        })
        contactName = customer?.name
      }

      // Criar nova conversa
      conversation = await prisma.whatsAppConversation.create({
        data: {
          instanceId: instance.id,
          tenantId: session.user.tenantId,
          contactPhone: normalizedPhone,
          contactName,
          status: "OPEN",
          isBot: false, // Iniciada manualmente
          leadId,
          customerId,
        },
      })
    }

    // Se tiver mensagem, enviar
    if (message) {
      const uazapi = getUazapiClient()
      const result = await uazapi.sendTextMessage(instance.instanceId, {
        phone: normalizedPhone,
        message,
      })

      if (result.success && result.messageId) {
        // Salvar mensagem enviada
        await prisma.whatsAppMessage.create({
          data: {
            externalId: result.messageId,
            conversationId: conversation.id,
            direction: "OUTBOUND",
            type: "TEXT",
            content: message,
            status: "SENT",
            sentAt: new Date(),
            sentByUserId: session.user.id,
          },
        })

        // Atualizar última mensagem
        await prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: {
            lastMessage: message.substring(0, 100),
            lastMessageAt: new Date(),
          },
        })
      }
    }

    return NextResponse.json({ conversation }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar conversa:", error)
    return NextResponse.json(
      { error: "Erro ao criar conversa" },
      { status: 500 }
    )
  }
}
