import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import EquipmentList from "./_components/equipment-list"

// Server Component - dados carregados no servidor
export default async function EquipamentosPage() {
  const session = await auth()

  if (!session?.user?.tenantId) {
    redirect("/login")
  }

  // Fetch inicial no servidor - elimina loading spinner
  const equipments = await prisma.equipment.findMany({
    where: { tenantId: session.user.tenantId },
    select: {
      id: true,
      name: true,
      category: true,
      status: true,
      pricePerDay: true,
      pricePerHour: true,
      quantity: true,
      images: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  })

  // Serializa datas para JSON
  const serializedEquipments = equipments.map((eq) => ({
    ...eq,
    pricePerDay: eq.pricePerDay ? Number(eq.pricePerDay) : null,
    pricePerHour: eq.pricePerHour ? Number(eq.pricePerHour) : null,
    createdAt: eq.createdAt.toISOString(),
  }))

  return <EquipmentList initialData={serializedEquipments} />
}
