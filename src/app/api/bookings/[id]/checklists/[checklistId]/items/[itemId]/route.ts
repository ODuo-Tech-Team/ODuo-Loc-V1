import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH - Atualizar item do checklist
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; checklistId: string; itemId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { checklistId, itemId } = await params
    const body = await request.json()
    const { checked, notes } = body

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
        { error: "Não é possível modificar um checklist finalizado" },
        { status: 400 }
      )
    }

    // Atualizar item
    const item = await prisma.bookingChecklistItem.update({
      where: { id: itemId },
      data: {
        ...(checked !== undefined && { checked }),
        ...(notes !== undefined && { notes }),
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error("Erro ao atualizar item:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar item" },
      { status: 500 }
    )
  }
}

// DELETE - Remover item do checklist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; checklistId: string; itemId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { checklistId, itemId } = await params

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
        { error: "Não é possível modificar um checklist finalizado" },
        { status: 400 }
      )
    }

    // Deletar item
    await prisma.bookingChecklistItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar item:", error)
    return NextResponse.json(
      { error: "Erro ao deletar item" },
      { status: 500 }
    )
  }
}
