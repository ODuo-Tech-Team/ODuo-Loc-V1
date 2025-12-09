import { NextRequest, NextResponse } from 'next/server'
import { subscriptionService } from '@/lib/subscription/service'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    console.log('[Webhook Asaas]', { event: payload.event, payment: payload.payment?.id })

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
