import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { RecurrenceStatus } from "@prisma/client"

// POST - Pausar recorrência
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

    if (existing.status !== RecurrenceStatus.ACTIVE) {
      return NextResponse.json(
        { error: "Apenas recorrências ativas podem ser pausadas" },
        { status: 400 }
      )
    }

    const recurring = await prisma.recurringTransaction.update({
      where: { id },
      data: { status: RecurrenceStatus.PAUSED },
      include: {
        category: true,
        equipment: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({
      recurring,
      message: "Recorrência pausada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao pausar recorrência:", error)
    return NextResponse.json(
      { error: "Erro ao pausar recorrência" },
      { status: 500 }
    )
  }
}
