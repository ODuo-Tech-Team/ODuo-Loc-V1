"use client"

import { useState, useEffect, useCallback } from "react"
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
import { ArrowLeft, Save, Calculator, MapPin, Loader2, Percent, Truck, AlertTriangle, Calendar } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select"
import { HelpTooltip } from "@/components/ui/help-tooltip"
import { NewCustomerDialog, CreatedCustomer } from "@/components/customers/new-customer-dialog"
import { NewEquipmentDialog, CreatedEquipment } from "@/components/equipment/new-equipment-dialog"
import { useOnboardingRedirect } from "@/hooks/useOnboardingRedirect"
import { usePageTour, shouldAutoStartTour } from "@/hooks/usePageTour"
import { bookingTourSteps } from "@/lib/tours/tour-steps"

const bookingSchema = z.object({
  customerId: z.string().min(1, "Cliente é obrigatório"),
  equipmentId: z.string().min(1, "Equipamento é obrigatório"),
  customerSiteId: z.string().optional().nullable(),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().min(1, "Data de término é obrigatória"),
  totalPrice: z.number().min(0, "Preço deve ser maior ou igual a zero"),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
  notes: z.string().optional(),
  // Novos campos - aceita string vazia como valor válido (tratado no onSubmit)
  discountType: z.string().optional().nullable(),
  discountValue: z.number().optional().nullable(),
  discountReason: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
  freightType: z.string().optional().nullable(),
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

export default function NovaReservaPage() {
  const router = useRouter()
  const { redirectAfterAction } = useOnboardingRedirect()
  const [loading, setLoading] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [loadingEquipments, setLoadingEquipments] = useState(true)
  const [loadingSites, setLoadingSites] = useState(false)
  const [loadingRegions, setLoadingRegions] = useState(true)

  // Tour automático se veio do onboarding
  usePageTour({
    tourId: "booking-form",
    steps: bookingTourSteps,
    autoStart: shouldAutoStartTour("booking-form"),
    delay: 1000, // Mais tempo para carregar os selects
  })

  const [customers, setCustomers] = useState<Customer[]>([])
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [customerSites, setCustomerSites] = useState<CustomerSite[]>([])
  const [freightRegions, setFreightRegions] = useState<FreightRegion[]>([])

  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0)
  const [subtotal, setSubtotal] = useState<number>(0)
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [freightAmount, setFreightAmount] = useState<number>(0)

  // Dialogs de criação rápida
  const [newCustomerDialogOpen, setNewCustomerDialogOpen] = useState(false)
  const [newEquipmentDialogOpen, setNewEquipmentDialogOpen] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      status: "PENDING",
      totalPrice: 0,
      discountType: null,
      discountValue: null,
      freightType: null,
      freightValue: null,
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

  // Fetch inicial de clientes, equipamentos e regiões de frete
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, equipmentsRes, regionsRes] = await Promise.all([
          fetch("/api/customers?activeOnly=true"),
          fetch("/api/equipments?status=AVAILABLE"),
          fetch("/api/freight-regions"),
        ])

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
        setLoadingCustomers(false)
        setLoadingEquipments(false)
        setLoadingRegions(false)
      }
    }

    fetchData()
  }, [])

  // Carregar locais de obra quando cliente é selecionado
  const fetchCustomerSites = useCallback(async (customerId: string) => {
    if (!customerId) {
      setCustomerSites([])
      setValue("customerSiteId", null)
      return
    }

    setLoadingSites(true)
    try {
      const response = await fetch(`/api/customers/${customerId}/sites?activeOnly=true`)
      if (response.ok) {
        const sites = await response.json()
        setCustomerSites(sites)

        // Auto-selecionar local padrão
        const defaultSite = sites.find((s: CustomerSite) => s.isDefault)
        if (defaultSite) {
          setValue("customerSiteId", defaultSite.id)
        } else if (sites.length === 1) {
          setValue("customerSiteId", sites[0].id)
        } else {
          setValue("customerSiteId", null)
        }
      }
    } catch (error) {
      console.error("Error fetching customer sites:", error)
    } finally {
      setLoadingSites(false)
    }
  }, [setValue])

  useEffect(() => {
    if (watchCustomerId) {
      fetchCustomerSites(watchCustomerId)
    } else {
      setCustomerSites([])
    }
  }, [watchCustomerId, fetchCustomerSites])

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
        setValue("totalPrice", total)
      } else {
        setSubtotal(0)
        setDiscountAmount(0)
        setFreightAmount(0)
        setCalculatedPrice(0)
        setValue("totalPrice", 0)
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
    setValue,
  ])

  // Handlers para criação rápida
  const handleCustomerCreated = (customer: CreatedCustomer) => {
    const newCustomer: Customer = {
      id: customer.id,
      name: customer.name,
      tradeName: customer.tradeName,
      cpfCnpj: customer.cpfCnpj,
      personType: customer.personType,
      phone: null,
    }
    setCustomers(prev => [newCustomer, ...prev])
    setValue("customerId", customer.id)
    toast.success("Cliente selecionado!")
  }

  const handleEquipmentCreated = (equipment: CreatedEquipment) => {
    const newEquipment: Equipment = {
      id: equipment.id,
      name: equipment.name,
      category: equipment.category,
      pricePerDay: equipment.pricePerDay,
      availableStock: equipment.availableStock,
      status: "AVAILABLE",
    }
    setEquipments(prev => [newEquipment, ...prev])
    setValue("equipmentId", equipment.id)
    toast.success("Equipamento selecionado!")
  }

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

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanData),
      })

      if (response.ok) {
        toast.success("Orçamento criado com sucesso!")
        redirectAfterAction("/reservas")
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao criar orçamento")
      }
    } catch (error) {
      console.error("Error creating booking:", error)
      toast.error("Erro ao criar orçamento")
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

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/reservas">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground font-headline tracking-wide">Novo Orçamento</h1>
          <p className="text-muted-foreground mt-1">
            Crie um novo orçamento de locação
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações do Orçamento */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline tracking-wide">Informações do Orçamento</CardTitle>
            <CardDescription>
              Selecione o cliente, local de entrega e equipamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cliente e Local */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2" data-tour="booking-customer">
                <div className="flex items-center gap-1">
                  <Label>
                    Cliente <span className="text-destructive">*</span>
                  </Label>
                  <HelpTooltip content="Selecione o cliente ou clique em 'Adicionar novo' para cadastrar" />
                </div>
                <SearchableSelect
                  options={customerOptions}
                  value={watchCustomerId}
                  onSelect={(value) => setValue("customerId", value)}
                  onCreateNew={() => setNewCustomerDialogOpen(true)}
                  createNewLabel="Adicionar novo cliente"
                  placeholder="Selecione um cliente"
                  searchPlaceholder="Buscar por nome, CNPJ..."
                  emptyMessage="Nenhum cliente encontrado"
                  loading={loadingCustomers}
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
                  <div className="flex items-center gap-2 h-10 px-3 border rounded-md text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando locais...
                  </div>
                ) : customerSites.length === 0 && watchCustomerId ? (
                  <div className="flex items-center h-10 px-3 border rounded-md text-sm text-muted-foreground">
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
            <div className="space-y-2" data-tour="booking-equipment">
              <div className="flex items-center gap-1">
                <Label>
                  Equipamento <span className="text-destructive">*</span>
                </Label>
                <HelpTooltip content="Selecione o equipamento disponível para locação" />
              </div>
              <SearchableSelect
                options={equipmentOptions}
                value={watchEquipmentId}
                onSelect={(value) => setValue("equipmentId", value)}
                onCreateNew={() => setNewEquipmentDialogOpen(true)}
                createNewLabel="Adicionar novo equipamento"
                placeholder="Selecione um equipamento"
                searchPlaceholder="Buscar por nome, categoria..."
                emptyMessage="Nenhum equipamento disponível"
                loading={loadingEquipments}
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
        <Card data-tour="booking-dates">
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
                  {...register("startDate")}
                  min={new Date().toISOString().split("T")[0]}
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
                  {...register("endDate")}
                  min={watchStartDate || new Date().toISOString().split("T")[0]}
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
                  {...register("validUntil")}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Desconto e Frete */}
        <Card>
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
            <div className="grid gap-4 md:grid-cols-3" data-tour="booking-discount">
              <div className="space-y-2">
                <Label>Tipo de Desconto</Label>
                <Select
                  value={watchDiscountType || ""}
                  onValueChange={(value) => setValue("discountType", value as "PERCENTAGE" | "FIXED" | null || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sem desconto" />
                  </SelectTrigger>
                  <SelectContent>
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
                  {...register("discountValue", { valueAsNumber: true })}
                  placeholder="0"
                  disabled={!watchDiscountType}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountReason">Motivo do Desconto</Label>
                <Input
                  id="discountReason"
                  {...register("discountReason")}
                  placeholder="Ex: Cliente fidelidade"
                  disabled={!watchDiscountType}
                />
              </div>
            </div>

            {/* Frete */}
            <div className="grid gap-4 md:grid-cols-3" data-tour="booking-freight">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="flex items-center gap-1">
                    <Truck className="h-4 w-4" />
                    Tipo de Frete
                  </Label>
                </div>
                <Select
                  value={watchFreightType || ""}
                  onValueChange={(value) => {
                    setValue("freightType", value as "FREE" | "FIXED" | "BY_REGION" | null || null)
                    setValue("freightValue", null)
                    setValue("freightRegionId", null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sem frete" />
                  </SelectTrigger>
                  <SelectContent>
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
          <Card className="bg-primary/5 border-primary/20" data-tour="booking-total">
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
                  <div className="flex justify-between text-sm text-green-600">
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
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Frete Grátis</span>
                    <span>R$ 0,00</span>
                  </div>
                )}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(calculatedPrice)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Multas */}
        <Card>
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
                  {...register("lateFeePercent", { valueAsNumber: true })}
                  placeholder="2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status e Observações */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline tracking-wide">Status e Observações</CardTitle>
            <CardDescription>
              Defina o status inicial e adicione observações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="status">
                  Status <span className="text-destructive">*</span>
                </Label>
                <HelpTooltip content="Pendente: aguardando confirmação. Confirmada: orçamento aprovado." />
              </div>
              <Select
                defaultValue="PENDING"
                onValueChange={(value: BookingForm["status"]) => setValue("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
            <Button type="button" variant="outline" disabled={loading}>
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="gap-2">
            <Save className="h-4 w-4" />
            {loading ? "Salvando..." : "Salvar Orçamento"}
          </Button>
        </div>
      </form>

      {/* Dialogs de criação rápida */}
      <NewCustomerDialog
        open={newCustomerDialogOpen}
        onClose={() => setNewCustomerDialogOpen(false)}
        onCreated={handleCustomerCreated}
      />

      <NewEquipmentDialog
        open={newEquipmentDialogOpen}
        onClose={() => setNewEquipmentDialogOpen(false)}
        onCreated={handleEquipmentCreated}
      />
    </div>
  )
}
