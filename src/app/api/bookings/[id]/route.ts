import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidateBookings } from "@/lib/cache/revalidate"
import { sendEmail, emailTemplates, EMAIL_FROM } from "@/lib/email"

// GET - Buscar reserva por ID
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

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        equipment: true,
        customer: true,
        items: {
          include: {
            equipment: {
              select: {
                id: true,
                name: true,
                category: true,
                images: true,
                pricePerDay: true,
                totalStock: true,
                availableStock: true,
              },
            },
          },
        },
        stockMovements: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Reserva não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(booking, { status: 200 })
  } catch (error) {
    console.error("Erro ao buscar reserva:", error)
    return NextResponse.json(
      { error: "Erro ao buscar reserva" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar reserva
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId || !session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, startDate, endDate, startTime, endTime, totalPrice, notes } = body

    // Buscar reserva atual com itens
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        items: {
          include: {
            equipment: true,
          },
        },
        equipment: true,
      },
    })

    if (!existingBooking) {
      return NextResponse.json(
        { error: "Reserva não encontrada" },
        { status: 404 }
      )
    }

    // Se está mudando o status, precisamos atualizar o estoque
    const isStatusChange = status && status !== existingBooking.status
    const previousStatus = existingBooking.status

    // Executar atualização em transação
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Atualizar a reserva
      const booking = await tx.booking.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate && { endDate: new Date(endDate) }),
          ...(startTime !== undefined && { startTime }),
          ...(endTime !== undefined && { endTime }),
          ...(totalPrice && { totalPrice: parseFloat(totalPrice) }),
          ...(notes !== undefined && { notes }),
        },
        include: {
          equipment: true,
          customer: true,
          items: {
            include: {
              equipment: true,
            },
          },
        },
      })

      // Se mudou o status, atualizar estoque
      if (isStatusChange) {
        // Determinar itens a processar (novos ou legado)
        const itemsToProcess = existingBooking.items.length > 0
          ? existingBooking.items
          : existingBooking.equipment
            ? [{ equipmentId: existingBooking.equipment.id, quantity: 1, equipment: existingBooking.equipment }]
            : []

        for (const item of itemsToProcess) {
          const equipment = await tx.equipment.findUnique({
            where: { id: item.equipmentId },
          })

          if (!equipment) continue

          // Lógica de atualização de estoque baseada na transição de status
          // PENDING/CONFIRMED -> COMPLETED: mover de reservedStock para availableStock
          // PENDING/CONFIRMED -> CANCELLED: mover de reservedStock para availableStock
          // Qualquer -> PENDING/CONFIRMED (reativação): verificar disponibilidade

          if (
            (previousStatus === "PENDING" || previousStatus === "CONFIRMED") &&
            (status === "COMPLETED" || status === "CANCELLED")
          ) {
            // Liberar estoque reservado
            await tx.equipment.update({
              where: { id: item.equipmentId },
              data: {
                reservedStock: { decrement: item.quantity },
                availableStock: { increment: item.quantity },
              },
            })

            // Registrar movimentação
            await tx.stockMovement.create({
              data: {
                type: status === "COMPLETED" ? "RENTAL_RETURN" : "ADJUSTMENT",
                quantity: item.quantity,
                previousStock: equipment.availableStock,
                newStock: equipment.availableStock + item.quantity,
                reason: status === "COMPLETED"
                  ? `Devolução - Reserva #${existingBooking.bookingNumber}`
                  : `Cancelamento - Reserva #${existingBooking.bookingNumber}`,
                equipmentId: item.equipmentId,
                bookingId: id,
                userId: session.user.id,
                tenantId: session.user.tenantId,
              },
            })
          }
        }

        // Registrar atividade
        await tx.activityLog.create({
          data: {
            action: "UPDATE",
            entity: "BOOKING",
            entityId: id,
            description: `Reserva #${existingBooking.bookingNumber} - Status alterado de ${previousStatus} para ${status}`,
            metadata: {
              previousStatus,
              newStatus: status,
              itemsCount: itemsToProcess.length,
            },
            userId: session.user.id,
            tenantId: session.user.tenantId,
          },
        })
      }

      return booking
    })

    // Invalidar cache
    revalidateBookings(session.user.tenantId)

    // Sincronizar com módulo comercial quando status muda
    if (isStatusChange) {
      try {
        // Buscar lead associado ao cliente (incluindo leads WON/LOST para reversão)
        const lead = await prisma.lead.findFirst({
          where: {
            tenantId: session.user.tenantId,
            convertedCustomerId: existingBooking.customerId,
          },
          orderBy: { createdAt: "desc" }, // Pegar o lead mais recente
        })

        if (lead) {
          if (status === "CONFIRMED") {
            // Orçamento confirmado = Lead ganho
            if (lead.status !== "WON") {
              await prisma.lead.update({
                where: { id: lead.id },
                data: {
                  status: "WON",
                  wonAt: new Date(),
                  lostAt: null,
                  lostReason: null,
                },
              })

              await prisma.leadActivity.create({
                data: {
                  type: "OTHER",
                  description: `Negócio fechado! Orçamento #${existingBooking.bookingNumber} confirmado.`,
                  leadId: lead.id,
                  userId: session.user.id,
                  tenantId: session.user.tenantId,
                  completedAt: new Date(),
                },
              })
            }
          } else if (status === "CANCELLED") {
            // Orçamento cancelado = Lead perdido
            if (lead.status !== "LOST") {
              await prisma.lead.update({
                where: { id: lead.id },
                data: {
                  status: "LOST",
                  lostAt: new Date(),
                  lostReason: "Orçamento cancelado",
                  wonAt: null,
                },
              })

              await prisma.leadActivity.create({
                data: {
                  type: "OTHER",
                  description: `Orçamento #${existingBooking.bookingNumber} cancelado.`,
                  leadId: lead.id,
                  userId: session.user.id,
                  tenantId: session.user.tenantId,
                  completedAt: new Date(),
                },
              })
            }
          } else if (status === "COMPLETED") {
            // Orçamento concluído = Lead ganho
            if (lead.status !== "WON") {
              await prisma.lead.update({
                where: { id: lead.id },
                data: {
                  status: "WON",
                  wonAt: new Date(),
                  lostAt: null,
                  lostReason: null,
                },
              })

              await prisma.leadActivity.create({
                data: {
                  type: "OTHER",
                  description: `Locação concluída! Orçamento #${existingBooking.bookingNumber} finalizado.`,
                  leadId: lead.id,
                  userId: session.user.id,
                  tenantId: session.user.tenantId,
                  completedAt: new Date(),
                },
              })
            }
          } else if (status === "PENDING") {
            // Orçamento voltou para pendente = Lead volta para PROPOSAL (em negociação)
            if (lead.status === "WON" || lead.status === "LOST") {
              await prisma.lead.update({
                where: { id: lead.id },
                data: {
                  status: "PROPOSAL",
                  wonAt: null,
                  lostAt: null,
                  lostReason: null,
                },
              })

              await prisma.leadActivity.create({
                data: {
                  type: "OTHER",
                  description: `Orçamento #${existingBooking.bookingNumber} reaberto - voltou para negociação.`,
                  leadId: lead.id,
                  userId: session.user.id,
                  tenantId: session.user.tenantId,
                  completedAt: new Date(),
                },
              })
            }
          }
        }
      } catch (leadError) {
        console.error("Erro ao sincronizar lead:", leadError)
      }

      // Enviar e-mail de cancelamento se reserva foi cancelada
      if (status === "CANCELLED") {
        try {
          const customer = await prisma.customer.findUnique({
            where: { id: existingBooking.customerId },
            select: { name: true, email: true },
          })

          const tenant = await prisma.tenant.findUnique({
            where: { id: session.user.tenantId },
            select: { name: true, phone: true },
          })

          if (customer?.email) {
            // Formatar nomes dos equipamentos
            const equipmentNames = existingBooking.items.length > 0
              ? existingBooking.items.map((item: { equipment: { name: string } }) => item.equipment.name).join(", ")
              : existingBooking.equipment?.name || "Equipamento"

            // Formatar data para pt-BR
            const formatDate = (date: Date) => date.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })

            const emailContent = emailTemplates.bookingCancelled({
              customerName: customer.name,
              equipmentName: equipmentNames,
              startDate: formatDate(existingBooking.startDate),
              tenantName: tenant?.name || "ODuoLoc",
              tenantPhone: tenant?.phone || undefined,
              bookingId: existingBooking.id,
            })

            await sendEmail({
              to: customer.email,
              subject: emailContent.subject,
              html: emailContent.html,
              from: EMAIL_FROM.NOTIFICACOES,
            })
            console.log(`[EMAIL] E-mail de cancelamento enviado para ${customer.email}`)
          }
        } catch (emailError) {
          console.error("[EMAIL] Erro ao enviar e-mail de cancelamento:", emailError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
    }, { status: 200 })
  } catch (error) {
    console.error("Erro ao atualizar reserva:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar reserva" },
      { status: 500 }
    )
  }
}

// DELETE - Deletar/Cancelar reserva
// Query params:
// - permanent=true: Exclui permanentemente do banco
// - (default): Marca como CANCELLED (perdido)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId || !session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const permanent = searchParams.get("permanent") === "true"

    // Buscar reserva com itens
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        items: {
          include: {
            equipment: {
              select: { id: true, name: true },
            },
          },
        },
        equipment: true,
      },
    })

    if (!existingBooking) {
      return NextResponse.json(
        { error: "Reserva não encontrada" },
        { status: 404 }
      )
    }

    // Executar em transação
    await prisma.$transaction(async (tx) => {
      // Liberar estoque se estava pendente ou confirmada
      if (existingBooking.status === "PENDING" || existingBooking.status === "CONFIRMED") {
        // Determinar itens a processar
        const itemsToProcess = existingBooking.items.length > 0
          ? existingBooking.items
          : existingBooking.equipment
            ? [{ equipmentId: existingBooking.equipment.id, quantity: 1 }]
            : []

        for (const item of itemsToProcess) {
          const equipment = await tx.equipment.findUnique({
            where: { id: item.equipmentId },
          })

          if (!equipment) continue

          // Liberar estoque reservado
          await tx.equipment.update({
            where: { id: item.equipmentId },
            data: {
              reservedStock: { decrement: item.quantity },
              availableStock: { increment: item.quantity },
            },
          })

          // Registrar movimentação (apenas se não for excluir permanentemente)
          if (!permanent) {
            await tx.stockMovement.create({
              data: {
                type: "ADJUSTMENT",
                quantity: item.quantity,
                previousStock: equipment.availableStock,
                newStock: equipment.availableStock + item.quantity,
                reason: `Cancelamento - Reserva #${existingBooking.bookingNumber}`,
                equipmentId: item.equipmentId,
                bookingId: id,
                userId: session.user.id,
                tenantId: session.user.tenantId,
              },
            })
          }
        }
      }

      if (permanent) {
        // EXCLUSÃO PERMANENTE
        // Primeiro deletar itens relacionados
        await tx.bookingItem.deleteMany({
          where: { bookingId: id },
        })

        // Deletar movimentações de estoque associadas
        await tx.stockMovement.deleteMany({
          where: { bookingId: id },
        })

        // Deletar a reserva
        await tx.booking.delete({
          where: { id },
        })

        // Registrar atividade
        await tx.activityLog.create({
          data: {
            action: "DELETE",
            entity: "BOOKING",
            entityId: id,
            description: `Reserva #${existingBooking.bookingNumber} excluída permanentemente`,
            metadata: {
              previousStatus: existingBooking.status,
              permanent: true,
            },
            userId: session.user.id,
            tenantId: session.user.tenantId,
          },
        })
      } else {
        // MARCAR COMO PERDIDO/CANCELADO
        await tx.booking.update({
          where: { id },
          data: { status: "CANCELLED" },
        })

        // Registrar atividade
        await tx.activityLog.create({
          data: {
            action: "UPDATE",
            entity: "BOOKING",
            entityId: id,
            description: `Reserva #${existingBooking.bookingNumber} marcada como perdida`,
            metadata: {
              previousStatus: existingBooking.status,
              newStatus: "CANCELLED",
            },
            userId: session.user.id,
            tenantId: session.user.tenantId,
          },
        })
      }
    })

    // Invalidar cache
    revalidateBookings(session.user.tenantId)

    // Sincronizar com módulo comercial - marcar lead como perdido (apenas se não for permanente)
    if (!permanent) {
      try {
        const lead = await prisma.lead.findFirst({
          where: {
            tenantId: session.user.tenantId,
            convertedCustomerId: existingBooking.customerId,
            status: { notIn: ["WON", "LOST"] },
          },
        })

        if (lead) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              status: "LOST",
              lostAt: new Date(),
              lostReason: "Orçamento cancelado/perdido",
            },
          })

          await prisma.leadActivity.create({
            data: {
              type: "OTHER",
              description: `Orçamento #${existingBooking.bookingNumber} foi marcado como perdido.`,
              leadId: lead.id,
              userId: session.user.id,
              tenantId: session.user.tenantId,
              completedAt: new Date(),
            },
          })
        }
      } catch (leadError) {
        console.error("Erro ao sincronizar lead:", leadError)
      }

      // Enviar e-mail de cancelamento ao cliente
      try {
        const customer = await prisma.customer.findUnique({
          where: { id: existingBooking.customerId },
          select: { name: true, email: true },
        })

        const tenant = await prisma.tenant.findUnique({
          where: { id: session.user.tenantId },
          select: { name: true, phone: true },
        })

        if (customer?.email) {
          // Formatar nomes dos equipamentos
          const equipmentNames = existingBooking.items.length > 0
            ? existingBooking.items.map((item: { equipment: { name: string } }) => item.equipment.name).join(", ")
            : existingBooking.equipment?.name || "Equipamento"

          // Formatar data para pt-BR
          const formatDate = (date: Date) => date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })

          const emailContent = emailTemplates.bookingCancelled({
            customerName: customer.name,
            equipmentName: equipmentNames,
            startDate: formatDate(existingBooking.startDate),
            tenantName: tenant?.name || "ODuoLoc",
            tenantPhone: tenant?.phone || undefined,
            bookingId: existingBooking.id,
          })

          await sendEmail({
            to: customer.email,
            subject: emailContent.subject,
            html: emailContent.html,
            from: EMAIL_FROM.NOTIFICACOES,
          })
          console.log(`[EMAIL] E-mail de cancelamento enviado para ${customer.email}`)
        }
      } catch (emailError) {
        console.error("[EMAIL] Erro ao enviar e-mail de cancelamento:", emailError)
      }
    }

    return NextResponse.json({
      success: true,
      action: permanent ? "deleted" : "cancelled"
    }, { status: 200 })
  } catch (error) {
    console.error("Erro ao processar reserva:", error)
    return NextResponse.json(
      { error: "Erro ao processar reserva" },
      { status: 500 }
    )
  }
}
