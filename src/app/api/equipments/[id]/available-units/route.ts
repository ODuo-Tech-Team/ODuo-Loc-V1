import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Listar unidades disponíveis de um equipamento para um período
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

    // Buscar parâmetros de período (opcionais)
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Verificar se o equipamento existe e pertence ao tenant
    const equipment = await prisma.equipment.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      select: {
        id: true,
        name: true,
        trackingType: true,
        totalStock: true,
        availableStock: true,
      },
    })

    if (!equipment) {
      return NextResponse.json(
        { error: "Equipamento não encontrado" },
        { status: 404 }
      )
    }

    // Se não for serializado, retornar apenas info de quantidade
    if (equipment.trackingType !== "SERIALIZED") {
      return NextResponse.json({
        trackingType: equipment.trackingType,
        totalStock: equipment.totalStock,
        availableStock: equipment.availableStock,
        units: [],
      })
    }

    // Buscar unidades com status AVAILABLE
    let units = await prisma.equipmentUnit.findMany({
      where: {
        equipmentId: id,
        tenantId: session.user.tenantId,
        status: "AVAILABLE",
      },
      select: {
        id: true,
        serialNumber: true,
        internalCode: true,
        status: true,
        notes: true,
      },
      orderBy: { serialNumber: "asc" },
    })

    // Se tiver período especificado, filtrar unidades que já estão reservadas no período
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)

      // Buscar unidades que já estão em reservas ativas no período
      const reservedUnitIds = await prisma.bookingItemUnit.findMany({
        where: {
          unit: {
            equipmentId: id,
          },
          bookingItem: {
            booking: {
              status: { in: ["PENDING", "CONFIRMED"] },
              OR: [
                // Reserva começa durante o período
                { startDate: { gte: start, lte: end } },
                // Reserva termina durante o período
                { endDate: { gte: start, lte: end } },
                // Reserva engloba todo o período
                { startDate: { lte: start }, endDate: { gte: end } },
              ],
            },
          },
        },
        select: {
          unitId: true,
        },
      })

      const reservedIds = new Set(reservedUnitIds.map(r => r.unitId))

      // Filtrar unidades disponíveis
      units = units.filter(u => !reservedIds.has(u.id))
    }

    return NextResponse.json({
      trackingType: equipment.trackingType,
      totalStock: equipment.totalStock,
      availableStock: units.length,
      units: units.map(u => ({
        id: u.id,
        serialNumber: u.serialNumber,
        internalCode: u.internalCode,
        label: u.internalCode
          ? `${u.serialNumber} (${u.internalCode})`
          : u.serialNumber,
        notes: u.notes,
      })),
    })
  } catch (error) {
    console.error("Erro ao buscar unidades disponíveis:", error)
    return NextResponse.json(
      { error: "Erro ao buscar unidades disponíveis" },
      { status: 500 }
    )
  }
}
