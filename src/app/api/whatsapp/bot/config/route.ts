import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Obter configuração do bot
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Buscar instância do tenant
    const instance = await prisma.whatsAppInstance.findUnique({
      where: { tenantId: session.user.tenantId },
      include: {
        botConfig: true,
      },
    })

    if (!instance) {
      return NextResponse.json(
        { error: "WhatsApp não configurado" },
        { status: 404 }
      )
    }

    // Se não tem config, retornar defaults
    if (!instance.botConfig) {
      return NextResponse.json({
        config: {
          enabled: false,
          hasApiKey: false,
          openaiModel: "gpt-4o-mini",
          temperature: 0.7,
          maxTokens: 500,
          systemPrompt: null,
          includeEquipmentCatalog: true,
          includeRentalPrices: false,
          autoCreateLeads: true,
          transferKeywords: ["atendente", "humano", "pessoa", "falar com alguém"],
          businessHours: null,
          welcomeMessage: null,
          awayMessage: null,
          transferMessage: null,
          closingMessage: null,
        },
      })
    }

    // Não retornar a API key, apenas indicar se existe
    const { openaiApiKey, ...config } = instance.botConfig

    return NextResponse.json({
      config: {
        ...config,
        hasApiKey: !!openaiApiKey,
      },
    })
  } catch (error) {
    console.error("Erro ao buscar config do bot:", error)
    return NextResponse.json(
      { error: "Erro ao buscar configuração" },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar configuração do bot
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const {
      enabled,
      openaiApiKey,
      openaiModel,
      temperature,
      maxTokens,
      systemPrompt,
      includeEquipmentCatalog,
      includeRentalPrices,
      autoCreateLeads,
      transferKeywords,
      businessHours,
      welcomeMessage,
      awayMessage,
      transferMessage,
      closingMessage,
    } = body

    // Buscar instância
    const instance = await prisma.whatsAppInstance.findUnique({
      where: { tenantId: session.user.tenantId },
      include: { botConfig: true },
    })

    if (!instance) {
      return NextResponse.json(
        { error: "WhatsApp não configurado" },
        { status: 404 }
      )
    }

    // Se está habilitando o bot, verificar se tem API key
    if (enabled === true && !openaiApiKey && !instance.botConfig?.openaiApiKey) {
      return NextResponse.json(
        { error: "Chave da API OpenAI é obrigatória para habilitar o bot" },
        { status: 400 }
      )
    }

    // Validar API key se fornecida
    if (openaiApiKey) {
      const isValid = await validateOpenAIKey(openaiApiKey)
      if (!isValid) {
        return NextResponse.json(
          { error: "Chave da API OpenAI inválida" },
          { status: 400 }
        )
      }
    }

    // Preparar dados para atualização
    const updateData: any = {}

    if (enabled !== undefined) updateData.enabled = enabled
    if (openaiApiKey !== undefined) updateData.openaiApiKey = openaiApiKey
    if (openaiModel !== undefined) updateData.openaiModel = openaiModel
    if (temperature !== undefined) updateData.temperature = temperature
    if (maxTokens !== undefined) updateData.maxTokens = maxTokens
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt
    if (includeEquipmentCatalog !== undefined) updateData.includeEquipmentCatalog = includeEquipmentCatalog
    if (includeRentalPrices !== undefined) updateData.includeRentalPrices = includeRentalPrices
    if (autoCreateLeads !== undefined) updateData.autoCreateLeads = autoCreateLeads
    if (transferKeywords !== undefined) updateData.transferKeywords = transferKeywords
    if (businessHours !== undefined) updateData.businessHours = businessHours
    if (welcomeMessage !== undefined) updateData.welcomeMessage = welcomeMessage
    if (awayMessage !== undefined) updateData.awayMessage = awayMessage
    if (transferMessage !== undefined) updateData.transferMessage = transferMessage
    if (closingMessage !== undefined) updateData.closingMessage = closingMessage

    // Criar ou atualizar config
    let config
    if (instance.botConfig) {
      config = await prisma.whatsAppBotConfig.update({
        where: { id: instance.botConfig.id },
        data: updateData,
      })
    } else {
      config = await prisma.whatsAppBotConfig.create({
        data: {
          instanceId: instance.id,
          ...updateData,
        },
      })
    }

    // Retornar sem a API key
    const { openaiApiKey: _, ...configWithoutKey } = config

    return NextResponse.json({
      config: {
        ...configWithoutKey,
        hasApiKey: !!config.openaiApiKey,
      },
    })
  } catch (error) {
    console.error("Erro ao atualizar config do bot:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar configuração" },
      { status: 500 }
    )
  }
}

// Função para validar API key da OpenAI
async function validateOpenAIKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })
    return response.ok
  } catch {
    return false
  }
}
