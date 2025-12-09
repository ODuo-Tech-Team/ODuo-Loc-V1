import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Buscar reservas para o calendário
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const url = new URL(request.url)
    const start = url.searchParams.get("start")
    const end = url.searchParams.get("end")
    const equipmentId = url.searchParams.get("equipmentId")

    const whereClause: any = {
      tenantId: session.user.tenantId,
      status: { in: ["PENDING", "CONFIRMED"] },
    }

    // Filtro por período
    if (start && end) {
      whereClause.OR = [
        {
          AND: [
            { startDate: { gte: new Date(start) } },
            { startDate: { lte: new Date(end) } },
          ],
        },
        {
          AND: [
            { endDate: { gte: new Date(start) } },
            { endDate: { lte: new Date(end) } },
          ],
        },
        {
          AND: [
            { startDate: { lte: new Date(start) } },
            { endDate: { gte: new Date(end) } },
          ],
        },
      ]
    }

    // Filtro por equipamento
    if (equipmentId) {
      whereClause.equipmentId = equipmentId
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        equipment: {
          select: { id: true, name: true, category: true },
        },
        customer: {
          select: { id: true, name: true, phone: true },
        },
        items: {
          include: {
            equipment: {
              select: { id: true, name: true, category: true },
            },
          },
        },
      },
      orderBy: { startDate: "asc" },
    })

    // Formatar para o FullCalendar
    const events = bookings.map((booking) => {
      const statusColors: Record<string, string> = {
        PENDING: "#f59e0b",    // amber
        CONFIRMED: "#3b82f6",  // blue
        CANCELLED: "#ef4444",  // red
        COMPLETED: "#10b981",  // emerald
      }

      // Determinar equipamento principal (legado ou primeiro item)
      const mainEquipment = booking.equipment || booking.items[0]?.equipment
      const equipmentName = mainEquipment?.name || "Sem equipamento"
      const equipmentId = mainEquipment?.id || ""
      const equipmentCategory = mainEquipment?.category || ""

      return {
        id: booking.id,
        title: `${equipmentName} - ${booking.customer.name}`,
        start: booking.startDate,
        end: booking.endDate,
        allDay: true,
        backgroundColor: statusColors[booking.status] || "#6b7280",
        borderColor: statusColors[booking.status] || "#6b7280",
        extendedProps: {
          bookingId: booking.id,
          equipmentId,
          equipmentName,
          equipmentCategory,
          customerId: booking.customer.id,
          customerName: booking.customer.name,
          customerPhone: booking.customer.phone,
          status: booking.status,
          totalPrice: booking.totalPrice,
          notes: booking.notes,
          itemsCount: booking.items.length,
        },
      }
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error("Erro ao buscar eventos do calendário:", error)
    return NextResponse.json(
      { error: "Erro ao buscar eventos" },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar datas de uma reserva (para drag & drop)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId, startDate, endDate } = body

    if (!bookingId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "bookingId, startDate e endDate são obrigatórios" },
        { status: 400 }
      )
    }

    // Verificar se a reserva existe e pertence ao tenant
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        tenantId: session.user.tenantId,
      },
    })

    if (!existingBooking) {
      return NextResponse.json(
        { error: "Reserva não encontrada" },
        { status: 404 }
      )
    }

    // Verificar conflitos (excluindo a própria reserva)
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        equipmentId: existingBooking.equipmentId,
        id: { not: bookingId },
        status: { in: ["PENDING", "CONFIRMED"] },
        OR: [
          {
            AND: [
              { startDate: { lte: new Date(startDate) } },
              { endDate: { gte: new Date(startDate) } },
            ],
          },
          {
            AND: [
              { startDate: { lte: new Date(endDate) } },
              { endDate: { gte: new Date(endDate) } },
            ],
          },
          {
            AND: [
              { startDate: { gte: new Date(startDate) } },
              { endDate: { lte: new Date(endDate) } },
            ],
          },
        ],
      },
    })

    if (conflictingBookings.length > 0) {
      return NextResponse.json(
        { error: "Conflito de datas com outra reserva" },
        { status: 409 }
      )
    }

    // Atualizar reserva
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
      include: {
        equipment: { select: { name: true } },
        customer: { select: { name: true } },
      },
    })

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
    })
  } catch (error) {
    console.error("Erro ao atualizar reserva:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar reserva" },
      { status: 500 }
    )
  }
}
