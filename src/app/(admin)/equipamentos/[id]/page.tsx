"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AdminPageHeader } from "@/components/admin"
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
import { ImageUpload } from "@/components/ui/image-upload"
import { RentalPeriodInput, type RentalPeriod, EquipmentTabs, EquipmentDetailsPageSkeleton } from "@/components/equipment"
import { toast } from "sonner"

const equipmentSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  description: z.string().optional(),
  category: z.string().min(2, "Categoria é obrigatória"),
  images: z.array(z.string()),
  pricePerHour: z.string().optional(),
  quantity: z.string().optional(), // Opcional para SERIALIZED, obrigatório para QUANTITY
  status: z.enum(["AVAILABLE", "RENTED", "MAINTENANCE", "INACTIVE"]),
})

type EquipmentFormData = z.infer<typeof equipmentSchema>

export default function EditarEquipamentoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [rentalPeriods, setRentalPeriods] = useState<RentalPeriod[]>([])
  const [trackingType, setTrackingType] = useState<"SERIALIZED" | "QUANTITY">("SERIALIZED")

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
  })

  const status = watch("status")
  const images = watch("images")

  useEffect(() => {
    fetchEquipment()
  }, [])

  const fetchEquipment = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/equipments/${resolvedParams.id}`)

      if (!response.ok) {
        throw new Error("Equipamento não encontrado")
      }

      const equipment = await response.json()

      // Preencher formulário
      setValue("name", equipment.name)
      setValue("description", equipment.description || "")
      setValue("category", equipment.category)
      setValue("images", equipment.images || [])
      setValue(
        "pricePerHour",
        equipment.pricePerHour ? String(equipment.pricePerHour) : ""
      )
      setValue("quantity", String(equipment.quantity))
      setValue("status", equipment.status)

      // Carregar períodos de locação
      if (equipment.rentalPeriods?.length) {
        setRentalPeriods(equipment.rentalPeriods)
      } else if (equipment.pricePerDay) {
        // Compatibilidade: criar período padrão se não tiver períodos
        setRentalPeriods([{
          days: 1,
          price: equipment.pricePerDay,
          label: "Diária",
        }])
      }

      // Carregar tipo de rastreamento
      if (equipment.trackingType) {
        setTrackingType(equipment.trackingType)
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar equipamento")
      router.push("/equipamentos")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: EquipmentFormData) => {
    // Validar períodos de locação
    if (rentalPeriods.length === 0) {
      toast.error("Adicione pelo menos um período de locação")
      return
    }

    // Validar quantidade para tipo QUANTITY
    if (trackingType === "QUANTITY" && (!data.quantity || parseInt(data.quantity) < 1)) {
      toast.error("Informe a quantidade do estoque")
      return
    }

    setIsLoading(true)

    try {
      // Converter strings para números
      const payload: Record<string, unknown> = {
        name: data.name,
        description: data.description || null,
        category: data.category,
        images: data.images,
        pricePerHour: data.pricePerHour ? parseFloat(data.pricePerHour) : null,
        status: data.status,
        rentalPeriods: rentalPeriods.map(p => ({
          days: p.days,
          price: p.price,
          label: p.label,
        })),
      }

      // Incluir quantity apenas para tipo QUANTITY
      if (trackingType === "QUANTITY" && data.quantity) {
        payload.quantity = parseInt(data.quantity)
      }

      const response = await fetch(`/api/equipments/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao atualizar equipamento")
      }

      toast.success("Equipamento atualizado com sucesso!")
      router.push("/equipamentos")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar equipamento")
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return <EquipmentDetailsPageSkeleton />
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Editar Equipamento"
        description="Atualize as informações do equipamento"
        icon={Package}
        iconColor="text-amber-400"
        backHref="/equipamentos"
        backLabel="Voltar para Equipamentos"
      />

      {/* Navigation Tabs */}
      <EquipmentTabs equipmentId={resolvedParams.id} activeTab="detalhes" trackingType={trackingType} />

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="font-headline tracking-wide">Informações do Equipamento</CardTitle>
            <CardDescription>
              Atualize os dados do equipamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                placeholder="Ex: Betoneira 400L"
                disabled={isLoading}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o equipamento, características, especificações..."
                rows={4}
                disabled={isLoading}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Input
                id="category"
                placeholder="Ex: Construção, Jardinagem, Festa"
                disabled={isLoading}
                {...register("category")}
              />
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category.message}</p>
              )}
            </div>

            {/* Imagens */}
            <div className="space-y-2">
              <Label>Imagens do Equipamento</Label>
              <ImageUpload
                value={images || []}
                onChange={(urls) => setValue("images", urls)}
                maxImages={5}
                disabled={isLoading}
              />
              {errors.images && (
                <p className="text-sm text-red-500">{errors.images.message}</p>
              )}
            </div>

            {/* Períodos de Locação */}
            <RentalPeriodInput
              value={rentalPeriods}
              onChange={setRentalPeriods}
              disabled={isLoading}
            />

            {/* Preço por Hora (opcional) */}
            <div className="space-y-2">
              <Label htmlFor="pricePerHour">Preço por Hora (R$) - Opcional</Label>
              <Input
                id="pricePerHour"
                type="number"
                step="0.01"
                placeholder="0.00 (para locações por hora)"
                disabled={isLoading}
                className="max-w-xs"
                {...register("pricePerHour")}
              />
              <p className="text-xs text-muted-foreground">
                Preencha apenas se oferecer locação por hora
              </p>
            </div>

            {/* Quantidade (apenas para QUANTITY) e Status */}
            <div className="grid gap-6 md:grid-cols-2">
              {trackingType === "QUANTITY" && (
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade em Estoque *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    disabled={isLoading}
                    {...register("quantity")}
                  />
                  {errors.quantity && (
                    <p className="text-sm text-red-500">
                      {errors.quantity.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Total de unidades disponíveis deste equipamento
                  </p>
                </div>
              )}

              {trackingType === "SERIALIZED" && (
                <div className="space-y-2">
                  <Label>Tipo de Controle</Label>
                  <div className="p-3 bg-zinc-900/50 rounded-md border border-zinc-800">
                    <p className="text-sm font-medium">Por Número de Série</p>
                    <p className="text-xs text-muted-foreground">
                      O estoque é calculado a partir das unidades cadastradas
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setValue("status", value as any)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Disponível</SelectItem>
                    <SelectItem value="RENTED">Alugado</SelectItem>
                    <SelectItem value="MAINTENANCE">Manutenção</SelectItem>
                    <SelectItem value="INACTIVE">Inativo</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-red-500">{errors.status.message}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
              <Link href="/equipamentos" className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
