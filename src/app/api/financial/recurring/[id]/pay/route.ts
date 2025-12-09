import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { RecurrenceStatus, TransactionStatus } from "@prisma/client"

// POST - Criar transação da recorrência já marcada como paga
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

    // Verificar se a recorrência existe e pertence ao tenant
    const recurring = await prisma.recurringTransaction.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        category: true,
      },
    })

    if (!recurring) {
      return NextResponse.json(
        { error: "Recorrência não encontrada" },
        { status: 404 }
      )
    }

    if (recurring.status !== RecurrenceStatus.ACTIVE) {
      return NextResponse.json(
        { error: "Apenas recorrências ativas podem gerar transações" },
        { status: 400 }
      )
    }

    // Criar a transação baseada na recorrência já como PAGA
    const transaction = await prisma.financialTransaction.create({
      data: {
        tenantId: session.user.tenantId,
        type: recurring.type,
        description: recurring.description,
        amount: recurring.amount,
        date: new Date(), // Data atual como data do pagamento
        dueDate: recurring.nextDueDate,
        categoryId: recurring.categoryId,
        equipmentId: recurring.equipmentId,
        status: TransactionStatus.PAID, // Já marca como paga
        isRecurring: true,
        recurrenceId: recurring.id,
        paidAt: new Date(), // Registra quando foi pago
      },
      include: {
        category: true,
        equipment: {
          select: { id: true, name: true },
        },
      },
    })

    // Calcular próxima data de vencimento
    const nextDueDate = new Date(
      recurring.nextDueDate.getTime() + recurring.intervalDays * 24 * 60 * 60 * 1000
    )

    // Verificar se atingiu a data final
    const isCompleted = recurring.endDate && nextDueDate > recurring.endDate
    const newStatus = isCompleted ? RecurrenceStatus.COMPLETED : RecurrenceStatus.ACTIVE

    // Atualizar a próxima data de vencimento
    await prisma.recurringTransaction.update({
      where: { id },
      data: {
        nextDueDate,
        status: newStatus,
      },
    })

    return NextResponse.json({
      transaction,
      message: "Pagamento registrado com sucesso",
      nextDueDate: !isCompleted ? nextDueDate : null,
      recurrenceCompleted: isCompleted,
    })
  } catch (error) {
    console.error("Erro ao registrar pagamento:", error)
    return NextResponse.json(
      { error: "Erro ao registrar pagamento" },
      { status: 500 }
    )
  }
}
