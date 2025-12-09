import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { RecurrenceStatus } from "@prisma/client"

// POST - Retomar recorrência
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
    const existing = await prisma.recurringTransaction.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Recorrência não encontrada" },
        { status: 404 }
      )
    }

    if (existing.status !== RecurrenceStatus.PAUSED) {
      return NextResponse.json(
        { error: "Apenas recorrências pausadas podem ser retomadas" },
        { status: 400 }
      )
    }

    // Recalcular próxima data de vencimento se a data anterior já passou
    const now = new Date()
    let nextDueDate = existing.nextDueDate

    if (nextDueDate < now) {
      // Calcular a próxima data futura baseada no intervalo
      while (nextDueDate < now) {
        nextDueDate = new Date(nextDueDate.getTime() + existing.intervalDays * 24 * 60 * 60 * 1000)
      }
    }

    const recurring = await prisma.recurringTransaction.update({
      where: { id },
      data: {
        status: RecurrenceStatus.ACTIVE,
        nextDueDate,
      },
      include: {
        category: true,
        equipment: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({
      recurring,
      message: "Recorrência retomada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao retomar recorrência:", error)
    return NextResponse.json(
      { error: "Erro ao retomar recorrência" },
      { status: 500 }
    )
  }
}
