import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { bookingItemSchema } from "@/lib/validations/stock"
import { calculateRentalPrice } from "@/lib/pricing"
import { checkBookingLimit } from "@/lib/plan-limits"
import { revalidateBookings } from "@/lib/cache/revalidate"
import { sendEmail, emailTemplates, EMAIL_FROM } from "@/lib/email"
import { z } from "zod"

// GET - Listar reservas
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const url = new URL(request.url)
    const status = url.searchParams.get("status")

    const bookings = await prisma.booking.findMany({
      where: {
        tenantId: session.user.tenantId,
        ...(status && { status: status as any }),
      },
      include: {
        equipment: true,
        customer: true,
        customerSite: true,
        items: {
          include: {
            equipment: {
              select: {
                id: true,
                name: true,
                category: true,
                images: true,
                pricePerDay: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(bookings, { status: 200 })
  } catch (error) {
    console.error("Erro ao buscar reservas:", error)
    return NextResponse.json(
      { error: "Erro ao buscar reservas" },
      { status: 500 }
    )
  }
}

// Schema para criação de reserva com itens
const createBookingSchema = z.object({
  customerId: z.string().min(1, "Cliente é obrigatório"),
  customerSiteId: z.string().optional().nullable(),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().min(1, "Data de fim é obrigatória"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().optional().nullable(),
  // Suporte legado (único equipamento)
  equipmentId: z.string().optional(),
  totalPrice: z.number().optional(),
  quantity: z.number().int().positive().optional(), // Quantidade (legado)
  selectedUnitIds: z.array(z.string()).optional(), // Unidades selecionadas (legado, para serializados)
  // Novo sistema multi-item
  items: z.array(bookingItemSchema).optional(),
  // Status inicial do orçamento (default: PENDING)
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
})

// POST - Criar reserva
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId || !session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar limite de reservas do plano
    const limitCheck = await checkBookingLimit(session.user.tenantId)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: "PLAN_LIMIT_EXCEEDED",
          message: limitCheck.message,
          details: {
            limitType: "bookings",
            current: limitCheck.current,
            max: limitCheck.max,
            upgradeUrl: "/renovar"
          }
        },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validar input
    const validation = createBookingSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const {
      customerId,
      customerSiteId,
      startDate,
      endDate,
      startTime,
      endTime,
      notes,
      equipmentId,
      totalPrice,
      quantity,
      selectedUnitIds,
      items,
      status,
    } = validation.data

    // Verificar se o cliente existe e pertence ao tenant
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId: session.user.tenantId,
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se o cliente está ativo
    if (!customer.isActive) {
      return NextResponse.json(
        { error: "Cliente bloqueado. Não é possível criar orçamento para clientes inativos." },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Determinar se é reserva legada (único equipamento) ou nova (multi-item)
    const isLegacyBooking = equipmentId && !items?.length
    const bookingItems = items || []

    // Calcular dias de locação
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Se legado, criar item virtual para validação
    if (isLegacyBooking && equipmentId) {
      const equipment = await prisma.equipment.findFirst({
        where: {
          id: equipmentId,
          tenantId: session.user.tenantId,
        },
      })

      if (!equipment) {
        return NextResponse.json(
          { error: "Equipamento não encontrado" },
          { status: 404 }
        )
      }

      // Determinar quantidade: para serializados, usar número de unidades selecionadas
      const itemQuantity = selectedUnitIds?.length || quantity || 1

      // Calcular preço usando os períodos de locação
      const priceResult = await calculateRentalPrice(equipmentId, days, itemQuantity)

      bookingItems.push({
        equipmentId,
        quantity: itemQuantity,
        unitPrice: priceResult.pricePerDay,
        // Passar unidades selecionadas para equipamentos serializados
        selectedUnitIds: selectedUnitIds,
      })
    }

    if (bookingItems.length === 0) {
      return NextResponse.json(
        { error: "A reserva deve ter pelo menos um equipamento" },
        { status: 400 }
      )
    }

    // Validar disponibilidade de todos os itens
    const equipmentIds = bookingItems.map(item => item.equipmentId)
    const equipments = await prisma.equipment.findMany({
      where: {
        id: { in: equipmentIds },
        tenantId: session.user.tenantId,
      },
    })

    if (equipments.length !== equipmentIds.length) {
      return NextResponse.json(
        { error: "Um ou mais equipamentos não foram encontrados" },
        { status: 404 }
      )
    }

    // Verificar disponibilidade para cada equipamento
    for (const item of bookingItems) {
      const equipment = equipments.find(e => e.id === item.equipmentId)!

      // Verificar estoque disponível
      if (equipment.availableStock < item.quantity) {
        return NextResponse.json(
          {
            error: `Estoque insuficiente para "${equipment.name}". Disponível: ${equipment.availableStock}, Solicitado: ${item.quantity}`,
          },
          { status: 400 }
        )
      }

      // Verificar conflitos com outras reservas no período (legado)
      const conflictingLegacy = await prisma.booking.count({
        where: {
          equipmentId: item.equipmentId,
          status: { in: ["PENDING", "CONFIRMED"] },
          OR: [
            { startDate: { gte: start, lte: end } },
            { endDate: { gte: start, lte: end } },
            { startDate: { lte: start }, endDate: { gte: end } },
          ],
        },
      })

      // Verificar conflitos com BookingItems no período
      const conflictingItems = await prisma.bookingItem.aggregate({
        where: {
          equipmentId: item.equipmentId,
          booking: {
            status: { in: ["PENDING", "CONFIRMED"] },
            OR: [
              { startDate: { gte: start, lte: end } },
              { endDate: { gte: start, lte: end } },
              { startDate: { lte: start }, endDate: { gte: end } },
            ],
          },
        },
        _sum: { quantity: true },
      })

      const totalReservedInPeriod = conflictingLegacy + (conflictingItems._sum.quantity || 0)
      const availableForPeriod = equipment.totalStock - equipment.maintenanceStock - equipment.damagedStock - totalReservedInPeriod

      if (availableForPeriod < item.quantity) {
        return NextResponse.json(
          {
            error: `"${equipment.name}" não disponível para o período. Disponível: ${availableForPeriod}, Solicitado: ${item.quantity}`,
          },
          { status: 409 }
        )
      }
    }

    // Calcular preço total usando os períodos de locação
    let calculatedTotalPrice = 0
    const itemPrices: Map<string, { unitPrice: number; totalPrice: number }> = new Map()

    for (const item of bookingItems) {
      // Se unitPrice já foi fornecido (ex: do frontend), usar ele
      // Caso contrário, calcular baseado nos períodos
      if (item.unitPrice) {
        const itemTotal = item.unitPrice * item.quantity * days
        calculatedTotalPrice += itemTotal
        itemPrices.set(item.equipmentId, { unitPrice: item.unitPrice, totalPrice: itemTotal })
      } else {
        const priceResult = await calculateRentalPrice(item.equipmentId, days, item.quantity)
        calculatedTotalPrice += priceResult.totalPrice
        itemPrices.set(item.equipmentId, { unitPrice: priceResult.pricePerDay, totalPrice: priceResult.totalPrice })
      }
    }

    const finalTotalPrice = totalPrice || calculatedTotalPrice

    // Criar reserva em transação
    const booking = await prisma.$transaction(async (tx) => {
      // Criar a reserva
      const newBooking = await tx.booking.create({
        data: {
          customerId,
          customerSiteId: customerSiteId || null,
          tenantId: session.user.tenantId,
          startDate: start,
          endDate: end,
          startTime,
          endTime,
          totalPrice: finalTotalPrice,
          notes,
          status: status || "PENDING",
          // Manter equipmentId legado se for reserva simples
          equipmentId: isLegacyBooking ? equipmentId : null,
        },
      })

      // Criar BookingItems
      for (const item of bookingItems) {
        const equipment = equipments.find(e => e.id === item.equipmentId)!
        const prices = itemPrices.get(item.equipmentId)!

        const bookingItem = await tx.bookingItem.create({
          data: {
            bookingId: newBooking.id,
            equipmentId: item.equipmentId,
            quantity: item.quantity,
            unitPrice: prices.unitPrice,
            totalPrice: prices.totalPrice,
            notes: item.notes,
          },
        })

        // Se houver unidades selecionadas (equipamento serializado), criar BookingItemUnit
        if (item.selectedUnitIds && item.selectedUnitIds.length > 0) {
          for (const unitId of item.selectedUnitIds) {
            // Criar vínculo entre o item e a unidade
            await tx.bookingItemUnit.create({
              data: {
                bookingItemId: bookingItem.id,
                unitId: unitId,
              },
            })

            // Atualizar status da unidade para RENTED
            await tx.equipmentUnit.update({
              where: { id: unitId },
              data: { status: "RENTED" },
            })
          }
        }

        // Atualizar estoque do equipamento
        await tx.equipment.update({
          where: { id: item.equipmentId },
          data: {
            availableStock: { decrement: item.quantity },
            reservedStock: { increment: item.quantity },
          },
        })

        // Registrar movimentação de estoque
        await tx.stockMovement.create({
          data: {
            type: "RENTAL_OUT",
            quantity: item.quantity,
            previousStock: equipment.availableStock,
            newStock: equipment.availableStock - item.quantity,
            reason: `Reserva #${newBooking.bookingNumber}`,
            equipmentId: item.equipmentId,
            bookingId: newBooking.id,
            userId: session.user.id,
            tenantId: session.user.tenantId,
          },
        })
      }

      // Buscar reserva completa com relações
      const completeBooking = await tx.booking.findUnique({
        where: { id: newBooking.id },
        include: {
          equipment: true,
          customer: true,
          customerSite: true,
          items: {
            include: {
              equipment: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  images: true,
                  pricePerDay: true,
                },
              },
            },
          },
        },
      })

      // Registrar atividade
      await tx.activityLog.create({
        data: {
          action: "CREATE",
          entity: "BOOKING",
          entityId: newBooking.id,
          description: `Nova reserva #${newBooking.bookingNumber} criada para ${customer.name}`,
          metadata: {
            customerId,
            totalPrice: finalTotalPrice,
            itemsCount: bookingItems.length,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
          },
          userId: session.user.id,
          tenantId: session.user.tenantId,
        },
      })

      return completeBooking
    })

    // Invalidar cache (bookings, stock-alerts, dashboard)
    revalidateBookings(session.user.tenantId)

    // Criar Lead no módulo comercial (sincronização orçamento → comercial)
    try {
      // Verificar se já existe lead para este cliente
      const existingLead = await prisma.lead.findFirst({
        where: {
          tenantId: session.user.tenantId,
          convertedCustomerId: customerId,
          status: { notIn: ["WON", "LOST"] },
        },
      })

      // Buscar equipamentos do booking para criar interesses
      const equipmentIdsForLead = bookingItems.map(item => item.equipmentId)
      const equipmentNames = equipments.map(e => e.name).join(", ")

      if (existingLead) {
        // Atualizar lead existente com status PROPOSAL e valor esperado
        await prisma.lead.update({
          where: { id: existingLead.id },
          data: {
            status: "PROPOSAL",
            expectedValue: finalTotalPrice,
            interestNotes: `Orçamento #${booking?.bookingNumber} - Equipamentos: ${equipmentNames}`,
            nextAction: "Aguardar confirmação do orçamento",
            nextActionDate: booking?.endDate,
          },
        })

        // Adicionar interesses em equipamentos se não existirem
        for (const equipmentId of equipmentIdsForLead) {
          await prisma.leadEquipmentInterest.upsert({
            where: {
              leadId_equipmentId: {
                leadId: existingLead.id,
                equipmentId,
              },
            },
            create: {
              leadId: existingLead.id,
              equipmentId,
            },
            update: {},
          })
        }

        // Registrar atividade no lead
        await prisma.leadActivity.create({
          data: {
            type: "PROPOSAL",
            description: `Orçamento #${booking?.bookingNumber} criado no valor de R$ ${finalTotalPrice.toFixed(2)}`,
            leadId: existingLead.id,
            userId: session.user.id,
            tenantId: session.user.tenantId,
            completedAt: new Date(),
          },
        })
      } else {
        // Criar novo lead baseado no cliente do orçamento
        const newLead = await prisma.lead.create({
          data: {
            name: customer.name,
            company: customer.tradeName || customer.name,
            email: customer.email,
            phone: customer.phone,
            whatsapp: customer.whatsapp,
            address: customer.street ? `${customer.street}, ${customer.number || "s/n"}` : customer.address,
            city: customer.city,
            state: customer.state,
            status: "PROPOSAL",
            source: "DIRECT",
            contactType: "PRESENCIAL",
            expectedValue: finalTotalPrice,
            interestNotes: `Orçamento #${booking?.bookingNumber} - Equipamentos: ${equipmentNames}`,
            nextAction: "Aguardar confirmação do orçamento",
            nextActionDate: booking?.endDate,
            convertedCustomerId: customerId,
            assignedToId: session.user.id,
            tenantId: session.user.tenantId,
            // Criar interesses em equipamentos
            equipmentInterests: {
              create: equipmentIdsForLead.map(equipmentId => ({
                equipmentId,
              })),
            },
          },
        })

        // Registrar atividade inicial
        await prisma.leadActivity.create({
          data: {
            type: "PROPOSAL",
            description: `Lead criado automaticamente a partir do orçamento #${booking?.bookingNumber}`,
            leadId: newLead.id,
            userId: session.user.id,
            tenantId: session.user.tenantId,
            completedAt: new Date(),
          },
        })
      }
    } catch (leadError) {
      // Não falhar a criação do booking por erro no lead
      console.error("Erro ao sincronizar com módulo comercial:", leadError)
    }

    // Enviar e-mail de confirmação de reserva (não bloqueia a resposta)
    if (booking && customer.email) {
      try {
        // Buscar dados do tenant
        const tenant = await prisma.tenant.findUnique({
          where: { id: session.user.tenantId },
          select: { name: true, phone: true },
        })

        // Formatar nomes dos equipamentos
        const equipmentNames = booking.items.length > 0
          ? booking.items.map((item: { equipment: { name: string } }) => item.equipment.name).join(", ")
          : booking.equipment?.name || "Equipamento"

        // Formatar datas para pt-BR
        const formatDate = (date: Date) => date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })

        const emailContent = emailTemplates.bookingConfirmation({
          customerName: customer.name,
          equipmentName: equipmentNames,
          startDate: formatDate(booking.startDate),
          endDate: formatDate(booking.endDate),
          totalPrice: booking.totalPrice,
          tenantName: tenant?.name || "ODuoLoc",
          tenantPhone: tenant?.phone || undefined,
          bookingId: booking.id,
        })

        await sendEmail({
          to: customer.email,
          subject: emailContent.subject,
          html: emailContent.html,
          from: EMAIL_FROM.NOTIFICACOES,
        })
        console.log(`[EMAIL] E-mail de confirmação de reserva enviado para ${customer.email}`)
      } catch (emailError) {
        // Log do erro mas não falha a operação principal
        console.error("[EMAIL] Erro ao enviar e-mail de confirmação:", emailError)
      }
    }

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar reserva:", error)
    return NextResponse.json(
      { error: "Erro ao criar reserva" },
      { status: 500 }
    )
  }
}
