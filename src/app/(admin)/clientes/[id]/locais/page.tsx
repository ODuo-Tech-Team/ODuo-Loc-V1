"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CustomerTabs } from "@/components/customer"
import { CustomerSitesList } from "@/components/customers/customer-sites-list"

interface Customer {
  id: string
  name: string
  bookings: Array<{ id: string }>
}

export default function CustomerLocaisPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await fetch(`/api/customers/${id}`)
        if (response.ok) {
          const data = await response.json()
          setCustomer(data)
        } else {
          router.push("/clientes")
        }
      } catch (error) {
        console.error("Error fetching customer:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomer()
  }, [id, router])

  if (loading || !customer) {
    return null
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/clientes" className="hover:text-foreground transition-colors">
          Clientes
        </Link>
        <span>/</span>
        <Link href={`/clientes/${id}`} className="hover:text-foreground transition-colors">
          {customer.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">Locais de Obra</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold font-headline tracking-wide flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            {customer.name}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">
            Gerencie os locais de obra e entrega
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {customer.bookings?.length || 0} orçamentos
        </Badge>
      </div>

      {/* Tabs */}
      <CustomerTabs customerId={id} activeTab="locais" />

      {/* Locais de Obra */}
      <CustomerSitesList customerId={id} />
    </div>
  )
}
