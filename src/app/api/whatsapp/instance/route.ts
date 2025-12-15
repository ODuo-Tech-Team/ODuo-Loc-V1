import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUazapiClient } from "@/lib/whatsapp"

// GET - Obter status da instância do tenant
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const instance = await prisma.whatsAppInstance.findUnique({
      where: { tenantId: session.user.tenantId },
      include: {
        botConfig: true,
      },
    })

    if (!instance) {
      return NextResponse.json({ instance: null })
    }

    // Se conectado, buscar status atualizado da API
    if (instance.status === "CONNECTED") {
      try {
        const uazapi = getUazapiClient()
        const status = await uazapi.getConnectionStatus(instance.instanceId)

        if (status.status !== "CONNECTED") {
          await prisma.whatsAppInstance.update({
            where: { id: instance.id },
            data: { status: status.status },
          })
          instance.status = status.status
        }
      } catch {
        // Falha ao verificar status, mantém o atual
      }
    }

    return NextResponse.json({ instance })
  } catch (error) {
    console.error("Erro ao buscar instância:", error)
    return NextResponse.json(
      { error: "Erro ao buscar instância" },
      { status: 500 }
    )
  }
}

// POST - Criar/Conectar instância
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar variáveis de ambiente da Uazapi
    if (!process.env.UAZAPI_BASE_URL || !process.env.UAZAPI_API_KEY) {
      console.error("[WhatsApp] Variáveis UAZAPI_BASE_URL ou UAZAPI_API_KEY não configuradas")
      return NextResponse.json(
        { error: "Integração WhatsApp não configurada. Adicione UAZAPI_BASE_URL e UAZAPI_API_KEY no .env" },
        { status: 500 }
      )
    }

    // Verificar se tenant tem permissão (plano com WhatsApp)
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 })
    }

    if (!tenant.subscription) {
      return NextResponse.json(
        { error: "Você não possui uma assinatura ativa" },
        { status: 403 }
      )
    }

    if (!tenant.subscription.plan?.whatsappEnabled) {
      return NextResponse.json(
        { error: "WhatsApp não habilitado no seu plano" },
        { status: 403 }
      )
    }

    // Verificar se já existe instância
    let instance = await prisma.whatsAppInstance.findUnique({
      where: { tenantId: session.user.tenantId },
    })

    const uazapi = getUazapiClient()

    if (!instance) {
      // Criar nova instância na Uazapi
      const instanceName = `oduo_${tenant.slug}_${Date.now()}`

      console.log(`[WhatsApp] Criando instância: ${instanceName}`)

      let created
      try {
        created = await uazapi.createInstance(instanceName)
      } catch (apiError: unknown) {
        const errorMessage = apiError instanceof Error ? apiError.message : String(apiError)
        console.error("[WhatsApp] Erro Uazapi:", errorMessage)

        // Verificar se é erro de autenticação
        if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
          return NextResponse.json(
            { error: "Chave de API Uazapi inválida. Verifique UAZAPI_API_KEY no .env" },
            { status: 500 }
          )
        }

        return NextResponse.json(
          { error: "Erro ao conectar com Uazapi: " + errorMessage },
          { status: 500 }
        )
      }

      if (!created.success) {
        return NextResponse.json(
          { error: "Erro ao criar instância no WhatsApp" },
          { status: 500 }
        )
      }

      // Configurar webhook
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook/uazapi`
      try {
        await uazapi.setWebhook(created.instance.id, webhookUrl)
      } catch {
        console.warn("[WhatsApp] Falha ao configurar webhook, continuando...")
      }

      // Salvar no banco
      instance = await prisma.whatsAppInstance.create({
        data: {
          tenantId: session.user.tenantId,
          instanceId: created.instance.id,
          instanceName: created.instance.name,
          status: "DISCONNECTED",
          webhookUrl,
        },
      })

      console.log(`[WhatsApp] Instância criada: ${instance.id}`)
    }

    // Conectar (gerar QR Code)
    let connectResult
    try {
      connectResult = await uazapi.connectInstance(instance.instanceId)
    } catch (connectError: unknown) {
      const errorMessage = connectError instanceof Error ? connectError.message : String(connectError)
      console.error("[WhatsApp] Erro ao conectar:", errorMessage)

      if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
        return NextResponse.json(
          { error: "Chave de API Uazapi inválida. Verifique UAZAPI_API_KEY no .env" },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { error: "Erro ao gerar QR Code: " + errorMessage },
        { status: 500 }
      )
    }

    // Atualizar status e QR
    await prisma.whatsAppInstance.update({
      where: { id: instance.id },
      data: {
        status: connectResult.status || "CONNECTING",
        qrCode: connectResult.qrcode || null,
      },
    })

    return NextResponse.json({
      success: true,
      instance: {
        ...instance,
        status: connectResult.status || "CONNECTING",
        qrCode: connectResult.qrcode,
      },
    })
  } catch (error) {
    console.error("Erro ao criar/conectar instância:", error)
    return NextResponse.json(
      { error: "Erro interno ao conectar WhatsApp" },
      { status: 500 }
    )
  }
}

// DELETE - Desconectar/Remover instância
export async function DELETE() {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const instance = await prisma.whatsAppInstance.findUnique({
      where: { tenantId: session.user.tenantId },
    })

    if (!instance) {
      return NextResponse.json(
        { error: "Nenhuma instância encontrada" },
        { status: 404 }
      )
    }

    // Desconectar na Uazapi
    const uazapi = getUazapiClient()
    try {
      await uazapi.disconnectInstance(instance.instanceId)
    } catch {
      // Ignora erro se já desconectado
    }

    // Atualizar status
    await prisma.whatsAppInstance.update({
      where: { id: instance.id },
      data: {
        status: "DISCONNECTED",
        qrCode: null,
        phoneNumber: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao desconectar instância:", error)
    return NextResponse.json(
      { error: "Erro ao desconectar WhatsApp" },
      { status: 500 }
    )
  }
}
