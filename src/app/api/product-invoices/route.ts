// API Route: /api/product-invoices
// GET - Listar NF-e de produto do tenant
// POST - Criar NF-e de remessa

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { nfeService } from '@/lib/fiscal'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type') as 'REMESSA_LOCACAO' | 'RETORNO_LOCACAO' | null
    const bookingId = searchParams.get('bookingId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Construir filtros
    const where: any = {
      tenantId: session.user.tenantId,
    }

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    if (bookingId) {
      where.bookingId = bookingId
    }

    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { chaveAcesso: { contains: search, mode: 'insensitive' } },
        { destNome: { contains: search, mode: 'insensitive' } },
        { destCpfCnpj: { contains: search } },
      ]
    }

    // Buscar com paginação
    const [productInvoices, total] = await Promise.all([
      prisma.productInvoice.findMany({
        where,
        include: {
          booking: {
            select: {
              id: true,
              bookingNumber: true,
            }
          },
          items: {
            include: {
              equipment: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          },
          productInvoiceRef: {
            select: {
              id: true,
              numero: true,
              chaveAcesso: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.productInvoice.count({ where }),
    ])

    return NextResponse.json({
      productInvoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    })
  } catch (error) {
    console.error('[API] Erro ao listar NF-e:', error)
    return NextResponse.json(
      { error: 'Erro ao listar notas fiscais' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId, equipmentIds } = body

    if (!bookingId) {
      return NextResponse.json(
        { error: 'ID da reserva é obrigatório' },
        { status: 400 }
      )
    }

    // Criar NF-e de remessa
    const result = await nfeService.createRemessaFromBooking({
      bookingId,
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
    console.error('[API] Erro ao criar NF-e:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar nota fiscal' },
      { status: 500 }
    )
  }
}
