import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAsaasClient } from "@/lib/asaas/client"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { paymentId } = await params

    if (!paymentId) {
      return NextResponse.json(
        { error: "ID do pagamento é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se existe um registro de pagamento com esse ID
    const payment = await prisma.subscriptionPayment.findFirst({
      where: {
        asaasPaymentId: paymentId,
        subscription: {
          tenantId: session.user.tenantId,
        },
      },
      include: {
        subscription: {
          include: {
            plan: true,
            tenant: true,
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 }
      )
    }

    // Se já está pago, retornar
    if (payment.status === "PAID") {
      return NextResponse.json({
        status: "CONFIRMED",
        paidAt: payment.paidAt,
      })
    }

    // Buscar status atualizado no Asaas
    const asaasApiKey = process.env.ASAAS_API_KEY
    if (!asaasApiKey) {
      return NextResponse.json(
        { error: "Configuração de pagamento não encontrada" },
        { status: 500 }
      )
    }

    const asaas = createAsaasClient(
      asaasApiKey,
      process.env.ASAAS_ENVIRONMENT as 'SANDBOX' | 'PRODUCTION' || 'SANDBOX'
    )

    const asaasPayment = await asaas.getPayment(paymentId)

    // Se foi pago no Asaas, atualizar nosso banco
    if (asaasPayment.status === "RECEIVED" || asaasPayment.status === "CONFIRMED") {
      const now = new Date()

      // Atualizar o pagamento
      await prisma.subscriptionPayment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          paidAt: now,
          webhookReceivedAt: now,
        },
      })

      // Atualizar a assinatura
      await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: "ACTIVE",
          currentPeriodStart: payment.periodStart,
          currentPeriodEnd: payment.periodEnd,
        },
      })

      // Atualizar features do tenant baseado no plano
      if (payment.subscription.plan) {
        const plan = payment.subscription.plan
        await prisma.tenant.update({
          where: { id: payment.subscription.tenantId },
          data: {
            nfseEnabled: plan.nfseEnabled,
            stockEnabled: plan.stockEnabled,
            financialEnabled: plan.financialEnabled,
            reportsEnabled: plan.reportsEnabled,
            apiEnabled: plan.apiEnabled,
            webhooksEnabled: plan.webhooksEnabled,
            multiUserEnabled: plan.multiUserEnabled,
            customDomainsEnabled: plan.customDomainsEnabled,
          },
        })
      }

      return NextResponse.json({
        status: "CONFIRMED",
        paidAt: now,
      })
    }

    // Retornar status atual
    return NextResponse.json({
      status: asaasPayment.status,
      paidAt: null,
    })
  } catch (error) {
    console.error("Erro ao verificar status do pagamento:", error)
    return NextResponse.json(
      { error: "Erro ao verificar status do pagamento" },
      { status: 500 }
    )
  }
}
