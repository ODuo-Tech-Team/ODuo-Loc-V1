import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { auth } from "@/lib/auth"

const prisma = new PrismaClient()

// DELETE - Revogar/Deletar API Key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params

    const result = await prisma.apiKey.deleteMany({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: "API Key não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Erro ao deletar API Key:", error)
    return NextResponse.json(
      { error: "Erro ao deletar API Key" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PATCH - Ativar/Desativar API Key
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { active } = body

    const result = await prisma.apiKey.updateMany({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      data: {
        active: active ?? true,
      },
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: "API Key não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Erro ao atualizar API Key:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar API Key" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
