import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const documentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["MANUAL", "WARRANTY", "CERTIFICATE", "INVOICE", "OTHER"]),
  url: z.string().url("URL inválida"),
  fileSize: z.number().optional(),
})

// GET - Listar documentos de um equipamento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const tenantId = session.user.tenantId

    // Verificar se o equipamento pertence ao tenant
    const equipment = await prisma.equipment.findFirst({
      where: { id, tenantId },
      select: { id: true },
    })

    if (!equipment) {
      return NextResponse.json({ error: "Equipamento não encontrado" }, { status: 404 })
    }

    // Buscar parâmetros de filtro
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    const where: Record<string, unknown> = { equipmentId: id }
    if (type) {
      where.type = type
    }

    const documents = await prisma.equipmentDocument.findMany({
      where,
      orderBy: { uploadedAt: "desc" },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error("Erro ao buscar documentos:", error)
    return NextResponse.json({ error: "Erro ao buscar documentos" }, { status: 500 })
  }
}

// POST - Adicionar documento a um equipamento
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
    const tenantId = session.user.tenantId

    // Verificar se o equipamento pertence ao tenant
    const equipment = await prisma.equipment.findFirst({
      where: { id, tenantId },
      select: { id: true },
    })

    if (!equipment) {
      return NextResponse.json({ error: "Equipamento não encontrado" }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = documentSchema.parse(body)

    const document = await prisma.equipmentDocument.create({
      data: {
        name: validatedData.name,
        type: validatedData.type,
        url: validatedData.url,
        fileSize: validatedData.fileSize,
        equipmentId: id,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Erro ao criar documento:", error)
    return NextResponse.json({ error: "Erro ao criar documento" }, { status: 500 })
  }
}
