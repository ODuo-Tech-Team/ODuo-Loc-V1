import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUazapiClient } from "@/lib/whatsapp"

// GET - Ver configuração atual do webhook
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const instance = await prisma.whatsAppInstance.findUnique({
      where: { tenantId: session.user.tenantId },
      select: {
        id: true,
        instanceId: true,
        webhookUrl: true,
        status: true,
      },
    })

    if (!instance) {
      return NextResponse.json({ error: "Instância não encontrada" }, { status: 404 })
    }

    return NextResponse.json({
      webhookUrl: instance.webhookUrl,
      expectedUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook/uazapi`,
      status: instance.status,
    })
  } catch (error) {
    console.error("Erro ao buscar webhook:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// POST - Reconfigurar webhook na Uazapi
export async function POST() {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const instance = await prisma.whatsAppInstance.findUnique({
      where: { tenantId: session.user.tenantId },
    })

    if (!instance) {
      return NextResponse.json({ error: "Instância não encontrada" }, { status: 404 })
    }

    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook/uazapi`

    console.log("[Webhook Config] Configurando webhook:")
    console.log("[Webhook Config] Instance ID:", instance.instanceId)
    console.log("[Webhook Config] URL:", webhookUrl)

    const uazapi = getUazapiClient()

    try {
      await uazapi.setWebhook(instance.instanceId, webhookUrl, [
        "messages.upsert",
        "messages.update",
        "connection.update",
        "qr.update",
      ])

      // Atualizar URL no banco
      await prisma.whatsAppInstance.update({
        where: { id: instance.id },
        data: { webhookUrl },
      })

      console.log("[Webhook Config] Webhook configurado com sucesso!")

      return NextResponse.json({
        success: true,
        webhookUrl,
        message: "Webhook configurado com sucesso",
      })
    } catch (apiError: unknown) {
      const errorMessage = apiError instanceof Error ? apiError.message : String(apiError)
      console.error("[Webhook Config] Erro ao configurar:", errorMessage)

      return NextResponse.json({
        success: false,
        error: errorMessage,
        webhookUrl,
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Erro ao configurar webhook:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
