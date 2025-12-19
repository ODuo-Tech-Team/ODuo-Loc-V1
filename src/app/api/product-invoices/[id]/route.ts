// API Route: /api/product-invoices/[id]
// GET - Detalhes de uma NF-e
// DELETE - Cancelar NF-e

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { nfeService } from '@/lib/fiscal'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    const productInvoice = await prisma.productInvoice.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            customer: {
              select: {
                id: true,
                name: true,
                cpfCnpj: true,
              }
            }
          }
        },
        items: {
          include: {
            equipment: {
              select: {
                id: true,
                name: true,
                ncm: true,
              }
            }
          }
        },
        productInvoiceRef: {
          select: {
            id: true,
            numero: true,
            chaveAcesso: true,
            naturezaOperacao: true,
          }
        },
        productInvoicesRefs: {
          select: {
            id: true,
            numero: true,
            chaveAcesso: true,
            naturezaOperacao: true,
            status: true,
          }
        }
      }
    })

    if (!productInvoice) {
      return NextResponse.json(
        { error: 'NF-e não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(productInvoice)
  } catch (error) {
    console.error('[API] Erro ao buscar NF-e:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar nota fiscal' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
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

    await nfeService.cancel(id, session.user.tenantId, justificativa)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Erro ao cancelar NF-e:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao cancelar nota fiscal' },
      { status: 500 }
    )
  }
}
