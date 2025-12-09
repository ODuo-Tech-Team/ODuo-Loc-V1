import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission, type Role } from '@/lib/permissions'
import { nfseService } from '@/lib/fiscal'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST - Reenviar email com a NFS-e
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role as Role, 'EDIT_BOOKING')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { emails } = body // Array opcional de emails adicionais

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

    // Reenviar email
    await nfseService.sendInvoiceEmail(id, emails)

    // Log de atividade
    await prisma.activityLog.create({
      data: {
        action: 'UPDATE',
        entity: 'INVOICE',
        entityId: id,
        description: 'Email da NFS-e reenviado',
        metadata: {
          emails: emails || [invoice.tomadorEmail],
        },
        userId: session.user.id,
        tenantId: session.user.tenantId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Email reenviado com sucesso',
    })
  } catch (error) {
    console.error('Erro ao reenviar email:', error)

    const message = error instanceof Error ? error.message : 'Erro desconhecido'

    return NextResponse.json(
      { error: `Erro ao reenviar email: ${message}` },
      { status: 500 }
    )
  }
}
