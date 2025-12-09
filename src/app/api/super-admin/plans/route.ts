import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/super-admin/plans
 * Lista todos os planos disponíveis
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const plans = await prisma.plan.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    })

    return NextResponse.json(plans)
  } catch (error) {
    console.error('Erro ao listar planos:', error)
    return NextResponse.json(
      { error: 'Erro ao listar planos' },
      { status: 500 }
    )
  }
}
