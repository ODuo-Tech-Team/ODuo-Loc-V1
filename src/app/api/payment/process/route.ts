import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { SubscriptionService } from "@/lib/subscription/service"

const subscriptionService = new SubscriptionService()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { plan: planSlug, tenantId, amount, cardNumber, cardName, cardExpiry, cardCvv } = body

    // Validação básica
    if (!planSlug || !tenantId) {
      return NextResponse.json(
        { error: "Dados incompletos: plan e tenantId são obrigatórios" },
        { status: 400 }
      )
    }

    // Buscar o plano no banco de dados
    const plan = await prisma.plan.findUnique({
      where: { slug: planSlug },
    })

    if (!plan) {
      return NextResponse.json(
        { error: `Plano '${planSlug}' não encontrado` },
        { status: 404 }
      )
    }

    // Buscar o tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant não encontrado" },
        { status: 404 }
      )
    }

    console.log("Iniciando processo de assinatura:", {
      plan: plan.name,
      tenantId: tenant.id,
      tenantName: tenant.name,
      amount: plan.monthlyPrice,
    })

    // 1. Sincronizar tenant como customer no Asaas
    console.log("Sincronizando tenant como customer no Asaas...")
    const asaasCustomerId = await subscriptionService.syncTenantAsCustomer(tenantId)
    console.log("Tenant sincronizado com Asaas:", asaasCustomerId)

    // 2. Criar a subscription com trial de 14 dias
    console.log("Criando subscription com trial de 14 dias...")
    const subscription = await subscriptionService.createSubscription(
      tenantId,
      plan.id,
      14 // 14 dias de trial gratuito
    )
    console.log("Subscription criada:", subscription.id, "- Status:", subscription.status)

    // 3. Retornar sucesso (não cobramos agora pois está em trial)
    return NextResponse.json(
      {
        success: true,
        message: "Assinatura criada com sucesso! Você tem 14 dias grátis.",
        plan: plan.name,
        planSlug: plan.slug,
        tenantId: tenant.id,
        subscriptionId: subscription.id,
        trialEndsAt: subscription.trialEndsAt,
        nextBillingDate: subscription.nextBillingDate,
        status: subscription.status,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Erro ao processar assinatura:", error)

    // Retornar mensagem de erro mais detalhada
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"

    return NextResponse.json(
      {
        error: "Erro ao processar assinatura",
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
