import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Converter lead em cliente
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

    // Buscar lead
    const lead = await prisma.lead.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!lead) {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se já foi convertido
    if (lead.convertedCustomerId) {
      return NextResponse.json(
        { error: "Lead já foi convertido em cliente" },
        { status: 400 }
      )
    }

    // Verificar se o status é WON
    if (lead.status !== "WON") {
      return NextResponse.json(
        { error: "Apenas leads ganhos podem ser convertidos em clientes" },
        { status: 400 }
      )
    }

    // Criar cliente a partir do lead
    const customer = await prisma.customer.create({
      data: {
        personType: "PJ",
        name: lead.name,
        tradeName: lead.company,
        email: lead.email,
        phone: lead.phone,
        whatsapp: lead.whatsapp,
        city: lead.city,
        state: lead.state,
        address: lead.address,
        notes: lead.interestNotes,
        tenantId: session.user.tenantId,
      },
    })

    // Atualizar lead com referência ao cliente
    await prisma.lead.update({
      where: { id },
      data: {
        convertedCustomerId: customer.id,
      },
    })

    // Registrar atividade de conversão
    await prisma.leadActivity.create({
      data: {
        type: "OTHER",
        description: `Lead convertido em cliente: ${customer.name}`,
        photos: [],
        completedAt: new Date(),
        leadId: id,
        userId: session.user.id,
        tenantId: session.user.tenantId,
      },
    })

    return NextResponse.json(
      {
        success: true,
        customer,
        message: "Lead convertido em cliente com sucesso",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Erro ao converter lead:", error)
    return NextResponse.json(
      { error: "Erro ao converter lead em cliente" },
      { status: 500 }
    )
  }
}
