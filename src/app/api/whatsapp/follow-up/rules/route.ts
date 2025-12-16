import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Listar regras de follow-up
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const rules = await prisma.whatsAppFollowUpRule.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ rules })
  } catch (error) {
    console.error("Erro ao listar regras:", error)
    return NextResponse.json(
      { error: "Erro ao listar regras" },
      { status: 500 }
    )
  }
}

// POST - Criar nova regra
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, enabled, trigger, action, maxAttempts } = body

    // Validacoes
    if (!name) {
      return NextResponse.json(
        { error: "Nome e obrigatorio" },
        { status: 400 }
      )
    }

    if (!trigger || !trigger.type) {
      return NextResponse.json(
        { error: "Trigger invalido" },
        { status: 400 }
      )
    }

    if (!action || !action.message) {
      return NextResponse.json(
        { error: "Acao invalida - mensagem e obrigatoria" },
        { status: 400 }
      )
    }

    const rule = await prisma.whatsAppFollowUpRule.create({
      data: {
        tenantId: session.user.tenantId,
        name,
        enabled: enabled ?? true,
        trigger,
        action,
        maxAttempts: maxAttempts ?? 2,
      },
    })

    return NextResponse.json({ rule })
  } catch (error) {
    console.error("Erro ao criar regra:", error)
    return NextResponse.json(
      { error: "Erro ao criar regra" },
      { status: 500 }
    )
  }
}
