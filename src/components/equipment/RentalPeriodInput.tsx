"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface RentalPeriod {
  id?: string
  days: number
  price: number
  label?: string
}

interface RentalPeriodInputProps {
  value: RentalPeriod[]
  onChange: (periods: RentalPeriod[]) => void
  disabled?: boolean
}

export function RentalPeriodInput({ value, onChange, disabled }: RentalPeriodInputProps) {
  const [newDays, setNewDays] = useState("")
  const [newPrice, setNewPrice] = useState("")
  const [newLabel, setNewLabel] = useState("")

  const handleAdd = () => {
    const days = parseInt(newDays)
    const price = parseFloat(newPrice)

    if (!days || days <= 0) {
      return
    }

    if (!price || price <= 0) {
      return
    }

    // Verificar se já existe período com mesma quantidade de dias
    if (value.some(p => p.days === days)) {
      return
    }

    const newPeriod: RentalPeriod = {
      days,
      price,
      label: newLabel || undefined,
    }

    // Adicionar e ordenar por dias
    const newPeriods = [...value, newPeriod].sort((a, b) => a.days - b.days)
    onChange(newPeriods)

    // Limpar inputs
    setNewDays("")
    setNewPrice("")
    setNewLabel("")
  }

  const handleRemove = (index: number) => {
    const newPeriods = value.filter((_, i) => i !== index)
    onChange(newPeriods)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAdd()
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const getPricePerDay = (period: RentalPeriod) => {
    return period.price / period.days
  }

  const getDefaultLabel = (days: number) => {
    if (days === 1) return "Diária"
    if (days === 7) return "Semanal"
    if (days === 15) return "Quinzenal"
    if (days === 30) return "Mensal"
    return `${days} dias`
  }

  return (
    <div className="space-y-4">
      <Label>Períodos e Valores de Locação *</Label>

      {/* Lista de períodos existentes */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((period, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border"
            >
              <div className="flex-1 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Período:</span>
                  <p className="font-medium">
                    {period.label || getDefaultLabel(period.days)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Dias:</span>
                  <p className="font-medium">{period.days}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Valor:</span>
                  <p className="font-medium text-green-600">
                    {formatCurrency(period.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ({formatCurrency(getPricePerDay(period))}/dia)
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
                disabled={disabled}
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Formulário para adicionar novo período */}
      <div className="p-4 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Plus className="h-4 w-4" />
          <span>Adicionar Período de Locação</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="newDays" className="text-xs font-medium">
              Quantidade de Dias *
            </Label>
            <Input
              id="newDays"
              type="number"
              min="1"
              placeholder="Ex: 7"
              value={newDays}
              onChange={(e) => setNewDays(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPrice" className="text-xs font-medium">
              Valor Total (R$) *
            </Label>
            <Input
              id="newPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ex: 500.00"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newLabel" className="text-xs font-medium">
              Nome do Período
            </Label>
            <Input
              id="newLabel"
              type="text"
              placeholder="Ex: Semanal"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
            />
          </div>
        </div>

        <Button
          type="button"
          onClick={handleAdd}
          disabled={disabled || !newDays || !newPrice}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Período
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          {value.length === 0
            ? "Adicione pelo menos um período. Ex: 1 dia por R$ 100, 7 dias por R$ 500"
            : "Pressione Enter para adicionar rapidamente"
          }
        </p>
      </div>
    </div>
  )
}
