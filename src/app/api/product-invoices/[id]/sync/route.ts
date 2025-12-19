// API Route: /api/product-invoices/[id]/sync
// POST - Sincronizar status da NF-e com SEFAZ

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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

    // Buscar status anterior
    const invoice = await prisma.productInvoice.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      select: { status: true }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'NF-e não encontrada' },
        { status: 404 }
      )
    }

    const previousStatus = invoice.status

    // Sincronizar
    const newStatus = await nfeService.syncStatus(id, session.user.tenantId)

    // Buscar dados atualizados
    const updatedInvoice = await prisma.productInvoice.findUnique({
      where: { id },
      include: {
        items: true,
      }
    })

    return NextResponse.json({
      success: true,
      previousStatus,
      currentStatus: newStatus,
      productInvoice: updatedInvoice,
    })
  } catch (error) {
    console.error('[API] Erro ao sincronizar NF-e:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao sincronizar nota fiscal' },
      { status: 500 }
    )
  }
}
