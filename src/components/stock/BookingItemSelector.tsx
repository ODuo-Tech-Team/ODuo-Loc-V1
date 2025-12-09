"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Minus, Trash2, AlertCircle, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Equipment {
  id: string
  name: string
  category: string
  images: string[]
  pricePerDay: number
  totalStock: number
  availableStock: number
  reservedStock: number
  maintenanceStock: number
  damagedStock: number
}

interface BookingItem {
  equipmentId: string
  quantity: number
  unitPrice: number
  notes?: string
  equipment?: Equipment
}

interface AvailabilityResult {
  isAvailable: boolean
  stock: {
    availableForPeriod: number
  }
  message: string
}

interface BookingItemSelectorProps {
  items: BookingItem[]
  onChange: (items: BookingItem[]) => void
  startDate?: string
  endDate?: string
  disabled?: boolean
  excludeBookingId?: string
}

export function BookingItemSelector({
  items,
  onChange,
  startDate,
  endDate,
  disabled = false,
  excludeBookingId,
}: BookingItemSelectorProps) {
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [availabilityChecks, setAvailabilityChecks] = useState<Record<string, AvailabilityResult | null>>({})
  const [checkingAvailability, setCheckingAvailability] = useState<Record<string, boolean>>({})

  // Carregar equipamentos disponíveis
  useEffect(() => {
    async function loadEquipments() {
      try {
        const res = await fetch("/api/stock")
        if (res.ok) {
          const data = await res.json()
          setEquipments(data.equipments || [])
        }
      } catch (error) {
        console.error("Erro ao carregar equipamentos:", error)
      } finally {
        setLoading(false)
      }
    }
    loadEquipments()
  }, [])

  // Verificar disponibilidade de um equipamento
  const checkAvailability = useCallback(async (equipmentId: string, quantity: number) => {
    if (!startDate || !endDate) return

    setCheckingAvailability(prev => ({ ...prev, [equipmentId]: true }))

    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        quantity: quantity.toString(),
      })
      if (excludeBookingId) {
        params.append("excludeBookingId", excludeBookingId)
      }

      const res = await fetch(`/api/stock/${equipmentId}/availability?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAvailabilityChecks(prev => ({ ...prev, [equipmentId]: data }))
      }
    } catch (error) {
      console.error("Erro ao verificar disponibilidade:", error)
    } finally {
      setCheckingAvailability(prev => ({ ...prev, [equipmentId]: false }))
    }
  }, [startDate, endDate, excludeBookingId])

  // Verificar disponibilidade quando itens ou datas mudam
  useEffect(() => {
    if (startDate && endDate) {
      items.forEach(item => {
        if (item.equipmentId) {
          checkAvailability(item.equipmentId, item.quantity)
        }
      })
    }
  }, [items, startDate, endDate, checkAvailability])

  const addItem = () => {
    onChange([
      ...items,
      {
        equipmentId: "",
        quantity: 1,
        unitPrice: 0,
      },
    ])
  }

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    onChange(newItems)
  }

  const updateItem = (index: number, updates: Partial<BookingItem>) => {
    const newItems = items.map((item, i) => {
      if (i === index) {
        const updated = { ...item, ...updates }

        // Se mudou o equipamento, atualizar o preço unitário
        if (updates.equipmentId && updates.equipmentId !== item.equipmentId) {
          const equipment = equipments.find(e => e.id === updates.equipmentId)
          if (equipment) {
            updated.unitPrice = equipment.pricePerDay
            updated.equipment = equipment
          }
        }

        return updated
      }
      return item
    })
    onChange(newItems)
  }

  const updateQuantity = (index: number, delta: number) => {
    const item = items[index]
    const newQuantity = Math.max(1, item.quantity + delta)
    updateItem(index, { quantity: newQuantity })
  }

  // Calcular total
  const calculateTotal = () => {
    if (!startDate || !endDate) return 0

    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    return items.reduce((sum, item) => {
      return sum + (item.unitPrice * item.quantity * days)
    }, 0)
  }

  // Equipamentos já selecionados
  const selectedEquipmentIds = items.map(item => item.equipmentId).filter(Boolean)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Equipamentos</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          disabled={disabled || equipments.length === selectedEquipmentIds.length}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="border border-dashed rounded-lg p-6 text-center text-muted-foreground">
          <p>Nenhum equipamento adicionado</p>
          <p className="text-sm mt-1">Clique em &quot;Adicionar&quot; para incluir equipamentos na reserva</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const availability = availabilityChecks[item.equipmentId]
            const isChecking = checkingAvailability[item.equipmentId]
            const equipment = item.equipment || equipments.find(e => e.id === item.equipmentId)

            return (
              <div
                key={index}
                className={cn(
                  "border rounded-lg p-4 space-y-3",
                  availability && !availability.isAvailable && "border-red-300 bg-red-50"
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Seleção de Equipamento */}
                  <div className="flex-1">
                    <Label className="text-sm text-muted-foreground">Equipamento</Label>
                    <Select
                      value={item.equipmentId}
                      onValueChange={(value) => updateItem(index, { equipmentId: value })}
                      disabled={disabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um equipamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipments.map((eq) => (
                          <SelectItem
                            key={eq.id}
                            value={eq.id}
                            disabled={selectedEquipmentIds.includes(eq.id) && eq.id !== item.equipmentId}
                          >
                            <div className="flex items-center gap-2">
                              <span>{eq.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {eq.availableStock} disp.
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantidade */}
                  <div className="w-32">
                    <Label className="text-sm text-muted-foreground">Quantidade</Label>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => updateQuantity(index, -1)}
                        disabled={disabled || item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="text-center h-9"
                        min={1}
                        disabled={disabled}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => updateQuantity(index, 1)}
                        disabled={disabled}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Preço Unitário */}
                  <div className="w-32">
                    <Label className="text-sm text-muted-foreground">Preço/dia</Label>
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                      className="h-9"
                      min={0}
                      step={0.01}
                      disabled={disabled}
                    />
                  </div>

                  {/* Remover */}
                  <div className="pt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => removeItem(index)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Status de Disponibilidade */}
                {item.equipmentId && startDate && endDate && (
                  <div className="flex items-center gap-2 text-sm">
                    {isChecking ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verificando disponibilidade...</span>
                      </div>
                    ) : availability ? (
                      availability.isAvailable ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <Check className="h-4 w-4" />
                          <span>{availability.message}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span>{availability.message}</span>
                        </div>
                      )
                    ) : equipment ? (
                      <div className="text-muted-foreground">
                        Estoque atual: {equipment.availableStock} disponível(is) de {equipment.totalStock}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Total */}
      {items.length > 0 && startDate && endDate && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-lg font-medium">
            <span>Total Estimado:</span>
            <span>
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(calculateTotal())}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} dia(s)
          </p>
        </div>
      )}
    </div>
  )
}
