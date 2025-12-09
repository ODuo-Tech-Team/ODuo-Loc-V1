import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission, type Role } from '@/lib/permissions'
import { nfseService } from '@/lib/fiscal'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST - Sincronizar status da NFS-e com Focus NFe
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role as Role, 'VIEW_REPORTS')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { id } = await params

    // Verificar se a NFS-e pertence ao tenant
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'NFS-e não encontrada' }, { status: 404 })
    }

    // Sincronizar status
    const newStatus = await nfseService.syncStatus(id, session.user.tenantId)

    // Buscar invoice atualizado
    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        booking: {
          select: {
            id: true,
            bookingNumber: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      previousStatus: invoice.status,
      currentStatus: newStatus,
      invoice: updatedInvoice,
    })
  } catch (error) {
    console.error('Erro ao sincronizar NFS-e:', error)

    const message = error instanceof Error ? error.message : 'Erro desconhecido'

    return NextResponse.json(
      { error: `Erro ao sincronizar: ${message}` },
      { status: 500 }
    )
  }
}
