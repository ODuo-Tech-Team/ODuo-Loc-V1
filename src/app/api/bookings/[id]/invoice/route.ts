import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission, type Role } from '@/lib/permissions'
import { nfseService, requireNfseEnabled } from '@/lib/fiscal'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Buscar NFS-e de uma reserva
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: bookingId } = await params

    // Verificar se a reserva pertence ao tenant
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        tenantId: session.user.tenantId,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 })
    }

    // Buscar NFS-e da reserva
    const invoices = await prisma.invoice.findMany({
      where: {
        bookingId,
        tenantId: session.user.tenantId,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      invoices,
      hasActiveInvoice: invoices.some(i =>
        ['PENDING', 'PROCESSING', 'AUTHORIZED'].includes(i.status)
      ),
    })
  } catch (error) {
    console.error('Erro ao buscar NFS-e da reserva:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar NFS-e' },
      { status: 500 }
    )
  }
}

// POST - Gerar NFS-e para uma reserva
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

    const { id: bookingId } = await params

    // Verificar se NFS-e está habilitado
    try {
      await requireNfseEnabled(session.user.tenantId)
    } catch {
      return NextResponse.json(
        { error: 'NFS-e não está habilitada para sua conta' },
        { status: 403 }
      )
    }

    // Verificar se a reserva pertence ao tenant
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        tenantId: session.user.tenantId,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 })
    }

    // Verificar status da reserva
    if (!['CONFIRMED', 'COMPLETED'].includes(booking.status)) {
      return NextResponse.json(
        { error: 'Só é possível gerar NFS-e para reservas confirmadas ou concluídas' },
        { status: 400 }
      )
    }

    // Verificar se já existe NFS-e ativa
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        bookingId,
        tenantId: session.user.tenantId,
        status: { notIn: ['CANCELLED', 'REJECTED', 'ERROR'] },
      },
    })

    if (existingInvoice) {
      return NextResponse.json(
        {
          error: 'Já existe uma NFS-e ativa para esta reserva',
          invoice: existingInvoice,
        },
        { status: 409 }
      )
    }

    // Gerar NFS-e
    const body = await request.json().catch(() => ({}))
    const { sendEmail = true } = body

    const result = await nfseService.createFromBooking(
      bookingId,
      session.user.tenantId,
      { sendEmail }
    )

    // Log de atividade
    await prisma.activityLog.create({
      data: {
        action: 'CREATE',
        entity: 'INVOICE',
        entityId: result.invoice?.id,
        description: result.success
          ? `NFS-e gerada para reserva #${booking.bookingNumber}`
          : `Erro ao gerar NFS-e para reserva #${booking.bookingNumber}: ${result.error}`,
        metadata: {
          bookingId,
          bookingNumber: booking.bookingNumber,
          status: result.invoice?.status,
          error: result.error,
        },
        userId: session.user.id,
        tenantId: session.user.tenantId,
      },
    })

    if (result.success) {
      // Buscar invoice completo para retornar
      const invoice = await prisma.invoice.findUnique({
        where: { id: result.invoice!.id },
      })

      return NextResponse.json(
        { success: true, invoice },
        { status: 201 }
      )
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error('Erro ao gerar NFS-e:', error)

    const message = error instanceof Error ? error.message : 'Erro desconhecido'

    // Retornar 400 para erros de validação/configuração
    const isValidationError = message.includes('incompleta') ||
                              message.includes('obrigatório') ||
                              message.includes('inválido') ||
                              message.includes('não encontrada')

    return NextResponse.json(
      {
        error: message,
        details: error instanceof Error ? error.message : String(error)
      },
      { status: isValidationError ? 400 : 500 }
    )
  }
}
