"use client"

import { useState, useEffect } from "react"
import { Loader2, Package, AlertTriangle, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ReturnItem {
  id: string
  equipment: {
    id: string
    name: string
    images?: string[]
  }
  quantity: number
  returnedQty: number
  damagedQty: number
  pendingQty: number
  isComplete: boolean
}

interface ReturnBookingDialogProps {
  bookingId: string
  bookingNumber: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface ReturnFormItem {
  bookingItemId: string
  returnedQty: number
  damagedQty: number
  damageNotes: string
  repairCost: number
}

export function ReturnBookingDialog({
  bookingId,
  bookingNumber,
  open,
  onOpenChange,
  onSuccess,
}: ReturnBookingDialogProps) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [items, setItems] = useState<ReturnItem[]>([])
  const [formItems, setFormItems] = useState<ReturnFormItem[]>([])
  const [notes, setNotes] = useState("")

  // Carregar status da reserva
  useEffect(() => {
    if (open) {
      loadReturnStatus()
    }
  }, [open, bookingId])

  const loadReturnStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/return`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
        // Inicializar form items para itens pendentes
        setFormItems(
          (data.items || [])
            .filter((item: ReturnItem) => item.pendingQty > 0)
            .map((item: ReturnItem) => ({
              bookingItemId: item.id,
              returnedQty: item.pendingQty,
              damagedQty: 0,
              damageNotes: "",
              repairCost: 0,
            }))
        )
      }
    } catch (error) {
      console.error("Erro ao carregar status:", error)
      toast.error("Erro ao carregar status da devolução")
    } finally {
      setLoading(false)
    }
  }

  const updateFormItem = (itemId: string, updates: Partial<ReturnFormItem>) => {
    setFormItems((prev) =>
      prev.map((item) =>
        item.bookingItemId === itemId ? { ...item, ...updates } : item
      )
    )
  }

  const handleSubmit = async () => {
    // Validar que todos os itens têm quantidade válida
    const itemsToReturn = formItems.filter(
      (item) => item.returnedQty > 0 || item.damagedQty > 0
    )

    if (itemsToReturn.length === 0) {
      toast.error("Informe a quantidade devolvida para pelo menos um item")
      return
    }

    // Validar quantidades
    for (const formItem of itemsToReturn) {
      const item = items.find((i) => i.id === formItem.bookingItemId)
      if (item) {
        const total = formItem.returnedQty + formItem.damagedQty
        if (total > item.pendingQty) {
          toast.error(
            `Quantidade total (${total}) excede o pendente (${item.pendingQty}) para "${item.equipment.name}"`
          )
          return
        }
      }
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemsToReturn,
          notes,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || "Erro ao processar devolução")
      }

      toast.success(result.message || "Devolução registrada com sucesso")
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao processar devolução")
    } finally {
      setSubmitting(false)
    }
  }

  const pendingItems = items.filter((item) => item.pendingQty > 0)
  const completedItems = items.filter((item) => item.isComplete)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Devolução</DialogTitle>
          <DialogDescription>
            Reserva #{bookingNumber}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Itens Pendentes */}
            {pendingItems.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Itens Pendentes de Devolução
                </h3>

                {pendingItems.map((item) => {
                  const formItem = formItems.find(
                    (f) => f.bookingItemId === item.id
                  )
                  if (!formItem) return null

                  const hasDamage = formItem.damagedQty > 0

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "border rounded-lg p-4 space-y-4",
                        hasDamage && "border-red-200 bg-red-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {item.equipment.images?.[0] ? (
                          <img
                            src={item.equipment.images[0]}
                            alt={item.equipment.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{item.equipment.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Pendente: {item.pendingQty} de {item.quantity}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm text-green-700">
                            Devolvido OK
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            max={item.pendingQty - formItem.damagedQty}
                            value={formItem.returnedQty}
                            onChange={(e) =>
                              updateFormItem(item.id, {
                                returnedQty: Math.min(
                                  parseInt(e.target.value) || 0,
                                  item.pendingQty - formItem.damagedQty
                                ),
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-red-700">
                            Com Avaria
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            max={item.pendingQty - formItem.returnedQty}
                            value={formItem.damagedQty}
                            onChange={(e) =>
                              updateFormItem(item.id, {
                                damagedQty: Math.min(
                                  parseInt(e.target.value) || 0,
                                  item.pendingQty - formItem.returnedQty
                                ),
                              })
                            }
                          />
                        </div>
                      </div>

                      {hasDamage && (
                        <div className="space-y-3 pt-2 border-t border-red-200">
                          <div className="flex items-center gap-2 text-red-700">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              Detalhes da Avaria
                            </span>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Descrição da avaria</Label>
                            <Textarea
                              placeholder="Descreva o dano encontrado..."
                              value={formItem.damageNotes}
                              onChange={(e) =>
                                updateFormItem(item.id, {
                                  damageNotes: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">
                              Custo estimado de reparo (R$)
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              placeholder="0,00"
                              value={formItem.repairCost || ""}
                              onChange={(e) =>
                                updateFormItem(item.id, {
                                  repairCost: parseFloat(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Itens já devolvidos */}
            {completedItems.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-muted-foreground flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Itens já Devolvidos
                </h3>

                {completedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                  >
                    <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {item.equipment.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.returnedQty} OK
                        {item.damagedQty > 0 && (
                          <span className="text-red-600">
                            , {item.damagedQty} com avaria
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notas gerais */}
            {pendingItems.length > 0 && (
              <div className="space-y-2">
                <Label>Observações da Devolução</Label>
                <Textarea
                  placeholder="Observações gerais sobre a devolução..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            )}

            {/* Se não houver itens pendentes */}
            {pendingItems.length === 0 && (
              <div className="text-center py-8">
                <Check className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <p className="font-medium">Todos os itens já foram devolvidos</p>
                <p className="text-sm text-muted-foreground">
                  Esta reserva está completa
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          {pendingItems.length > 0 && (
            <Button onClick={handleSubmit} disabled={submitting || loading}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Devolução
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
