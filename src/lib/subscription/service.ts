// Serviço de gerenciamento de assinaturas SaaS

import { prisma } from '@/lib/prisma'
import { createAsaasClient } from '@/lib/asaas/client'
import type { AsaasCustomer, AsaasPayment } from '@/lib/asaas/types'

const ASAAS_API_KEY = process.env.ASAAS_API_KEY!
const ASAAS_ENVIRONMENT = (process.env.ASAAS_ENVIRONMENT || 'SANDBOX') as 'SANDBOX' | 'PRODUCTION'

/**
 * Serviço de Assinaturas
 */
export class SubscriptionService {
  /**
   * Cria ou atualiza o cliente do tenant no Asaas
   */
  async syncTenantAsCustomer(tenantId: string): Promise<string> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cnpj: true,
        asaasCustomerId: true,
      },
    })

    if (!tenant) {
      throw new Error('Tenant não encontrado')
    }

    const asaasClient = createAsaasClient(ASAAS_API_KEY, ASAAS_ENVIRONMENT)

    // Se já tem cliente no Asaas, retorna o ID
    if (tenant.asaasCustomerId) {
      return tenant.asaasCustomerId
    }

    // Criar cliente no Asaas
    const customerData: AsaasCustomer = {
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      cpfCnpj: tenant.cnpj?.replace(/\D/g, '') || '',
      externalReference: tenant.id,
    }

    const asaasCustomer = await asaasClient.createCustomer(customerData)

    // Atualizar tenant com ID do Asaas
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { asaasCustomerId: asaasCustomer.id },
    })

    return asaasCustomer.id!
  }

  /**
   * Cria uma nova assinatura para um tenant
   */
  async createSubscription(tenantId: string, planId: string, trialDays = 14) {
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    })

    if (!plan) {
      throw new Error('Plano não encontrado')
    }

    // Garantir que tenant tem cliente no Asaas
    await this.syncTenantAsCustomer(tenantId)

    const now = new Date()
    const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000)
    const currentPeriodEnd = new Date(trialEndsAt.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Criar assinatura
    const subscription = await prisma.subscription.create({
      data: {
        tenantId,
        planId,
        status: 'TRIAL',
        trialEndsAt,
        currentPeriodStart: now,
        currentPeriodEnd,
        nextBillingDate: trialEndsAt,
        billingCycle: 'MONTHLY',
      },
    })

    return subscription
  }

  /**
   * Gera uma cobrança mensal para uma assinatura
   */
  async createMonthlyCharge(subscriptionId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: true,
        tenant: true,
      },
    })

    if (!subscription) {
      throw new Error('Assinatura não encontrada')
    }

    if (!subscription.tenant.asaasCustomerId) {
      throw new Error('Tenant não tem cliente no Asaas')
    }

    const asaasClient = createAsaasClient(ASAAS_API_KEY, ASAAS_ENVIRONMENT)

    // Calcular período
    const periodStart = new Date(subscription.currentPeriodEnd)
    const periodEnd = new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000)
    const dueDate = new Date(periodStart.getTime() + 5 * 24 * 60 * 60 * 1000) // 5 dias após fim do período

    const amount = subscription.billingCycle === 'MONTHLY'
      ? subscription.plan.monthlyPrice
      : (subscription.plan.annualPrice || subscription.plan.monthlyPrice * 12) / 12

    // Criar cobrança no Asaas
    const paymentData: AsaasPayment = {
      customer: subscription.tenant.asaasCustomerId,
      billingType: 'BOLETO',
      value: amount,
      dueDate: dueDate.toISOString().split('T')[0],
      description: `${subscription.plan.name} - ${periodStart.toLocaleDateString('pt-BR')} a ${periodEnd.toLocaleDateString('pt-BR')}`,
      externalReference: subscriptionId,
    }

    const asaasPayment = await asaasClient.createPayment(paymentData)

    // Salvar no banco
    const payment = await prisma.subscriptionPayment.create({
      data: {
        subscriptionId,
        asaasPaymentId: asaasPayment.id,
        asaasInvoiceUrl: asaasPayment.invoiceUrl,
        asaasBankSlipUrl: asaasPayment.bankSlipUrl,
        amount,
        billingType: 'BOLETO',
        status: 'PENDING',
        periodStart,
        periodEnd,
        dueDate,
      },
    })

    // Atualizar assinatura
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        nextBillingDate: periodEnd,
        currentPeriodEnd: periodEnd,
      },
    })

    return payment
  }

  /**
   * Processa webhook de pagamento do Asaas
   */
  async processPaymentWebhook(asaasPaymentId: string, status: string, paidAt?: string) {
    const payment = await prisma.subscriptionPayment.findUnique({
      where: { asaasPaymentId },
      include: {
        subscription: true,
      },
    })

    if (!payment) {
      console.log('[Webhook] Pagamento não encontrado:', asaasPaymentId)
      return
    }

    // Mapear status
    let paymentStatus: 'PENDING' | 'PAID' | 'OVERDUE' | 'FAILED' = 'PENDING'
    if (['RECEIVED', 'CONFIRMED'].includes(status)) {
      paymentStatus = 'PAID'
    } else if (status === 'OVERDUE') {
      paymentStatus = 'OVERDUE'
    }

    // Atualizar pagamento
    await prisma.subscriptionPayment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus,
        paidAt: paidAt ? new Date(paidAt) : null,
        webhookReceivedAt: new Date(),
      },
    })

    // Se foi pago, atualizar assinatura
    if (paymentStatus === 'PAID') {
      await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: 'ACTIVE',
          currentPeriodStart: payment.periodStart,
          currentPeriodEnd: payment.periodEnd,
        },
      })
    }

    // Se venceu, marcar como PAST_DUE
    if (paymentStatus === 'OVERDUE') {
      await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: 'PAST_DUE',
        },
      })
    }
  }

  /**
   * Lista assinaturas com filtros
   */
  async listSubscriptions(filters?: {
    status?: string
    limit?: number
    offset?: number
  }) {
    return prisma.subscription.findMany({
      where: {
        status: filters?.status as any,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            email: true,
            active: true,
          },
        },
        plan: true,
        _count: {
          select: {
            payments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    })
  }

  /**
   * Cancela uma assinatura
   */
  async cancelSubscription(subscriptionId: string, reason?: string) {
    return prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
        cancelReason: reason,
      },
    })
  }
}

export const subscriptionService = new SubscriptionService()
