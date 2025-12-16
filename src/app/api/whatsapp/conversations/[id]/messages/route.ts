import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUazapiClient } from "@/lib/whatsapp"

// GET - Listar mensagens de uma conversa
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
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const before = searchParams.get("before") // cursor para paginação

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

    // Buscar mensagens
    const messages = await prisma.whatsAppMessage.findMany({
      where: {
        conversationId: id,
        ...(before && {
          createdAt: { lt: new Date(before) },
        }),
      },
      include: {
        sentByUser: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    // Reverter ordem para exibição (mais antigas primeiro)
    messages.reverse()

    // Marcar mensagens como lidas
    await prisma.whatsAppConversation.update({
      where: { id },
      data: { unreadCount: 0 },
    })

    return NextResponse.json({
      messages,
      hasMore: messages.length === limit,
    })
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error)
    return NextResponse.json(
      { error: "Erro ao buscar mensagens" },
      { status: 500 }
    )
  }
}

// POST - Enviar mensagem
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
    const { type = "text", content, mediaUrl, fileName, latitude, longitude, quotedMessageId } = body

    if (!content && !mediaUrl && type !== "location") {
      return NextResponse.json(
        { error: "Conteúdo da mensagem é obrigatório" },
        { status: 400 }
      )
    }

    // Buscar conversa com instância
    const conversation = await prisma.whatsAppConversation.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        instance: true,
      },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversa não encontrada" },
        { status: 404 }
      )
    }

    if (conversation.instance.status !== "CONNECTED") {
      return NextResponse.json(
        { error: "WhatsApp não conectado" },
        { status: 400 }
      )
    }

    // Verificar se tem apiToken
    if (!conversation.instance.apiToken) {
      return NextResponse.json(
        { error: "Token da instância não configurado" },
        { status: 400 }
      )
    }

    const uazapi = getUazapiClient()
    const instanceToken = conversation.instance.apiToken
    let result: any

    // Enviar mensagem baseado no tipo (agora usando apiToken)
    switch (type) {
      case "text":
        result = await uazapi.sendTextMessage(instanceToken, {
          phone: conversation.contactPhone,
          message: content,
          quotedMessageId,
        })
        break

      case "image":
        result = await uazapi.sendImage(instanceToken, {
          phone: conversation.contactPhone,
          media: mediaUrl,
          caption: content,
          quotedMessageId,
        })
        break

      case "video":
        result = await uazapi.sendVideo(instanceToken, {
          phone: conversation.contactPhone,
          media: mediaUrl,
          caption: content,
          quotedMessageId,
        })
        break

      case "audio":
        result = await uazapi.sendAudio(instanceToken, {
          phone: conversation.contactPhone,
          media: mediaUrl,
          quotedMessageId,
        })
        break

      case "document":
        result = await uazapi.sendDocument(instanceToken, {
          phone: conversation.contactPhone,
          media: mediaUrl,
          fileName: fileName || "document",
          caption: content,
          quotedMessageId,
        })
        break

      case "location":
        if (!latitude || !longitude) {
          return NextResponse.json(
            { error: "Latitude e longitude são obrigatórios" },
            { status: 400 }
          )
        }
        result = await uazapi.sendLocation(instanceToken, {
          phone: conversation.contactPhone,
          latitude,
          longitude,
          name: content,
        })
        break

      default:
        return NextResponse.json(
          { error: "Tipo de mensagem inválido" },
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Erro ao enviar mensagem" },
        { status: 500 }
      )
    }

    // Salvar mensagem no banco
    const message = await prisma.whatsAppMessage.create({
      data: {
        externalId: result.messageId,
        conversationId: id,
        direction: "OUTBOUND",
        type: type.toUpperCase() as any,
        content,
        mediaUrl,
        mediaFileName: fileName,
        quotedMessageId,
        status: "SENT",
        sentAt: new Date(),
        sentByUserId: session.user.id,
        metadata: type === "location" ? { latitude, longitude } : undefined,
      },
      include: {
        sentByUser: {
          select: { id: true, name: true },
        },
      },
    })

    // Atualizar última mensagem da conversa
    await prisma.whatsAppConversation.update({
      where: { id },
      data: {
        lastMessage: content?.substring(0, 100) || `[${type}]`,
        lastMessageAt: new Date(),
      },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error)
    return NextResponse.json(
      { error: "Erro ao enviar mensagem" },
      { status: 500 }
    )
  }
}
