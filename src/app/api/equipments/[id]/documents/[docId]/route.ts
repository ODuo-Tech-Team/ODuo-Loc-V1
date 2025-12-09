import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateDocumentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
  type: z.enum(["MANUAL", "WARRANTY", "CERTIFICATE", "INVOICE", "OTHER"]).optional(),
  url: z.string().url("URL inválida").optional(),
})

// GET - Buscar documento específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id, docId } = await params
    const tenantId = session.user.tenantId

    // Verificar se o equipamento pertence ao tenant
    const equipment = await prisma.equipment.findFirst({
      where: { id, tenantId },
      select: { id: true },
    })

    if (!equipment) {
      return NextResponse.json({ error: "Equipamento não encontrado" }, { status: 404 })
    }

    const document = await prisma.equipmentDocument.findFirst({
      where: { id: docId, equipmentId: id },
    })

    if (!document) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 })
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error("Erro ao buscar documento:", error)
    return NextResponse.json({ error: "Erro ao buscar documento" }, { status: 500 })
  }
}

// PUT - Atualizar documento
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id, docId } = await params
    const tenantId = session.user.tenantId

    // Verificar se o equipamento pertence ao tenant
    const equipment = await prisma.equipment.findFirst({
      where: { id, tenantId },
      select: { id: true },
    })

    if (!equipment) {
      return NextResponse.json({ error: "Equipamento não encontrado" }, { status: 404 })
    }

    // Verificar se o documento existe
    const existingDocument = await prisma.equipmentDocument.findFirst({
      where: { id: docId, equipmentId: id },
    })

    if (!existingDocument) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateDocumentSchema.parse(body)

    const document = await prisma.equipmentDocument.update({
      where: { id: docId },
      data: validatedData,
    })

    return NextResponse.json(document)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Erro ao atualizar documento:", error)
    return NextResponse.json({ error: "Erro ao atualizar documento" }, { status: 500 })
  }
}

// DELETE - Remover documento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id, docId } = await params
    const tenantId = session.user.tenantId

    // Verificar se o equipamento pertence ao tenant
    const equipment = await prisma.equipment.findFirst({
      where: { id, tenantId },
      select: { id: true },
    })

    if (!equipment) {
      return NextResponse.json({ error: "Equipamento não encontrado" }, { status: 404 })
    }

    // Verificar se o documento existe
    const existingDocument = await prisma.equipmentDocument.findFirst({
      where: { id: docId, equipmentId: id },
    })

    if (!existingDocument) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 })
    }

    await prisma.equipmentDocument.delete({
      where: { id: docId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir documento:", error)
    return NextResponse.json({ error: "Erro ao excluir documento" }, { status: 500 })
  }
}
