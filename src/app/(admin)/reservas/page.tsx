import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import BookingList from "./_components/booking-list"

// Server Component - dados carregados no servidor
export default async function ReservasPage() {
  const session = await auth()

  if (!session?.user?.tenantId) {
    redirect("/login")
  }

  // Fetch inicial no servidor - elimina loading spinner
  const bookings = await prisma.booking.findMany({
    where: { tenantId: session.user.tenantId },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      totalPrice: true,
      status: true,
      notes: true,
      equipment: {
        select: {
          id: true,
          name: true,
          category: true,
          pricePerDay: true,
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Serializa datas e Decimal para JSON
  // Filtra bookings sem equipment (edge case)
  const serializedBookings = bookings
    .filter((booking) => booking.equipment !== null)
    .map((booking) => ({
      ...booking,
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
      totalPrice: Number(booking.totalPrice),
      equipment: {
        id: booking.equipment!.id,
        name: booking.equipment!.name,
        category: booking.equipment!.category,
        pricePerDay: Number(booking.equipment!.pricePerDay),
      },
    }))

  return <BookingList initialData={serializedBookings} />
}
