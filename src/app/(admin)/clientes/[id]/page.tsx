"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Loader2, Users } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CustomerTabs } from "@/components/customer"

const customerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().min(1, "Telefone é obrigatório"),
  cpfCnpj: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
})

type CustomerForm = z.infer<typeof customerSchema>

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string
  cpfCnpj: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  notes: string | null
  bookings: Array<{
    id: string
    startDate: string
    endDate: string
    equipment: {
      name: string
    }
  }>
}

export default function EditClientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [customer, setCustomer] = useState<Customer | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
  })

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await fetch(`/api/customers/${id}`)
        if (response.ok) {
          const data = await response.json()
          setCustomer(data)
          reset({
            name: data.name,
            email: data.email || "",
            phone: data.phone,
            cpfCnpj: data.cpfCnpj || "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "",
            zipCode: data.zipCode || "",
            notes: data.notes || "",
          })
        } else {
          alert("Cliente não encontrado")
          router.push("/clientes")
        }
      } catch (error) {
        console.error("Error fetching customer:", error)
        alert("Erro ao carregar cliente")
      } finally {
        setFetchLoading(false)
      }
    }

    fetchCustomer()
  }, [id, router, reset])

  const onSubmit = async (data: CustomerForm) => {
    try {
      setLoading(true)

      // Convert empty strings to null
      const cleanData = {
        ...data,
        email: data.email || null,
        cpfCnpj: data.cpfCnpj || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        zipCode: data.zipCode || null,
        notes: data.notes || null,
      }

      const response = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanData),
      })

      if (response.ok) {
        router.push("/clientes")
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || "Erro ao atualizar cliente")
      }
    } catch (error) {
      console.error("Error updating customer:", error)
      alert("Erro ao atualizar cliente")
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!customer) {
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
        <span className="text-foreground">{customer.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold font-headline tracking-wide flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            {customer.name}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">
            Gerencie as informações do cliente
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {customer.bookings?.length || 0} orçamentos
        </Badge>
      </div>

      {/* Tabs */}
      <CustomerTabs customerId={id} activeTab="detalhes" />

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline tracking-wide">Informações Básicas</CardTitle>
            <CardDescription>
              Dados principais do cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Nome do cliente"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                <Input
                  id="cpfCnpj"
                  {...register("cpfCnpj")}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                />
                {errors.cpfCnpj && (
                  <p className="text-sm text-destructive">
                    {errors.cpfCnpj.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="cliente@exemplo.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Telefone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="(00) 00000-0000"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline tracking-wide">Endereço</CardTitle>
            <CardDescription>Localização do cliente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                {...register("address")}
                placeholder="Rua, número, complemento"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  {...register("city")}
                  placeholder="Cidade"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  {...register("state")}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  {...register("zipCode")}
                  placeholder="00000-000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline tracking-wide">Observações</CardTitle>
            <CardDescription>
              Informações adicionais sobre o cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Adicione notas sobre o cliente..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/clientes">
            <Button type="button" variant="outline" disabled={loading}>
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="gap-2">
            <Save className="h-4 w-4" />
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>

    </div>
  )
}
