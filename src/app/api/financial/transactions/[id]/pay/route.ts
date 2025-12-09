import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TransactionStatus } from "@prisma/client"

// POST - Marcar transação como paga/recebida
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params

    // Verificar se a transação existe e pertence ao tenant
    const existing = await prisma.financialTransaction.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Transação não encontrada" },
        { status: 404 }
      )
    }

    if (existing.status === TransactionStatus.PAID) {
      return NextResponse.json(
        { error: "Transação já está marcada como paga" },
        { status: 400 }
      )
    }

    if (existing.status === TransactionStatus.CANCELLED) {
      return NextResponse.json(
        { error: "Não é possível marcar transação cancelada como paga" },
        { status: 400 }
      )
    }

    const transaction = await prisma.financialTransaction.update({
      where: { id },
      data: {
        status: TransactionStatus.PAID,
        paidAt: new Date(),
      },
      include: {
        category: true,
        equipment: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({
      transaction,
      message: existing.type === "INCOME"
        ? "Recebimento registrado com sucesso"
        : "Pagamento registrado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao registrar pagamento:", error)
    return NextResponse.json(
      { error: "Erro ao registrar pagamento" },
      { status: 500 }
    )
  }
}
