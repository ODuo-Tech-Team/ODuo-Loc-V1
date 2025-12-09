import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import CustomerList from "./_components/customer-list"

// Server Component - dados carregados no servidor
export default async function ClientesPage() {
  const session = await auth()

  if (!session?.user?.tenantId) {
    redirect("/login")
  }

  // Fetch inicial no servidor - elimina loading spinner
  const customers = await prisma.customer.findMany({
    where: { tenantId: session.user.tenantId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      cpfCnpj: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      notes: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: { bookings: true },
      },
    },
    orderBy: { name: "asc" },
  })

  // Serializa datas para JSON
  const serializedCustomers = customers.map((customer) => ({
    ...customer,
    createdAt: customer.createdAt.toISOString(),
  }))

  return <CustomerList initialData={serializedCustomers} />
}
