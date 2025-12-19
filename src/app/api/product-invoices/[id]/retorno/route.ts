// API Route: /api/product-invoices/[id]/retorno
// POST - Criar NF-e de retorno a partir de uma remessa

import { auth } from '@/lib/auth'
import { nfeService } from '@/lib/fiscal'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { equipmentIds } = body

    // Criar NF-e de retorno
    const result = await nfeService.createRetornoFromRemessa({
      remessaId: id,
      tenantId: session.user.tenantId,
      equipmentIds,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, focusNfeErrors: result.focusNfeErrors },
        { status: 400 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] Erro ao criar NF-e de retorno:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar nota fiscal de retorno' },
      { status: 500 }
    )
  }
}
