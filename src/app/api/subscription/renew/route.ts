import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAsaasClient } from "@/lib/asaas/client"
import { z } from "zod"

const renewSchema = z.object({
  planId: z.string().min(1, "Plano é obrigatório"),
  billingCycle: z.enum(["MONTHLY", "ANNUAL"]),
  paymentMethod: z.enum(["CREDIT_CARD", "PIX"]),
  // CPF/CNPJ (obrigatório para PIX, usado também para Customer no Asaas)
  cpfCnpj: z.string().min(11).optional(),
  // Dados do cartão (obrigatórios se paymentMethod for CREDIT_CARD)
  creditCard: z.object({
    holderName: z.string().min(1),
    number: z.string().min(13).max(19),
    expiryMonth: z.string().length(2),
    expiryYear: z.string().length(4),
    ccv: z.string().min(3).max(4),
  }).optional(),
  // Dados do titular (aceita ambos os formatos)
  holderInfo: z.object({
    cpfCnpj: z.string().min(11),
    postalCode: z.string().min(8),
    addressNumber: z.string().min(1),
  }).optional(),
  creditCardHolderInfo: z.object({
    name: z.string().min(1),
    cpfCnpj: z.string().min(11),
    postalCode: z.string().min(8),
    addressNumber: z.string().min(1),
  }).optional(),
})

export async function POST(request: NextRequest) {
  console.log("[RENEW] ========== INÍCIO DA REQUISIÇÃO ==========")

  try {
    const session = await auth()
    console.log("[RENEW] Session:", JSON.stringify({
      userId: session?.user?.id,
      tenantId: session?.user?.tenantId,
      email: session?.user?.email
    }))

    if (!session?.user?.tenantId) {
      console.log("[RENEW] ERRO: Usuário não autorizado - sem tenantId")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    console.log("[RENEW] Body recebido:", JSON.stringify({
      planId: body.planId,
      billingCycle: body.billingCycle,
      paymentMethod: body.paymentMethod,
      hasCreditCard: !!body.creditCard,
      hasHolderInfo: !!body.holderInfo
    }))

    // Validação com Zod
    const parseResult = renewSchema.safeParse(body)
    if (!parseResult.success) {
      console.log("[RENEW] ERRO de validação Zod:", JSON.stringify(parseResult.error.issues))
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: parseResult.error.issues,
          received: {
            planId: body.planId,
            billingCycle: body.billingCycle,
            paymentMethod: body.paymentMethod
          }
        },
        { status: 400 }
      )
    }

    const data = parseResult.data
    console.log("[RENEW] Validação OK - paymentMethod:", data.paymentMethod)

    // Validar dados do cartão se for pagamento com cartão
    if (data.paymentMethod === "CREDIT_CARD") {
      if (!data.creditCard) {
        console.log("[RENEW] ERRO: Cartão obrigatório mas não fornecido")
        return NextResponse.json(
          { error: "Dados do cartão são obrigatórios" },
          { status: 400 }
        )
      }
      if (!data.holderInfo && !data.creditCardHolderInfo) {
        console.log("[RENEW] ERRO: Dados do titular obrigatórios mas não fornecidos")
        return NextResponse.json(
          { error: "Dados do titular são obrigatórios" },
          { status: 400 }
        )
      }
    }

    // Validar CPF/CNPJ se for PIX
    if (data.paymentMethod === "PIX" && !data.cpfCnpj) {
      console.log("[RENEW] ERRO: CPF/CNPJ obrigatório para PIX mas não fornecido")
      return NextResponse.json(
        { error: "CPF/CNPJ é obrigatório para pagamento PIX" },
        { status: 400 }
      )
    }

    // Unificar dados do titular (aceita ambos os formatos)
    const holderInfo = data.holderInfo || (data.creditCardHolderInfo ? {
      cpfCnpj: data.creditCardHolderInfo.cpfCnpj,
      postalCode: data.creditCardHolderInfo.postalCode,
      addressNumber: data.creditCardHolderInfo.addressNumber,
    } : null)

    // Buscar tenant, plano e usuário
    console.log("[RENEW] Buscando tenant, plano e usuário...")
    const [tenant, plan, user] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
        include: {
          subscription: true,
        },
      }),
      prisma.plan.findUnique({
        where: { id: data.planId },
      }),
      prisma.user.findFirst({
        where: { id: session.user.id },
      }),
    ])

    console.log("[RENEW] Resultados:", JSON.stringify({
      tenantFound: !!tenant,
      tenantName: tenant?.name,
      hasSubscription: !!tenant?.subscription,
      planFound: !!plan,
      planName: plan?.name,
      planPrice: plan?.monthlyPrice,
      userFound: !!user,
      userName: user?.name
    }))

    if (!tenant) {
      console.log("[RENEW] ERRO: Tenant não encontrado para ID:", session.user.tenantId)
      return NextResponse.json(
        { error: "Tenant não encontrado" },
        { status: 404 }
      )
    }

    if (!plan) {
      console.log("[RENEW] ERRO: Plano não encontrado para ID:", data.planId)
      return NextResponse.json(
        { error: "Plano não encontrado" },
        { status: 404 }
      )
    }

    // Calcular o valor
    const amount = data.billingCycle === "ANNUAL" && plan.annualPrice
      ? plan.annualPrice
      : plan.monthlyPrice
    console.log("[RENEW] Valor calculado:", amount)

    // CPF/CNPJ para usar no customer (prioriza os dados fornecidos)
    const customerCpfCnpj = data.cpfCnpj || holderInfo?.cpfCnpj || tenant.cnpj || "00000000000"
    console.log("[RENEW] CPF/CNPJ para customer:", customerCpfCnpj ? "fornecido" : "padrão")

    // Criar cliente Asaas
    const asaasApiKey = process.env.ASAAS_API_KEY
    console.log("[RENEW] ASAAS_API_KEY configurada:", !!asaasApiKey)
    console.log("[RENEW] ASAAS_ENVIRONMENT:", process.env.ASAAS_ENVIRONMENT)

    if (!asaasApiKey) {
      console.log("[RENEW] ERRO: ASAAS_API_KEY não configurada")
      return NextResponse.json(
        { error: "Configuração de pagamento não encontrada" },
        { status: 500 }
      )
    }

    const asaas = createAsaasClient(
      asaasApiKey,
      process.env.ASAAS_ENVIRONMENT as 'SANDBOX' | 'PRODUCTION' || 'SANDBOX'
    )

    // Se não tem customer no Asaas, criar
    let asaasCustomerId = tenant.asaasCustomerId
    console.log("[RENEW] AsaasCustomerId existente:", asaasCustomerId)

    if (!asaasCustomerId) {
      console.log("[RENEW] Criando novo customer no Asaas...")
      try {
        const customer = await asaas.createCustomer({
          name: user?.name || tenant.name,
          email: user?.email || tenant.email,
          phone: tenant.phone || undefined,
          cpfCnpj: customerCpfCnpj,
          externalReference: tenant.id,
        })
        console.log("[RENEW] Customer criado:", customer.id)

        asaasCustomerId = customer.id || null

        // Salvar no tenant (asaasCustomerId e CNPJ se não tiver)
        const updateData: { asaasCustomerId: string; cnpj?: string } = {
          asaasCustomerId: customer.id!,
        }
        if (!tenant.cnpj && (data.cpfCnpj || holderInfo?.cpfCnpj)) {
          updateData.cnpj = data.cpfCnpj || holderInfo?.cpfCnpj
        }
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: updateData,
        })
      } catch (customerError) {
        console.log("[RENEW] ERRO ao criar customer Asaas:", customerError)
        throw customerError
      }
    }

    if (!asaasCustomerId) {
      console.log("[RENEW] ERRO: Não foi possível obter asaasCustomerId")
      return NextResponse.json(
        { error: "Erro ao criar cliente no gateway de pagamento" },
        { status: 500 }
      )
    }

    // Data de vencimento (hoje para cartão, 3 dias para PIX)
    const dueDate = new Date()
    if (data.paymentMethod === "PIX") {
      dueDate.setDate(dueDate.getDate() + 3)
    }
    console.log("[RENEW] Data de vencimento:", dueDate.toISOString())

    // Criar cobrança no Asaas
    const paymentData: Parameters<typeof asaas.createPayment>[0] = {
      customer: asaasCustomerId,
      billingType: data.paymentMethod,
      value: amount,
      dueDate: dueDate.toISOString().split("T")[0],
      description: `Assinatura ${plan.name} - ${data.billingCycle === "ANNUAL" ? "Anual" : "Mensal"}`,
      externalReference: `sub_${tenant.id.slice(0, 36)}_${plan.id.slice(0, 20)}`,
    }

    // Adicionar dados do cartão se for pagamento com cartão
    if (data.paymentMethod === "CREDIT_CARD" && data.creditCard && holderInfo) {
      paymentData.creditCard = {
        holderName: data.creditCard.holderName,
        number: data.creditCard.number.replace(/\s/g, ""),
        expiryMonth: data.creditCard.expiryMonth,
        expiryYear: data.creditCard.expiryYear,
        ccv: data.creditCard.ccv,
      }
      paymentData.creditCardHolderInfo = {
        name: data.creditCard.holderName,
        email: user?.email || tenant.email,
        cpfCnpj: holderInfo.cpfCnpj.replace(/\D/g, ""),
        postalCode: holderInfo.postalCode.replace(/\D/g, ""),
        addressNumber: holderInfo.addressNumber,
        phone: tenant.phone || undefined,
      }
    }

    console.log("[RENEW] Criando pagamento no Asaas:", JSON.stringify({
      customer: asaasCustomerId,
      billingType: data.paymentMethod,
      value: amount,
      dueDate: paymentData.dueDate,
      hasCardData: !!paymentData.creditCard
    }))

    let payment
    try {
      payment = await asaas.createPayment(paymentData)
      console.log("[RENEW] Pagamento criado:", JSON.stringify({
        id: payment.id,
        status: payment.status,
        invoiceUrl: payment.invoiceUrl,
        pixCopyAndPaste: payment.pixCopyAndPaste ? "presente" : "ausente"
      }))
    } catch (paymentError) {
      console.log("[RENEW] ERRO ao criar pagamento Asaas:", paymentError)
      throw paymentError
    }

    // Calcular período da assinatura
    const now = new Date()
    const periodEnd = new Date(now)
    if (data.billingCycle === "ANNUAL") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    }

    // Se pagamento com cartão foi aprovado, ativar assinatura imediatamente
    const isApproved = payment.status === "CONFIRMED" || payment.status === "RECEIVED"

    // Atualizar ou criar subscription
    if (tenant.subscription) {
      await prisma.subscription.update({
        where: { id: tenant.subscription.id },
        data: {
          planId: plan.id,
          billingCycle: data.billingCycle,
          status: isApproved ? "ACTIVE" : tenant.subscription.status,
          currentPeriodStart: isApproved ? now : tenant.subscription.currentPeriodStart,
          currentPeriodEnd: isApproved ? periodEnd : tenant.subscription.currentPeriodEnd,
          nextBillingDate: isApproved ? periodEnd : tenant.subscription.nextBillingDate,
        },
      })

      // Criar registro de pagamento
      await prisma.subscriptionPayment.create({
        data: {
          subscriptionId: tenant.subscription.id,
          asaasPaymentId: payment.id,
          asaasInvoiceUrl: payment.invoiceUrl,
          amount,
          billingType: data.paymentMethod,
          status: isApproved ? "PAID" : "PENDING",
          periodStart: now,
          periodEnd,
          dueDate,
          paidAt: isApproved ? now : null,
        },
      })

      // Se aprovado, atualizar features do tenant baseado no plano
      if (isApproved) {
        await prisma.tenant.update({
          where: { id: tenant.id },
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
    }

    // Retornar resultado
    if (isApproved) {
      return NextResponse.json({
        success: true,
        status: "approved",
        message: "Pagamento aprovado! Sua assinatura foi ativada.",
      })
    } else if (data.paymentMethod === "PIX") {
      // Buscar QR Code do PIX
      let pixQrCode = null
      try {
        pixQrCode = await asaas.getPixQrCode(payment.id!)
        console.log("[RENEW] QR Code PIX obtido com sucesso")
      } catch (qrError) {
        console.log("[RENEW] Erro ao obter QR Code PIX:", qrError)
      }

      return NextResponse.json({
        success: true,
        status: "pending",
        paymentId: payment.id,
        paymentUrl: payment.invoiceUrl,
        qrCodeText: pixQrCode?.payload || payment.pixCopyAndPaste,
        qrCodeImage: pixQrCode?.encodedImage || null,
        expirationDate: pixQrCode?.expirationDate || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        message: "Cobrança PIX gerada. Complete o pagamento para ativar.",
      })
    } else {
      return NextResponse.json({
        success: false,
        status: "failed",
        message: "Pagamento não aprovado. Verifique os dados do cartão.",
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Erro ao processar renovação:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao processar renovação" },
      { status: 500 }
    )
  }
}
