import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Finalizar checklist
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

    // Verificar se checklist existe e pertence ao tenant
    const checklist = await prisma.bookingChecklist.findFirst({
      where: {
        id: checklistId,
        tenantId: session.user.tenantId,
      },
      include: {
        items: true,
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
        { error: "Checklist já foi finalizado" },
        { status: 400 }
      )
    }

    // Verificar se todos os itens estão marcados
    const allChecked = checklist.items.every((item) => item.checked)
    if (!allChecked) {
      return NextResponse.json(
        { error: "Todos os itens devem ser marcados antes de finalizar" },
        { status: 400 }
      )
    }

    // Finalizar checklist
    const updated = await prisma.bookingChecklist.update({
      where: { id: checklistId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        completedBy: session.user.name || session.user.email,
      },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Erro ao finalizar checklist:", error)
    return NextResponse.json(
      { error: "Erro ao finalizar checklist" },
      { status: 500 }
    )
  }
}
