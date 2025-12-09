"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { HelpTooltip } from "@/components/ui/help-tooltip"

// Schema simplificado para criação rápida
const quickEquipmentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  description: z.string().optional().nullable(),
  pricePerDay: z.number().min(0.01, "Preço deve ser maior que 0"),
  quantity: z.number().min(1, "Quantidade deve ser pelo menos 1").optional(),
})

type QuickEquipmentForm = z.infer<typeof quickEquipmentSchema>

export interface CreatedEquipment {
  id: string
  name: string
  category: string
  pricePerDay: number
  availableStock: number
}

interface NewEquipmentDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (equipment: CreatedEquipment) => void
}

export function NewEquipmentDialog({
  open,
  onClose,
  onCreated,
}: NewEquipmentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [trackingType, setTrackingType] = useState<"SERIALIZED" | "QUANTITY">("QUANTITY")

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<QuickEquipmentForm>({
    resolver: zodResolver(quickEquipmentSchema),
    defaultValues: {
      pricePerDay: 0,
      quantity: 1,
    },
  })

  const quantity = watch("quantity")

  const onSubmit = async (data: QuickEquipmentForm): Promise<void> => {
    try {
      // Validar quantidade para tipo QUANTITY
      if (trackingType === "QUANTITY" && (!data.quantity || data.quantity < 1)) {
        toast.error("Informe a quantidade do estoque")
        return
      }

      setLoading(true)

      // Converter pricePerDay para rentalPeriods (formato esperado pela API)
      const payload = {
        name: data.name,
        category: data.category,
        description: data.description,
        trackingType: trackingType,
        quantity: trackingType === "QUANTITY" ? (data.quantity || 1) : 0,
        rentalPeriods: [
          { days: 1, price: data.pricePerDay, label: "Diária" },
        ],
      }

      const response = await fetch("/api/equipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success("Equipamento cadastrado!")
        onCreated(result)
        reset()
        setTrackingType("QUANTITY")
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao criar equipamento")
      }
    } catch (error) {
      console.error("Error creating equipment:", error)
      toast.error("Erro ao criar equipamento")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setTrackingType("QUANTITY")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastro Rápido de Equipamento</DialogTitle>
          <DialogDescription>
            Preencha os dados básicos do equipamento
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label>
              Nome do Equipamento <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register("name")}
              placeholder="Ex: Betoneira 400L"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label>
                Categoria <span className="text-destructive">*</span>
              </Label>
              <HelpTooltip content="Categoria para organização do equipamento" />
            </div>
            <Input
              {...register("category")}
              placeholder="Ex: Construção, Elétrico, Hidráulico"
            />
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              {...register("description")}
              placeholder="Descrição do equipamento..."
              rows={2}
            />
          </div>

          {/* Tipo de Controle */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label>
                Tipo de Controle <span className="text-destructive">*</span>
              </Label>
              <HelpTooltip content="Por quantidade: controle apenas do total. Por serial: cada unidade tem código único." />
            </div>
            <Select
              value={trackingType}
              onValueChange={(value) => setTrackingType(value as "SERIALIZED" | "QUANTITY")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="QUANTITY">Por Quantidade</SelectItem>
                <SelectItem value="SERIALIZED">Por Número de Série</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantidade (apenas para QUANTITY) */}
          {trackingType === "QUANTITY" && (
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>
                  Quantidade <span className="text-destructive">*</span>
                </Label>
                <HelpTooltip content="Quantidade total em estoque" />
              </div>
              <Input
                {...register("quantity", { valueAsNumber: true })}
                type="number"
                min="1"
                placeholder="1"
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">{errors.quantity.message}</p>
              )}
            </div>
          )}

          {/* Preço */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label>
                Valor Diária <span className="text-destructive">*</span>
              </Label>
              <HelpTooltip content="Valor da diária de locação" />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                R$
              </span>
              <Input
                {...register("pricePerDay", { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                className="pl-10"
              />
            </div>
            {errors.pricePerDay && (
              <p className="text-sm text-destructive">{errors.pricePerDay.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                "Cadastrar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
