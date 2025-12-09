import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const tenantId = session.user.tenantId

    // Buscar em paralelo
    const [equipments, customers, bookings] = await Promise.all([
      // Equipamentos
      prisma.equipment.findMany({
        where: {
          tenantId,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          category: true,
          status: true,
        },
        take: 5,
      }),

      // Clientes
      prisma.customer.findMany({
        where: {
          tenantId,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
            { cpfCnpj: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
        take: 5,
      }),

      // Reservas (buscar por número ou nome do cliente)
      prisma.booking.findMany({
        where: {
          tenantId,
          OR: [
            { bookingNumber: { contains: query, mode: "insensitive" } },
            { customer: { name: { contains: query, mode: "insensitive" } } },
          ],
        },
        select: {
          id: true,
          bookingNumber: true,
          status: true,
          startDate: true,
          customer: {
            select: { name: true },
          },
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
    ])

    // Formatar resultados
    const results = [
      ...equipments.map((e) => ({
        type: "equipment" as const,
        id: e.id,
        title: e.name,
        subtitle: e.category,
        status: e.status,
        url: `/equipamentos/${e.id}`,
      })),
      ...customers.map((c) => ({
        type: "customer" as const,
        id: c.id,
        title: c.name,
        subtitle: c.email || c.phone || "",
        url: `/clientes/${c.id}`,
      })),
      ...bookings.map((b) => ({
        type: "booking" as const,
        id: b.id,
        title: b.bookingNumber,
        subtitle: b.customer.name,
        status: b.status,
        url: `/reservas/${b.id}`,
      })),
    ]

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Erro na busca:", error)
    return NextResponse.json({ error: "Erro na busca" }, { status: 500 })
  }
}
