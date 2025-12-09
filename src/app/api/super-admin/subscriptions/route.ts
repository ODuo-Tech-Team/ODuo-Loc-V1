import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { subscriptionService } from '@/lib/subscription/service'

export async function GET() {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const subscriptions = await subscriptionService.listSubscriptions()

    return NextResponse.json(subscriptions)
  } catch (error) {
    console.error('Erro ao listar subscriptions:', error)
    return NextResponse.json(
      { error: 'Erro ao listar subscriptions' },
      { status: 500 }
    )
  }
}
