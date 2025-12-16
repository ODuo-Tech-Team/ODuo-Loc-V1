import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Buscar regra por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const { id } = await params

    const rule = await prisma.whatsAppFollowUpRule.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!rule) {
      return NextResponse.json(
        { error: "Regra nao encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({ rule })
  } catch (error) {
    console.error("Erro ao buscar regra:", error)
    return NextResponse.json(
      { error: "Erro ao buscar regra" },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar regra
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Verificar se regra pertence ao tenant
    const existing = await prisma.whatsAppFollowUpRule.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Regra nao encontrada" },
        { status: 404 }
      )
    }

    const { name, enabled, trigger, action, maxAttempts } = body

    const rule = await prisma.whatsAppFollowUpRule.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(enabled !== undefined && { enabled }),
        ...(trigger !== undefined && { trigger }),
        ...(action !== undefined && { action }),
        ...(maxAttempts !== undefined && { maxAttempts }),
      },
    })

    return NextResponse.json({ rule })
  } catch (error) {
    console.error("Erro ao atualizar regra:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar regra" },
      { status: 500 }
    )
  }
}

// DELETE - Remover regra
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const { id } = await params

    // Verificar se regra pertence ao tenant
    const existing = await prisma.whatsAppFollowUpRule.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Regra nao encontrada" },
        { status: 404 }
      )
    }

    await prisma.whatsAppFollowUpRule.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao remover regra:", error)
    return NextResponse.json(
      { error: "Erro ao remover regra" },
      { status: 500 }
    )
  }
}
