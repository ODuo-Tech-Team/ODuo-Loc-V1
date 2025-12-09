"use client"

import { useState, useEffect, use, useCallback } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Calculator, Loader2, MapPin, Percent, Truck, AlertTriangle, Calendar } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select"
import { HelpTooltip } from "@/components/ui/help-tooltip"
import { BookingTabs } from "@/components/booking"
import { AdminPageHeader } from "@/components/admin"

const bookingSchema = z.object({
  customerId: z.string().min(1, "Cliente é obrigatório"),
  equipmentId: z.string().min(1, "Equipamento é obrigatório"),
  customerSiteId: z.string().optional().nullable(),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().min(1, "Data de término é obrigatória"),
  totalPrice: z.number().min(0, "Preço deve ser maior ou igual a zero"),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
  notes: z.string().optional(),
  // Novos campos
  discountType: z.enum(["PERCENTAGE", "FIXED"]).optional().nullable(),
  discountValue: z.number().optional().nullable(),
  discountReason: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
  freightType: z.enum(["FREE", "FIXED", "BY_REGION"]).optional().nullable(),
  freightValue: z.number().optional().nullable(),
  freightRegionId: z.string().optional().nullable(),
  cancellationFeePercent: z.number().optional().nullable(),
  lateFeePercent: z.number().optional().nullable(),
})

type BookingForm = z.infer<typeof bookingSchema>

interface Customer {
  id: string
  name: string
  tradeName: string | null
  cpfCnpj: string | null
  personType: string
  phone: string | null
}

interface Equipment {
  id: string
  name: string
  category: string
  pricePerDay: number
  availableStock: number
  status: string
}

interface CustomerSite {
  id: string
  name: string
  street: string | null
  number: string | null
  city: string | null
  state: string | null
  isDefault: boolean
}

interface FreightRegion {
  id: string
  name: string
  price: number
  cities: string[]
}

interface Booking {
  id: string
  customerId: string
  equipmentId: string
  customerSiteId: string | null
  startDate: string
  endDate: string
  totalPrice: number
  subtotal: number | null
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"
  notes: string | null
  discountType: "PERCENTAGE" | "FIXED" | null
  discountValue: number | null
  discountReason: string | null
  validUntil: string | null
  freightType: "FREE" | "FIXED" | "BY_REGION" | null
  freightValue: number | null
  freightRegionId: string | null
  cancellationFeePercent: number | null
  lateFeePercent: number | null
  customer: {
    id: string
    name: string
    tradeName: string | null
    cpfCnpj: string | null
  }
  equipment: {
    id: string
    name: string
    category: string
    pricePerDay: number
  }
}

const statusLabels = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Concluído",
}

const statusColors = {
  PENDING: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  CONFIRMED: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  CANCELLED: "bg-red-500/20 text-red-400 border-red-500/40",
  COMPLETED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
}

export default function EditReservaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [loadingSites, setLoadingSites] = useState(false)
  const [loadingRegions, setLoadingRegions] = useState(true)

  const [booking, setBooking] = useState<Booking | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [customerSites, setCustomerSites] = useState<CustomerSite[]>([])
  const [freightRegions, setFreightRegions] = useState<FreightRegion[]>([])

  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0)
  const [subtotal, setSubtotal] = useState<number>(0)
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [freightAmount, setFreightAmount] = useState<number>(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      cancellationFeePercent: 10,
      lateFeePercent: 2,
    },
  })

  const watchCustomerId = watch("customerId")
  const watchEquipmentId = watch("equipmentId")
  const watchCustomerSiteId = watch("customerSiteId")
  const watchStartDate = watch("startDate")
  const watchEndDate = watch("endDate")
  const watchDiscountType = watch("discountType")
  const watchDiscountValue = watch("discountValue")
  const watchFreightType = watch("freightType")
  const watchFreightValue = watch("freightValue")
  const watchFreightRegionId = watch("freightRegionId")

  // Carregar locais de obra quando cliente é selecionado
  const fetchCustomerSites = useCallback(async (customerId: string) => {
    if (!customerId) {
      setCustomerSites([])
      return
    }

    setLoadingSites(true)
    try {
      const response = await fetch(`/api/customers/${customerId}/sites?activeOnly=true`)
      if (response.ok) {
        const sites = await response.json()
        setCustomerSites(sites)
      }
    } catch (error) {
      console.error("Error fetching customer sites:", error)
    } finally {
      setLoadingSites(false)
    }
  }, [])

  // Fetch inicial de dados
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingRes, customersRes, equipmentsRes, regionsRes] = await Promise.all([
          fetch(`/api/bookings/${id}`),
          fetch("/api/customers"),
          fetch("/api/equipments"),
          fetch("/api/freight-regions"),
        ])

        if (bookingRes.ok) {
          const bookingData: Booking = await bookingRes.json()
          setBooking(bookingData)

          // Format dates for input with validation
          const formatDateForInput = (dateValue: string | Date | null | undefined): string => {
            if (!dateValue) return ""
            try {
              const date = new Date(dateValue)
              if (isNaN(date.getTime())) return ""
              return date.toISOString().split("T")[0]
            } catch {
              return ""
            }
          }

          const startDate = formatDateForInput(bookingData.startDate)
          const endDate = formatDateForInput(bookingData.endDate)
          const validUntil = formatDateForInput(bookingData.validUntil)

          reset({
            customerId: bookingData.customerId,
            equipmentId: bookingData.equipmentId,
            customerSiteId: bookingData.customerSiteId,
            startDate,
            endDate,
            totalPrice: bookingData.totalPrice,
            status: bookingData.status,
            notes: bookingData.notes || "",
            discountType: bookingData.discountType,
            discountValue: bookingData.discountValue,
            discountReason: bookingData.discountReason || "",
            validUntil,
            freightType: bookingData.freightType,
            freightValue: bookingData.freightValue,
            freightRegionId: bookingData.freightRegionId,
            cancellationFeePercent: bookingData.cancellationFeePercent ?? 10,
            lateFeePercent: bookingData.lateFeePercent ?? 2,
          })

          // Carregar sites do cliente
          if (bookingData.customerId) {
            fetchCustomerSites(bookingData.customerId)
          }

          // Inicializar subtotal se disponível
          if (bookingData.subtotal) {
            setSubtotal(bookingData.subtotal)
          }
        } else {
          toast.error("Orçamento não encontrado")
          router.push("/reservas")
        }

        if (customersRes.ok) {
          const customersData = await customersRes.json()
          setCustomers(customersData)
        }

        if (equipmentsRes.ok) {
          const equipmentsData = await equipmentsRes.json()
          setEquipments(equipmentsData)
        }

        if (regionsRes.ok) {
          const regionsData = await regionsRes.json()
          setFreightRegions(regionsData.regions || [])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Erro ao carregar dados")
      } finally {
        setFetchLoading(false)
        setLoadingRegions(false)
      }
    }

    fetchData()
  }, [id, router, reset, fetchCustomerSites])

  // Carregar sites quando cliente muda
  useEffect(() => {
    if (watchCustomerId && !fetchLoading) {
      fetchCustomerSites(watchCustomerId)
    }
  }, [watchCustomerId, fetchCustomerSites, fetchLoading])

  // Atualizar equipamento selecionado
  useEffect(() => {
    if (watchEquipmentId) {
      const equipment = equipments.find((e) => e.id === watchEquipmentId)
      setSelectedEquipment(equipment || null)
    } else {
      setSelectedEquipment(null)
    }
  }, [watchEquipmentId, equipments])

  // Calcular preço com desconto e frete
  useEffect(() => {
    if (selectedEquipment && watchStartDate && watchEndDate) {
      const start = new Date(watchStartDate)
      const end = new Date(watchEndDate)
      const days = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (days > 0) {
        // Subtotal (equipamento x dias)
        const equipmentTotal = days * selectedEquipment.pricePerDay
        setSubtotal(equipmentTotal)

        // Calcular desconto
        let discount = 0
        if (watchDiscountType && watchDiscountValue && watchDiscountValue > 0) {
          if (watchDiscountType === "PERCENTAGE") {
            discount = equipmentTotal * (watchDiscountValue / 100)
          } else {
            discount = watchDiscountValue
          }
        }
        setDiscountAmount(discount)

        // Calcular frete
        let freight = 0
        if (watchFreightType) {
          if (watchFreightType === "FREE") {
            freight = 0
          } else if (watchFreightType === "FIXED" && watchFreightValue) {
            freight = watchFreightValue
          } else if (watchFreightType === "BY_REGION" && watchFreightRegionId) {
            const region = freightRegions.find(r => r.id === watchFreightRegionId)
            freight = region?.price || 0
          }
        }
        setFreightAmount(freight)

        // Total final
        const total = Math.max(0, equipmentTotal - discount + freight)
        setCalculatedPrice(total)
      } else {
        setSubtotal(0)
        setDiscountAmount(0)
        setFreightAmount(0)
        setCalculatedPrice(0)
      }
    }
  }, [
    selectedEquipment,
    watchStartDate,
    watchEndDate,
    watchDiscountType,
    watchDiscountValue,
    watchFreightType,
    watchFreightValue,
    watchFreightRegionId,
    freightRegions,
  ])

  const onSubmit = async (data: BookingForm) => {
    try {
      setLoading(true)

      const cleanData = {
        ...data,
        notes: data.notes || null,
        customerSiteId: data.customerSiteId || null,
        subtotal: subtotal,
        discountType: data.discountType || null,
        discountValue: data.discountValue || null,
        discountReason: data.discountReason || null,
        validUntil: data.validUntil || null,
        freightType: data.freightType || null,
        freightValue: freightAmount || null,
        freightRegionId: data.freightRegionId || null,
        cancellationFeePercent: data.cancellationFeePercent || null,
        lateFeePercent: data.lateFeePercent || null,
      }

      const response = await fetch(`/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanData),
      })

      if (response.ok) {
        toast.success("Orçamento atualizado com sucesso!")
        router.push("/reservas")
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao atualizar orçamento")
      }
    } catch (error) {
      console.error("Error updating booking:", error)
      toast.error("Erro ao atualizar orçamento")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  // Preparar opções para os selects
  const customerOptions: SearchableSelectOption[] = customers.map((c) => ({
    value: c.id,
    label: c.tradeName || c.name,
    description: c.cpfCnpj || (c.phone ? `Tel: ${c.phone}` : undefined),
  }))

  const equipmentOptions: SearchableSelectOption[] = equipments.map((e) => ({
    value: e.id,
    label: e.name,
    description: `${e.category} - ${formatCurrency(e.pricePerDay)}/dia`,
  }))

  const siteOptions: SearchableSelectOption[] = customerSites.map((s) => ({
    value: s.id,
    label: s.isDefault ? `${s.name} (Padrão)` : s.name,
    description: s.street
      ? `${s.street}${s.number ? `, ${s.number}` : ""} - ${s.city}/${s.state}`
      : undefined,
  }))

  const regionOptions: SearchableSelectOption[] = freightRegions.map((r) => ({
    value: r.id,
    label: r.name,
    description: formatCurrency(r.price),
  }))

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!booking) {
    return null
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Editar Orçamento"
        description="Atualize as informações do orçamento"
        icon={Calendar}
        iconColor="text-purple-400"
        backHref="/reservas"
        backLabel="Voltar para Orçamentos"
      >
        <Badge
          variant="outline"
          className={statusColors[booking.status]}
        >
          {statusLabels[booking.status]}
        </Badge>
      </AdminPageHeader>

      {/* Navigation Tabs */}
      <BookingTabs bookingId={id} activeTab="detalhes" />

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações do Orçamento */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="font-headline tracking-wide">Informações do Orçamento</CardTitle>
            <CardDescription>
              Selecione o cliente, local de entrega e equipamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cliente e Local */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label>
                    Cliente <span className="text-destructive">*</span>
                  </Label>
                  <HelpTooltip content="Selecione o cliente do orçamento" />
                </div>
                <SearchableSelect
                  options={customerOptions}
                  value={watchCustomerId}
                  onSelect={(value) => setValue("customerId", value)}
                  placeholder="Selecione um cliente"
                  searchPlaceholder="Buscar por nome, CNPJ..."
                  emptyMessage="Nenhum cliente encontrado"
                />
                {errors.customerId && (
                  <p className="text-sm text-destructive">
                    {errors.customerId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Local de Entrega
                  </Label>
                  <HelpTooltip content="Selecione onde o equipamento será entregue. Cadastre locais no cadastro do cliente." />
                </div>
                {loadingSites ? (
                  <div className="flex items-center gap-2 h-10 px-3 border border-zinc-700 rounded-md text-sm text-muted-foreground bg-zinc-800/50">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando locais...
                  </div>
                ) : customerSites.length === 0 && watchCustomerId ? (
                  <div className="flex items-center h-10 px-3 border border-zinc-700 rounded-md text-sm text-muted-foreground bg-zinc-800/50">
                    Nenhum local cadastrado para este cliente
                  </div>
                ) : (
                  <SearchableSelect
                    options={siteOptions}
                    value={watchCustomerSiteId || undefined}
                    onSelect={(value) => setValue("customerSiteId", value)}
                    placeholder="Selecione um local"
                    searchPlaceholder="Buscar local..."
                    emptyMessage="Nenhum local cadastrado"
                    disabled={!watchCustomerId || customerSites.length === 0}
                  />
                )}
              </div>
            </div>

            {/* Equipamento */}
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>
                  Equipamento <span className="text-destructive">*</span>
                </Label>
                <HelpTooltip content="Selecione o equipamento para locação" />
              </div>
              <SearchableSelect
                options={equipmentOptions}
                value={watchEquipmentId}
                onSelect={(value) => setValue("equipmentId", value)}
                placeholder="Selecione um equipamento"
                searchPlaceholder="Buscar por nome, categoria..."
                emptyMessage="Nenhum equipamento encontrado"
              />
              {errors.equipmentId && (
                <p className="text-sm text-destructive">
                  {errors.equipmentId.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Período e Validade */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="font-headline tracking-wide flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Período e Validade
            </CardTitle>
            <CardDescription>
              Defina as datas da locação e validade do orçamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="startDate">
                    Data de Início <span className="text-destructive">*</span>
                  </Label>
                  <HelpTooltip content="Data de início da locação" />
                </div>
                <Input
                  id="startDate"
                  type="date"
                  className="bg-zinc-800/50 border-zinc-700"
                  {...register("startDate")}
                />
                {errors.startDate && (
                  <p className="text-sm text-destructive">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="endDate">
                    Data de Término <span className="text-destructive">*</span>
                  </Label>
                  <HelpTooltip content="Data prevista de devolução" />
                </div>
                <Input
                  id="endDate"
                  type="date"
                  className="bg-zinc-800/50 border-zinc-700"
                  {...register("endDate")}
                  min={watchStartDate}
                />
                {errors.endDate && (
                  <p className="text-sm text-destructive">
                    {errors.endDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="validUntil">
                    Validade do Orçamento
                  </Label>
                  <HelpTooltip content="Até quando este orçamento é válido. Após esta data, expira automaticamente." />
                </div>
                <Input
                  id="validUntil"
                  type="date"
                  className="bg-zinc-800/50 border-zinc-700"
                  {...register("validUntil")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Desconto e Frete */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="font-headline tracking-wide flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Desconto e Frete
            </CardTitle>
            <CardDescription>
              Configure descontos e valor do frete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Desconto */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Tipo de Desconto</Label>
                <Select
                  value={watchDiscountType || "none"}
                  onValueChange={(value) => {
                    if (value === "none") {
                      setValue("discountType", null)
                      setValue("discountValue", null)
                    } else {
                      setValue("discountType", value as "PERCENTAGE" | "FIXED")
                    }
                  }}
                >
                  <SelectTrigger className="bg-zinc-800/50 border-zinc-700">
                    <SelectValue placeholder="Sem desconto" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="none">Sem desconto</SelectItem>
                    <SelectItem value="PERCENTAGE">Porcentagem (%)</SelectItem>
                    <SelectItem value="FIXED">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountValue">
                  {watchDiscountType === "PERCENTAGE" ? "Desconto (%)" : "Desconto (R$)"}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  step={watchDiscountType === "PERCENTAGE" ? "1" : "0.01"}
                  className="bg-zinc-800/50 border-zinc-700"
                  {...register("discountValue", { valueAsNumber: true })}
                  placeholder="0"
                  disabled={!watchDiscountType}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountReason">Motivo do Desconto</Label>
                <Input
                  id="discountReason"
                  className="bg-zinc-800/50 border-zinc-700"
                  {...register("discountReason")}
                  placeholder="Ex: Cliente fidelidade"
                  disabled={!watchDiscountType}
                />
              </div>
            </div>

            {/* Frete */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="flex items-center gap-1">
                    <Truck className="h-4 w-4" />
                    Tipo de Frete
                  </Label>
                </div>
                <Select
                  value={watchFreightType || "none"}
                  onValueChange={(value) => {
                    if (value === "none") {
                      setValue("freightType", null)
                      setValue("freightValue", null)
                      setValue("freightRegionId", null)
                    } else {
                      setValue("freightType", value as "FREE" | "FIXED" | "BY_REGION")
                      setValue("freightValue", null)
                      setValue("freightRegionId", null)
                    }
                  }}
                >
                  <SelectTrigger className="bg-zinc-800/50 border-zinc-700">
                    <SelectValue placeholder="Sem frete" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="none">Sem frete</SelectItem>
                    <SelectItem value="FREE">Frete Grátis</SelectItem>
                    <SelectItem value="FIXED">Valor Fixo</SelectItem>
                    <SelectItem value="BY_REGION">Por Região</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {watchFreightType === "FIXED" && (
                <div className="space-y-2">
                  <Label htmlFor="freightValue">Valor do Frete (R$)</Label>
                  <Input
                    id="freightValue"
                    type="number"
                    step="0.01"
                    className="bg-zinc-800/50 border-zinc-700"
                    {...register("freightValue", { valueAsNumber: true })}
                    placeholder="0,00"
                  />
                </div>
              )}

              {watchFreightType === "BY_REGION" && (
                <div className="space-y-2">
                  <Label>Região</Label>
                  <SearchableSelect
                    options={regionOptions}
                    value={watchFreightRegionId || undefined}
                    onSelect={(value) => setValue("freightRegionId", value)}
                    placeholder="Selecione uma região"
                    searchPlaceholder="Buscar região..."
                    emptyMessage="Nenhuma região cadastrada"
                    loading={loadingRegions}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resumo de Valores */}
        {subtotal > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="font-headline tracking-wide flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Resumo de Valores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal (Equipamento)</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-400">
                    <span>Desconto {watchDiscountType === "PERCENTAGE" ? `(${watchDiscountValue}%)` : ""}</span>
                    <span>- {formatCurrency(discountAmount)}</span>
                  </div>
                )}
                {freightAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Frete</span>
                    <span>+ {formatCurrency(freightAmount)}</span>
                  </div>
                )}
                {watchFreightType === "FREE" && (
                  <div className="flex justify-between text-sm text-green-400">
                    <span>Frete Grátis</span>
                    <span>R$ 0,00</span>
                  </div>
                )}
                <div className="border-t border-zinc-700 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Calculado</span>
                    <span className="text-primary">{formatCurrency(calculatedPrice)}</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 hover:bg-zinc-800"
                  onClick={() => setValue("totalPrice", calculatedPrice)}
                >
                  Aplicar Valor Calculado
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Valor Total Manual */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="font-headline tracking-wide">Valor Total</CardTitle>
            <CardDescription>
              O valor é calculado automaticamente, mas pode ser ajustado manualmente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="totalPrice">
                Valor Total <span className="text-destructive">*</span>
              </Label>
              <Input
                id="totalPrice"
                type="number"
                step="0.01"
                className="bg-zinc-800/50 border-zinc-700"
                {...register("totalPrice", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.totalPrice && (
                <p className="text-sm text-destructive">
                  {errors.totalPrice.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Multas */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="font-headline tracking-wide flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Multas Contratuais
            </CardTitle>
            <CardDescription>
              Configure as multas por cancelamento e atraso na devolução
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="cancellationFeePercent">
                    Multa por Cancelamento (%)
                  </Label>
                  <HelpTooltip content="Porcentagem do valor total cobrada em caso de cancelamento" />
                </div>
                <Input
                  id="cancellationFeePercent"
                  type="number"
                  step="1"
                  className="bg-zinc-800/50 border-zinc-700"
                  {...register("cancellationFeePercent", { valueAsNumber: true })}
                  placeholder="10"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="lateFeePercent">
                    Multa por Atraso (% por dia)
                  </Label>
                  <HelpTooltip content="Porcentagem do valor total cobrada por cada dia de atraso na devolução" />
                </div>
                <Input
                  id="lateFeePercent"
                  type="number"
                  step="0.5"
                  className="bg-zinc-800/50 border-zinc-700"
                  {...register("lateFeePercent", { valueAsNumber: true })}
                  placeholder="2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status e Observações */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="font-headline tracking-wide">Status e Observações</CardTitle>
            <CardDescription>
              Atualize o status e adicione observações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="status">
                  Status <span className="text-destructive">*</span>
                </Label>
                <HelpTooltip content="Pendente: aguardando confirmação. Confirmado: orçamento aprovado." />
              </div>
              <Select
                value={watch("status")}
                onValueChange={(value: BookingForm["status"]) => setValue("status", value)}
              >
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                  <SelectItem value="COMPLETED">Concluído</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-destructive">
                  {errors.status.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="notes">Observações</Label>
                <HelpTooltip content="Adicione informações relevantes como condições especiais, exigências do cliente, etc." />
              </div>
              <Textarea
                id="notes"
                className="bg-zinc-800/50 border-zinc-700"
                {...register("notes")}
                placeholder="Adicione observações sobre o orçamento..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/reservas">
            <Button type="button" variant="outline" disabled={loading} className="hover:bg-zinc-800">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="gap-2 transition-colors">
            <Save className="h-4 w-4" />
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  )
}
