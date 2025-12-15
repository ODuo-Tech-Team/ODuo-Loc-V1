import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission, type Role } from '@/lib/permissions'
import { nfseService, requireNfseEnabled } from '@/lib/fiscal'
import { sendEmail, emailTemplates, EMAIL_FROM } from '@/lib/email'

// GET - Listar NFS-e do tenant
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role as Role, 'VIEW_REPORTS')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)

    // Filtros
    const status = searchParams.get('status')
    const bookingId = searchParams.get('bookingId')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Paginação
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Construir filtro
    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId,
    }

    if (status) {
      where.status = status
    }

    if (bookingId) {
      where.bookingId = bookingId
    }

    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { tomadorNome: { contains: search, mode: 'insensitive' } },
        { tomadorCpfCnpj: { contains: search } },
        { booking: { bookingNumber: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        ;(where.createdAt as Record<string, Date>).lte = end
      }
    }

    // Buscar invoices
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          booking: {
            select: {
              id: true,
              bookingNumber: true,
              startDate: true,
              endDate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ])

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Erro ao listar NFS-e:', error)
    return NextResponse.json(
      { error: 'Erro ao listar NFS-e' },
      { status: 500 }
    )
  }
}

// POST - Criar NFS-e a partir de uma reserva
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role as Role, 'EDIT_BOOKING')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Verificar se NFS-e está habilitado
    try {
      await requireNfseEnabled(session.user.tenantId)
    } catch {
      return NextResponse.json(
        { error: 'NFS-e não está habilitada para sua conta' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { bookingId, sendEmail = true } = body

    if (!bookingId) {
      return NextResponse.json(
        { error: 'ID da reserva é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se já existe NFS-e para esta reserva
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
          invoiceId: existingInvoice.id,
        },
        { status: 409 }
      )
    }

    // Gerar NFS-e
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
          ? `NFS-e gerada para reserva`
          : `Erro ao gerar NFS-e: ${result.error}`,
        metadata: {
          bookingId,
          status: result.invoice?.status,
          error: result.error,
        },
        userId: session.user.id,
        tenantId: session.user.tenantId,
      },
    })

    if (result.success && result.invoice && sendEmail) {
      // Enviar e-mail de NFS-e emitida para o cliente
      try {
        // Buscar invoice completa com todos os dados
        const invoice = await prisma.invoice.findUnique({
          where: { id: result.invoice.id },
        })

        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: {
            customer: {
              select: { name: true, email: true },
            },
            tenant: {
              select: { name: true },
            },
            items: {
              include: {
                equipment: {
                  select: { name: true },
                },
              },
            },
            equipment: {
              select: { name: true },
            },
          },
        })

        if (booking?.customer.email && invoice?.numero) {
          // Formatar nomes dos equipamentos
          const equipmentNames = booking.items.length > 0
            ? booking.items.map(item => item.equipment.name).join(", ")
            : booking.equipment?.name || "Locação de Equipamento"

          // Formatar data para pt-BR
          const formatDate = (date: Date) => date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })

          const emailContent = emailTemplates.invoiceIssued({
            customerName: booking.customer.name,
            invoiceNumber: invoice.numero,
            bookingId: booking.id,
            equipmentName: equipmentNames,
            amount: invoice.valorTotal || booking.totalPrice,
            issueDate: formatDate(invoice.createdAt),
            tenantName: booking.tenant.name,
            verificationUrl: invoice.codigoVerificacao
              ? `https://nfse.focusnfe.com.br/${invoice.numero}/${invoice.codigoVerificacao}`
              : undefined,
          })

          await sendEmail({
            to: booking.customer.email,
            subject: emailContent.subject,
            html: emailContent.html,
            from: EMAIL_FROM.DOCUMENTOS,
          })

          console.log(`[NFSE] E-mail de NFS-e enviado para ${booking.customer.email}`)
        }
      } catch (emailError) {
        console.error('[NFSE] Erro ao enviar e-mail de NFS-e:', emailError)
        // Não falha a operação principal se o e-mail falhar
      }

      return NextResponse.json(result, { status: 201 })
    } else if (result.success) {
      return NextResponse.json(result, { status: 201 })
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error('Erro ao criar NFS-e:', error)

    const message = error instanceof Error ? error.message : 'Erro desconhecido'

    return NextResponse.json(
      { error: `Erro ao criar NFS-e: ${message}` },
      { status: 500 }
    )
  }
}
