import { NextRequest, NextResponse } from 'next/server'
import { subscriptionService } from '@/lib/subscription/service'
import crypto from 'crypto'

const ASAAS_WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_SECRET

/**
 * Valida o token de acesso do webhook Asaas usando comparação segura
 * para prevenir timing attacks
 */
function verifyAsaasWebhook(accessToken: string | null): boolean {
  if (!ASAAS_WEBHOOK_TOKEN) {
    console.warn('[Webhook Asaas] ASAAS_WEBHOOK_SECRET não configurado - webhook desprotegido!')
    // Em produção, retorna false se não houver token configurado
    if (process.env.NODE_ENV === 'production') {
      return false
    }
    // Em desenvolvimento, permite sem token para facilitar testes
    return true
  }

  if (!accessToken) {
    console.warn('[Webhook Asaas] Token de acesso não fornecido na requisição')
    return false
  }

  // Usa comparação segura para prevenir timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(accessToken),
      Buffer.from(ASAAS_WEBHOOK_TOKEN)
    )
  } catch {
    // Se os buffers tiverem tamanhos diferentes, timingSafeEqual lança erro
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validar token de autenticação do webhook
    const accessToken = request.headers.get('asaas-access-token')

    if (!verifyAsaasWebhook(accessToken)) {
      console.error('[Webhook Asaas] Falha na validação do token de acesso')
      return NextResponse.json(
        { error: 'Token de acesso inválido' },
        { status: 401 }
      )
    }

    const payload = await request.json()

    console.log('[Webhook Asaas]', {
      event: payload.event,
      payment: payload.payment?.id,
      validated: true
    })

    // Processar webhook de pagamento
    if (payload.payment?.id) {
      await subscriptionService.processPaymentWebhook(
        payload.payment.id,
        payload.payment.status,
        payload.payment.paymentDate
      )
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Webhook Asaas] Erro:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}
