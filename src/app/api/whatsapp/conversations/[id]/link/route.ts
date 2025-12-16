import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Vincular conversa a Lead ou Customer
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
    const body = await request.json()
    const { leadId, customerId, createLead, leadData } = body

    // Verificar se conversa pertence ao tenant
    const conversation = await prisma.whatsAppConversation.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversa não encontrada" },
        { status: 404 }
      )
    }

    // Se for para criar um novo lead/negócio
    if (createLead) {
      // Se leadData foi fornecido, usar os campos customizados
      // Senão, usar os valores padrão (comportamento anterior)
      const leadFields = leadData
        ? {
            name: leadData.name || conversation.contactName || "Contato WhatsApp",
            company: leadData.company || null,
            phone: conversation.contactPhone,
            whatsapp: conversation.contactPhone,
            source: leadData.source || "SOCIAL_MEDIA",
            contactType: leadData.contactType || "ONLINE",
            status: leadData.status || "NEW",
            expectedValue: leadData.expectedValue || null,
            interestNotes: leadData.interestNotes || "Negócio criado via WhatsApp",
          }
        : {
            name: conversation.contactName || "Contato WhatsApp",
            phone: conversation.contactPhone,
            whatsapp: conversation.contactPhone,
            source: "SOCIAL_MEDIA",
            status: "NEW",
            interestNotes: "Lead criado via WhatsApp",
          }

      const newLead = await prisma.lead.create({
        data: {
          tenantId: session.user.tenantId,
          ...leadFields,
        },
      })

      await prisma.whatsAppConversation.update({
        where: { id },
        data: { leadId: newLead.id, customerId: null },
      })

      return NextResponse.json({
        success: true,
        linkedTo: "lead",
        lead: newLead,
      })
    }

    // Vincular a Lead existente
    if (leadId) {
      const lead = await prisma.lead.findFirst({
        where: { id: leadId, tenantId: session.user.tenantId },
      })

      if (!lead) {
        return NextResponse.json(
          { error: "Lead não encontrado" },
          { status: 404 }
        )
      }

      await prisma.whatsAppConversation.update({
        where: { id },
        data: { leadId, customerId: null },
      })

      return NextResponse.json({
        success: true,
        linkedTo: "lead",
        lead,
      })
    }

    // Vincular a Customer existente
    if (customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, tenantId: session.user.tenantId },
      })

      if (!customer) {
        return NextResponse.json(
          { error: "Cliente não encontrado" },
          { status: 404 }
        )
      }

      await prisma.whatsAppConversation.update({
        where: { id },
        data: { customerId, leadId: null },
      })

      return NextResponse.json({
        success: true,
        linkedTo: "customer",
        customer,
      })
    }

    return NextResponse.json(
      { error: "Nenhum vínculo especificado" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Erro ao vincular conversa:", error)
    return NextResponse.json(
      { error: "Erro ao vincular conversa" },
      { status: 500 }
    )
  }
}

// DELETE - Desvincular conversa
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

    // Verificar se conversa pertence ao tenant
    const conversation = await prisma.whatsAppConversation.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversa não encontrada" },
        { status: 404 }
      )
    }

    await prisma.whatsAppConversation.update({
      where: { id },
      data: { leadId: null, customerId: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao desvincular conversa:", error)
    return NextResponse.json(
      { error: "Erro ao desvincular conversa" },
      { status: 500 }
    )
  }
}
