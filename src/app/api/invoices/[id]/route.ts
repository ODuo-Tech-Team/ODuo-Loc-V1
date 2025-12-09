import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission, type Role } from '@/lib/permissions'
import { nfseService } from '@/lib/fiscal'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Buscar detalhes de uma NFS-e
export async function GET(
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

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            startDate: true,
            endDate: true,
            totalPrice: true,
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'NFS-e não encontrada' }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Erro ao buscar NFS-e:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar NFS-e' },
      { status: 500 }
    )
  }
}

// DELETE - Cancelar uma NFS-e
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role as Role, 'DELETE_BOOKING')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { justificativa } = body

    if (!justificativa || justificativa.length < 15) {
      return NextResponse.json(
        { error: 'Justificativa deve ter no mínimo 15 caracteres' },
        { status: 400 }
      )
    }

    // Cancelar NFS-e
    await nfseService.cancel(id, session.user.tenantId, justificativa)

    // Log de atividade
    await prisma.activityLog.create({
      data: {
        action: 'DELETE',
        entity: 'INVOICE',
        entityId: id,
        description: `NFS-e cancelada: ${justificativa}`,
        metadata: {
          justificativa,
        },
        userId: session.user.id,
        tenantId: session.user.tenantId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao cancelar NFS-e:', error)

    const message = error instanceof Error ? error.message : 'Erro desconhecido'

    return NextResponse.json(
      { error: `Erro ao cancelar NFS-e: ${message}` },
      { status: 500 }
    )
  }
}
