import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUazapiClient, normalizeInstanceStatus } from "@/lib/whatsapp"

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

      console.log(`[WhatsApp] Resposta da API:`, JSON.stringify(created, null, 2))

      if (!created.success && !created.instance) {
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

      // Salvar no banco (incluindo o token da instância)
      instance = await prisma.whatsAppInstance.create({
        data: {
          tenantId: session.user.tenantId,
          instanceId: created.instance.id,
          instanceName: created.instance.name,
          apiToken: created.instance.token, // Token para operações da instância
          status: "DISCONNECTED",
          webhookUrl,
        },
      })

      console.log(`[WhatsApp] Instância criada: ${instance.id}, token salvo: ${created.instance.token ? "Sim" : "Não"}`)
    }

    // Conectar (gerar QR Code) - usa o token da instância
    if (!instance.apiToken) {
      return NextResponse.json(
        { error: "Token da instância não encontrado. Recrie a conexão." },
        { status: 500 }
      )
    }

    let connectResult
    try {
      connectResult = await uazapi.connectInstance(instance.apiToken)
      console.log("[WhatsApp] Connect result (1):", JSON.stringify(connectResult, null, 2))

      // Se não retornou QR code, aguardar e tentar novamente
      // A Uazapi pode precisar de tempo para gerar o QR após criar a instância
      if (!connectResult.qrcode && connectResult.status !== "CONNECTED") {
        console.log("[WhatsApp] QR vazio, aguardando 3s e tentando novamente...")
        await new Promise(resolve => setTimeout(resolve, 3000))
        connectResult = await uazapi.connectInstance(instance.apiToken)
        console.log("[WhatsApp] Connect result (2):", JSON.stringify(connectResult, null, 2))
      }
    } catch (connectError: unknown) {
      const errorMessage = connectError instanceof Error ? connectError.message : String(connectError)
      console.error("[WhatsApp] Erro ao conectar:", errorMessage)

      if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
        return NextResponse.json(
          { error: "Token da instância inválido. Recrie a conexão." },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { error: "Erro ao gerar QR Code: " + errorMessage },
        { status: 500 }
      )
    }

    // Quando o usuário clica em conectar, sempre marcamos como CONNECTING
    // para que o frontend mostre o QR code e inicie o polling
    // O status real (CONNECTED/DISCONNECTED) será atualizado via polling ou webhook
    const statusToSave = connectResult.qrcode ? "CONNECTING" : "CONNECTING"

    // Atualizar status e QR
    await prisma.whatsAppInstance.update({
      where: { id: instance.id },
      data: {
        status: statusToSave,
        qrCode: connectResult.qrcode || null,
      },
    })

    console.log(`[WhatsApp] Connect result - status: ${connectResult.status}, qrcode: ${connectResult.qrcode ? "Sim" : "Não"}`)

    return NextResponse.json({
      success: true,
      instance: {
        ...instance,
        status: statusToSave,
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
