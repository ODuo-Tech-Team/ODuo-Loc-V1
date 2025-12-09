"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  stockMovementSchema,
  movementTypeLabels,
  type StockMovementInput,
  type MovementType,
} from "@/lib/validations/stock"

interface StockMovementFormProps {
  equipmentId: string
  equipmentName: string
  currentStock: {
    available: number
    rented: number // Em locação (não reserva)
    maintenance: number
    damaged: number
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

// Tipos permitidos para movimentação manual
const allowedTypes: MovementType[] = [
  "PURCHASE",
  "ADJUSTMENT",
  "DAMAGE",
  "LOSS",
  "MAINTENANCE_OUT",
  "MAINTENANCE_IN",
]

export function StockMovementForm({
  equipmentId,
  equipmentName,
  currentStock,
  open,
  onOpenChange,
  onSuccess,
}: StockMovementFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<StockMovementInput>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: {
      type: "PURCHASE",
      quantity: 1,
      reason: "",
    },
  })

  const selectedType = form.watch("type")

  // Determinar estoque máximo baseado no tipo de movimentação
  const getMaxQuantity = () => {
    switch (selectedType) {
      case "DAMAGE":
      case "LOSS":
      case "MAINTENANCE_OUT":
        return currentStock.available
      case "MAINTENANCE_IN":
        return currentStock.maintenance
      default:
        return 999
    }
  }

  const onSubmit = async (data: StockMovementInput) => {
    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/stock/${equipmentId}/movement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || "Erro ao registrar movimentação")
      }

      toast.success("Movimentação registrada com sucesso")
      form.reset()
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao registrar movimentação")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Movimentação de Estoque</DialogTitle>
          <DialogDescription>
            Equipamento: <strong>{equipmentName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Estoque Atual */}
          <div className="grid grid-cols-4 gap-2 p-3 bg-muted rounded-lg text-sm">
            <div className="text-center">
              <div className="font-medium text-green-600">{currentStock.available}</div>
              <div className="text-xs text-muted-foreground">Disponível</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-amber-600">{currentStock.rented}</div>
              <div className="text-xs text-muted-foreground">Em Locação</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-orange-600">{currentStock.maintenance}</div>
              <div className="text-xs text-muted-foreground">Manutenção</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-red-600">{currentStock.damaged}</div>
              <div className="text-xs text-muted-foreground">Avariado</div>
            </div>
          </div>

          {/* Tipo de Movimentação */}
          <div className="space-y-2">
            <Label>Tipo de Movimentação</Label>
            <Select
              value={form.watch("type")}
              onValueChange={(value) => form.setValue("type", value as MovementType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {allowedTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {movementTypeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.type && (
              <p className="text-sm text-red-500">{form.formState.errors.type.message}</p>
            )}
          </div>

          {/* Quantidade */}
          <div className="space-y-2">
            <Label>Quantidade</Label>
            <Input
              type="number"
              min={1}
              max={getMaxQuantity()}
              {...form.register("quantity", { valueAsNumber: true })}
            />
            {form.formState.errors.quantity && (
              <p className="text-sm text-red-500">{form.formState.errors.quantity.message}</p>
            )}
            {getMaxQuantity() < 999 && (
              <p className="text-xs text-muted-foreground">
                Máximo disponível: {getMaxQuantity()}
              </p>
            )}
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label>Motivo / Observação</Label>
            <Textarea
              placeholder="Descreva o motivo da movimentação..."
              {...form.register("reason")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
