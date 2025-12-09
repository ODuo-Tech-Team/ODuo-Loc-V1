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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { stockAdjustmentSchema, type StockAdjustmentInput } from "@/lib/validations/stock"

interface StockAdjustDialogProps {
  equipmentId: string
  equipmentName: string
  currentStock: {
    total: number
    available: number
    rented: number // Em locação
    maintenance: number
    damaged: number
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function StockAdjustDialog({
  equipmentId,
  equipmentName,
  currentStock,
  open,
  onOpenChange,
  onSuccess,
}: StockAdjustDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const minPossibleStock = currentStock.rented + currentStock.maintenance + currentStock.damaged

  const form = useForm<StockAdjustmentInput>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      newTotalStock: currentStock.total,
      reason: "",
    },
  })

  const newTotal = form.watch("newTotalStock")
  const difference = newTotal - currentStock.total

  const onSubmit = async (data: StockAdjustmentInput) => {
    if (data.newTotalStock < minPossibleStock) {
      toast.error(`O estoque mínimo é ${minPossibleStock} (reservados + manutenção + avariados)`)
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/stock/${equipmentId}/adjust`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || "Erro ao ajustar estoque")
      }

      toast.success(result.message || "Estoque ajustado com sucesso")
      form.reset()
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao ajustar estoque")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajustar Estoque Total</DialogTitle>
          <DialogDescription>
            Equipamento: <strong>{equipmentName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Estoque Atual */}
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estoque Total Atual:</span>
              <span className="font-medium">{currentStock.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Disponível:</span>
              <span className="font-medium text-green-600">{currentStock.available}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Em Locação:</span>
              <span className="font-medium text-amber-600">{currentStock.rented}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Em Manutenção:</span>
              <span className="font-medium text-orange-600">{currentStock.maintenance}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avariado:</span>
              <span className="font-medium text-red-600">{currentStock.damaged}</span>
            </div>
          </div>

          {/* Novo Estoque Total */}
          <div className="space-y-2">
            <Label>Novo Estoque Total</Label>
            <Input
              type="number"
              min={minPossibleStock}
              {...form.register("newTotalStock", { valueAsNumber: true })}
            />
            {form.formState.errors.newTotalStock && (
              <p className="text-sm text-red-500">{form.formState.errors.newTotalStock.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Mínimo: {minPossibleStock} (não pode ser menor que reservados + manutenção + avariados)
            </p>
          </div>

          {/* Diferença */}
          {difference !== 0 && (
            <div className={`p-2 rounded-lg text-sm ${difference > 0 ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
              {difference > 0 ? (
                <span>Será adicionado: <strong>+{difference}</strong> ao estoque disponível</span>
              ) : (
                <span>Será removido: <strong>{difference}</strong> do estoque disponível</span>
              )}
            </div>
          )}

          {/* Motivo */}
          <div className="space-y-2">
            <Label>Motivo do Ajuste *</Label>
            <Textarea
              placeholder="Ex: Inventário físico, nova compra, correção de erro..."
              {...form.register("reason")}
            />
            {form.formState.errors.reason && (
              <p className="text-sm text-red-500">{form.formState.errors.reason.message}</p>
            )}
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
            <Button type="submit" disabled={isSubmitting || difference === 0}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajustar Estoque
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
