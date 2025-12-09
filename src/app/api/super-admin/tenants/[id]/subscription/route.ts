import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/super-admin/tenants/[id]/subscription
 * Busca a subscription de um tenant
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const session = await auth()

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: id },
      include: {
        plan: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription não encontrada' }, { status: 404 })
    }

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Erro ao buscar subscription:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar subscription' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/super-admin/tenants/[id]/subscription
 * Cria uma nova subscription para o tenant
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const session = await auth()

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { planId, billingCycle = 'MONTHLY' } = body

    if (!planId) {
      return NextResponse.json({ error: 'Plano é obrigatório' }, { status: 400 })
    }

    // Validar que o plano existe
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    if (!plan.active) {
      return NextResponse.json({ error: 'Plano não está ativo' }, { status: 400 })
    }

    // Verificar se já existe uma subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { tenantId: id },
    })

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'Tenant já possui subscription' },
        { status: 400 }
      )
    }

    // Calcular datas
    const now = new Date()
    const currentPeriodStart = now
    const currentPeriodEnd = new Date(now)
    if (billingCycle === 'MONTHLY') {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
    } else {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)
    }

    // Criar subscription
    const newSubscription = await prisma.subscription.create({
      data: {
        tenantId: id,
        planId,
        status: 'ACTIVE',
        billingCycle,
        startDate: now,
        currentPeriodStart,
        currentPeriodEnd,
        nextBillingDate: currentPeriodEnd,
      },
      include: {
        plan: true,
      },
    })

    return NextResponse.json(newSubscription, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar subscription:', error)
    return NextResponse.json(
      { error: 'Erro ao criar subscription' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/super-admin/tenants/[id]/subscription
 * Atualiza o plano de um tenant
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const session = await auth()

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { planId, status, billingCycle } = body

    // Validar que o plano existe
    if (planId) {
      const plan = await prisma.plan.findUnique({
        where: { id: planId },
      })

      if (!plan) {
        return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
      }

      if (!plan.active) {
        return NextResponse.json({ error: 'Plano não está ativo' }, { status: 400 })
      }
    }

    // Buscar subscription existente
    const existingSubscription = await prisma.subscription.findUnique({
      where: { tenantId: id },
    })

    if (!existingSubscription) {
      return NextResponse.json(
        { error: 'Tenant não possui subscription' },
        { status: 404 }
      )
    }

    // Atualizar subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { tenantId: id },
      data: {
        ...(planId && { planId }),
        ...(status && { status }),
        ...(billingCycle && { billingCycle }),
        updatedAt: new Date(),
      },
      include: {
        plan: true,
      },
    })

    return NextResponse.json(updatedSubscription)
  } catch (error) {
    console.error('Erro ao atualizar subscription:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar subscription' },
      { status: 500 }
    )
  }
}
