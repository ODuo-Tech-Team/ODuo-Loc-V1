import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { availabilityCheckSchema } from "@/lib/validations/stock"

// GET - Verificar disponibilidade de um equipamento para um período
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ equipmentId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { equipmentId } = await params
    const url = new URL(request.url)

    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")
    const quantityParam = url.searchParams.get("quantity")
    const excludeBookingId = url.searchParams.get("excludeBookingId")

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate e endDate são obrigatórios" },
        { status: 400 }
      )
    }

    // Validar input
    const validation = availabilityCheckSchema.safeParse({
      startDate,
      endDate,
      quantity: quantityParam ? parseInt(quantityParam) : 1,
      excludeBookingId,
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { quantity } = validation.data
    const start = new Date(startDate)
    const end = new Date(endDate)

    // Buscar equipamento
    const equipment = await prisma.equipment.findFirst({
      where: {
        id: equipmentId,
        tenantId: session.user.tenantId,
      },
      select: {
        id: true,
        name: true,
        totalStock: true,
        availableStock: true,
        reservedStock: true,
        maintenanceStock: true,
        damagedStock: true,
        status: true,
      },
    })

    if (!equipment) {
      return NextResponse.json(
        { error: "Equipamento não encontrado" },
        { status: 404 }
      )
    }

    // Buscar reservas que conflitam com o período
    const whereClause: any = {
      equipmentId,
      status: { in: ["PENDING", "CONFIRMED"] },
      OR: [
        // Reserva começa durante o período
        {
          startDate: { gte: start, lte: end },
        },
        // Reserva termina durante o período
        {
          endDate: { gte: start, lte: end },
        },
        // Reserva engloba o período todo
        {
          startDate: { lte: start },
          endDate: { gte: end },
        },
      ],
    }

    // Excluir reserva específica (para edição)
    if (excludeBookingId) {
      whereClause.id = { not: excludeBookingId }
    }

    // Buscar reservas conflitantes (legado - pelo equipmentId direto)
    const conflictingBookings = await prisma.booking.findMany({
      where: whereClause,
      select: {
        id: true,
        bookingNumber: true,
        startDate: true,
        endDate: true,
        status: true,
        customer: {
          select: { id: true, name: true },
        },
      },
    })

    // Buscar BookingItems conflitantes (novo sistema multi-item)
    const conflictingItemsClause: any = {
      equipmentId,
      booking: {
        status: { in: ["PENDING", "CONFIRMED"] },
        OR: [
          { startDate: { gte: start, lte: end } },
          { endDate: { gte: start, lte: end } },
          {
            startDate: { lte: start },
            endDate: { gte: end },
          },
        ],
      },
    }

    if (excludeBookingId) {
      conflictingItemsClause.bookingId = { not: excludeBookingId }
    }

    const conflictingItems = await prisma.bookingItem.findMany({
      where: conflictingItemsClause,
      select: {
        id: true,
        quantity: true,
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            startDate: true,
            endDate: true,
            status: true,
            customer: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    // Calcular quantidade reservada no período
    // Para reservas legadas, assumir 1 unidade cada
    const reservedFromLegacy = conflictingBookings.length
    // Para novos BookingItems, somar as quantidades
    const reservedFromItems = conflictingItems.reduce((sum, item) => sum + item.quantity, 0)
    const totalReservedInPeriod = reservedFromLegacy + reservedFromItems

    // Calcular disponibilidade real para o período
    // Disponível = Total - Em Manutenção - Danificado - Reservado no período
    const availableForPeriod = equipment.totalStock - equipment.maintenanceStock - equipment.damagedStock - totalReservedInPeriod

    const isAvailable = availableForPeriod >= quantity && equipment.status !== "INACTIVE"

    // Consolidar conflitos para resposta
    const conflicts = [
      ...conflictingBookings.map(b => ({
        type: "legacy" as const,
        bookingId: b.id,
        bookingNumber: b.bookingNumber,
        startDate: b.startDate,
        endDate: b.endDate,
        status: b.status,
        customer: b.customer,
        quantity: 1,
      })),
      ...conflictingItems.map(item => ({
        type: "item" as const,
        bookingId: item.booking.id,
        bookingNumber: item.booking.bookingNumber,
        startDate: item.booking.startDate,
        endDate: item.booking.endDate,
        status: item.booking.status,
        customer: item.booking.customer,
        quantity: item.quantity,
      })),
    ]

    return NextResponse.json({
      equipment: {
        id: equipment.id,
        name: equipment.name,
        status: equipment.status,
      },
      period: {
        startDate: start,
        endDate: end,
      },
      requestedQuantity: quantity,
      stock: {
        total: equipment.totalStock,
        available: equipment.availableStock,
        maintenance: equipment.maintenanceStock,
        damaged: equipment.damagedStock,
        reservedInPeriod: totalReservedInPeriod,
        availableForPeriod,
      },
      isAvailable,
      conflicts,
      message: isAvailable
        ? `${availableForPeriod} unidade(s) disponível(is) para o período`
        : equipment.status === "INACTIVE"
          ? "Equipamento inativo"
          : `Apenas ${Math.max(0, availableForPeriod)} unidade(s) disponível(is). Solicitado: ${quantity}`,
    })
  } catch (error) {
    console.error("Erro ao verificar disponibilidade:", error)
    return NextResponse.json(
      { error: "Erro ao verificar disponibilidade" },
      { status: 500 }
    )
  }
}
