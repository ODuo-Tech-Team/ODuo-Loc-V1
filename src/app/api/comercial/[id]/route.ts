import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Buscar lead por ID
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

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        activities: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        equipmentInterests: {
          include: {
            equipment: {
              select: { id: true, name: true, pricePerDay: true },
            },
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!lead) {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(lead, { status: 200 })
  } catch (error) {
    console.error("Erro ao buscar lead:", error)
    return NextResponse.json(
      { error: "Erro ao buscar lead" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar lead
export async function PUT(
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
    const {
      name,
      company,
      email,
      phone,
      whatsapp,
      address,
      city,
      state,
      status,
      source,
      contactType,
      expectedValue,
      interestNotes,
      nextAction,
      nextActionDate,
      lostReason,
      assignedToId,
      equipmentIds,
    } = body

    // Verificar se o lead existe e pertence ao tenant
    const existingLead = await prisma.lead.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existingLead) {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      )
    }

    // Preparar dados para atualização
    const updateData: any = {
      ...(name !== undefined && { name }),
      ...(company !== undefined && { company }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(whatsapp !== undefined && { whatsapp }),
      ...(address !== undefined && { address }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(source !== undefined && { source }),
      ...(contactType !== undefined && { contactType }),
      ...(expectedValue !== undefined && { expectedValue: expectedValue ? parseFloat(expectedValue) : null }),
      ...(interestNotes !== undefined && { interestNotes }),
      ...(nextAction !== undefined && { nextAction }),
      ...(nextActionDate !== undefined && { nextActionDate: nextActionDate ? new Date(nextActionDate) : null }),
      ...(lostReason !== undefined && { lostReason }),
      ...(assignedToId !== undefined && { assignedToId }),
    }

    // Lógica especial para mudança de status
    if (status !== undefined && status !== existingLead.status) {
      updateData.status = status

      if (status === "WON") {
        updateData.wonAt = new Date()
        updateData.lostAt = null
      } else if (status === "LOST") {
        updateData.lostAt = new Date()
        updateData.wonAt = null
      } else {
        // Se voltou para outro status, limpar datas
        if (existingLead.status === "WON" || existingLead.status === "LOST") {
          updateData.wonAt = null
          updateData.lostAt = null
        }
      }
    }

    // Atualizar lead
    const lead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        activities: {
          take: 3,
          orderBy: { createdAt: "desc" },
        },
        equipmentInterests: {
          include: {
            equipment: {
              select: { id: true, name: true },
            },
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Atualizar interesses em equipamentos se fornecidos
    if (equipmentIds !== undefined) {
      // Remover interesses antigos
      await prisma.leadEquipmentInterest.deleteMany({
        where: { leadId: id },
      })

      // Criar novos interesses
      if (equipmentIds.length > 0) {
        await prisma.leadEquipmentInterest.createMany({
          data: equipmentIds.map((equipmentId: string) => ({
            leadId: id,
            equipmentId,
          })),
        })
      }
    }

    // Sincronizar orçamentos quando status do lead muda
    if (status !== undefined && status !== existingLead.status && existingLead.convertedCustomerId) {
      try {
        // Buscar orçamentos pendentes/confirmados do cliente
        const bookings = await prisma.booking.findMany({
          where: {
            customerId: existingLead.convertedCustomerId,
            tenantId: session.user.tenantId,
            status: { in: ["PENDING", "CONFIRMED", "CANCELLED"] },
          },
        })

        // Determinar novo status do orçamento baseado no status do lead
        let newBookingStatus: "PENDING" | "CONFIRMED" | "CANCELLED" | null = null

        if (status === "WON") {
          newBookingStatus = "CONFIRMED"
        } else if (status === "LOST") {
          newBookingStatus = "CANCELLED"
        } else if (["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL"].includes(status)) {
          // Lead voltou para negociação - orçamentos voltam para pendente
          newBookingStatus = "PENDING"
        }

        if (newBookingStatus && bookings.length > 0) {
          // Atualizar apenas orçamentos que precisam mudar
          for (const booking of bookings) {
            if (booking.status !== newBookingStatus) {
              await prisma.booking.update({
                where: { id: booking.id },
                data: { status: newBookingStatus },
              })

              // Registrar atividade
              await prisma.activityLog.create({
                data: {
                  action: "UPDATE",
                  entity: "BOOKING",
                  entityId: booking.id,
                  description: `Orçamento #${booking.bookingNumber} atualizado via funil comercial (${existingLead.status} → ${status})`,
                  metadata: {
                    previousStatus: booking.status,
                    newStatus: newBookingStatus,
                    triggeredBy: "lead_status_change",
                  },
                  userId: session.user.id,
                  tenantId: session.user.tenantId,
                },
              })
            }
          }
        }
      } catch (syncError) {
        console.error("Erro ao sincronizar orçamentos:", syncError)
        // Não falhar a requisição por erro de sincronização
      }
    }

    return NextResponse.json({ lead }, { status: 200 })
  } catch (error) {
    console.error("Erro ao atualizar lead:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar lead" },
      { status: 500 }
    )
  }
}

// DELETE - Deletar lead
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

    // Verificar se o lead existe e pertence ao tenant
    const existingLead = await prisma.lead.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existingLead) {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se foi convertido em cliente
    if (existingLead.convertedCustomerId) {
      return NextResponse.json(
        { error: "Não é possível deletar lead convertido em cliente" },
        { status: 400 }
      )
    }

    // Deletar lead (cascade deleta activities e equipmentInterests)
    await prisma.lead.delete({
      where: { id },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Erro ao deletar lead:", error)
    return NextResponse.json(
      { error: "Erro ao deletar lead" },
      { status: 500 }
    )
  }
}
