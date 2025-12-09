import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Adicionar item ao checklist
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; checklistId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { checklistId } = await params
    const body = await request.json()
    const { description, order = 0 } = body

    // Verificar se checklist existe e pertence ao tenant
    const checklist = await prisma.bookingChecklist.findFirst({
      where: {
        id: checklistId,
        tenantId: session.user.tenantId,
      },
    })

    if (!checklist) {
      return NextResponse.json(
        { error: "Checklist não encontrado" },
        { status: 404 }
      )
    }

    if (checklist.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Não é possível adicionar itens a um checklist finalizado" },
        { status: 400 }
      )
    }

    // Criar item
    const item = await prisma.bookingChecklistItem.create({
      data: {
        description,
        order,
        checklistId,
      },
    })

    // Atualizar status do checklist se necessário
    if (checklist.status === "PENDING") {
      await prisma.bookingChecklist.update({
        where: { id: checklistId },
        data: { status: "IN_PROGRESS" },
      })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error("Erro ao adicionar item:", error)
    return NextResponse.json(
      { error: "Erro ao adicionar item" },
      { status: 500 }
    )
  }
}
