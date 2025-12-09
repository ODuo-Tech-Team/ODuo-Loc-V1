"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Types
interface Category {
  id: string
  name: string
  type: "INCOME" | "EXPENSE"
  color: string | null
  icon: string | null
}

interface Equipment {
  id: string
  name: string
}

interface FormData {
  type: "INCOME" | "EXPENSE"
  description: string
  amount: string
  date: string
  dueDate: string
  categoryId: string
  equipmentId: string
  isRecurring: boolean
  intervalDays: string
  endDate: string
}

interface TransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  initialType?: "INCOME" | "EXPENSE"
}

const initialFormData: FormData = {
  type: "EXPENSE",
  description: "",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  dueDate: "",
  categoryId: "",
  equipmentId: "",
  isRecurring: false,
  intervalDays: "30",
  endDate: "",
}

export function TransactionDialog({
  open,
  onOpenChange,
  onSuccess,
  initialType,
}: TransactionDialogProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    ...initialFormData,
    type: initialType || "EXPENSE",
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  // Carregar categorias e equipamentos
  useEffect(() => {
    if (open) {
      loadData()
      setFormData({
        ...initialFormData,
        type: initialType || "EXPENSE",
      })
      setErrors({})
    }
  }, [open, initialType])

  // Limpar categoria quando tipo muda
  useEffect(() => {
    setFormData((prev) => ({ ...prev, categoryId: "" }))
  }, [formData.type])

  const loadData = async () => {
    setLoading(true)
    try {
      const [catRes, eqRes] = await Promise.all([
        fetch("/api/financial/categories"),
        fetch("/api/equipments"),
      ])

      if (catRes.ok) {
        const catData = await catRes.json()
        setCategories(catData.categories || [])
      }

      if (eqRes.ok) {
        const eqData = await eqRes.json()
        setEquipments(eqData.equipments || eqData || [])
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter((c) => c.type === formData.type)

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (!formData.description.trim()) {
      newErrors.description = "Descrição é obrigatória"
    }

    if (!formData.amount || parseFloat(formData.amount.replace(",", ".")) <= 0) {
      newErrors.amount = "Valor deve ser positivo"
    }

    if (!formData.date) {
      newErrors.date = "Data é obrigatória"
    }

    if (!formData.categoryId) {
      newErrors.categoryId = "Categoria é obrigatória"
    }

    if (formData.isRecurring && (!formData.intervalDays || parseInt(formData.intervalDays) <= 0)) {
      newErrors.intervalDays = "Intervalo deve ser positivo"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setSubmitting(true)
    try {
      const amount = parseFloat(formData.amount.replace(",", "."))

      if (formData.isRecurring) {
        // Criar transação recorrente
        const response = await fetch("/api/financial/recurring", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: formData.type,
            description: formData.description,
            amount,
            categoryId: formData.categoryId,
            equipmentId: formData.equipmentId && formData.equipmentId !== "none" ? formData.equipmentId : null,
            intervalDays: parseInt(formData.intervalDays || "30"),
            startDate: formData.date,
            endDate: formData.endDate || null,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Erro ao criar recorrência")
        }

        toast.success("Transação recorrente criada com sucesso!")
      } else {
        // Criar transação única
        const response = await fetch("/api/financial/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: formData.type,
            description: formData.description,
            amount,
            date: formData.date,
            dueDate: formData.dueDate || null,
            categoryId: formData.categoryId,
            equipmentId: formData.equipmentId && formData.equipmentId !== "none" ? formData.equipmentId : null,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Erro ao criar transação")
        }

        toast.success(
          formData.type === "INCOME"
            ? "Receita registrada com sucesso!"
            : "Despesa registrada com sucesso!"
        )
      }

      setFormData(initialFormData)
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar")
    } finally {
      setSubmitting(false)
    }
  }

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
          <DialogDescription>
            Registre uma nova receita ou despesa
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo de Transação */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.type === "INCOME" ? "default" : "outline"}
                  className={cn(
                    "flex-1",
                    formData.type === "INCOME" && "bg-emerald-600 hover:bg-emerald-700"
                  )}
                  onClick={() => updateField("type", "INCOME")}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Receita
                </Button>
                <Button
                  type="button"
                  variant={formData.type === "EXPENSE" ? "default" : "outline"}
                  className={cn(
                    "flex-1",
                    formData.type === "EXPENSE" && "bg-red-600 hover:bg-red-700"
                  )}
                  onClick={() => updateField("type", "EXPENSE")}
                >
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Despesa
                </Button>
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Ex: Aluguel do escritório"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            {/* Valor e Categoria */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={(e) => updateField("amount", e.target.value)}
                />
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => updateField("categoryId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          {category.color && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                          )}
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <p className="text-sm text-destructive">{errors.categoryId}</p>
                )}
              </div>
            </div>

            {/* Data */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateField("date", e.target.value)}
                />
                {errors.date && (
                  <p className="text-sm text-destructive">{errors.date}</p>
                )}
              </div>

              {!formData.isRecurring && (
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Vencimento (opcional)</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => updateField("dueDate", e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Equipamento (opcional) */}
            <div className="space-y-2">
              <Label>Equipamento (opcional)</Label>
              <Select
                value={formData.equipmentId}
                onValueChange={(value) => updateField("equipmentId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum - Transação geral" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum - Transação geral</SelectItem>
                  {equipments.map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Vincule a um equipamento específico ou deixe como transação geral
              </p>
            </div>

            {/* Recorrência */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Transação Recorrente
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Criar automaticamente em intervalos regulares
                  </p>
                </div>
                <Switch
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => updateField("isRecurring", checked)}
                />
              </div>

              {formData.isRecurring && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label>Repetir a cada</Label>
                    <Select
                      value={formData.intervalDays}
                      onValueChange={(value) => updateField("intervalDays", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 dias (Semanal)</SelectItem>
                        <SelectItem value="14">14 dias (Quinzenal)</SelectItem>
                        <SelectItem value="30">30 dias (Mensal)</SelectItem>
                        <SelectItem value="60">60 dias (Bimestral)</SelectItem>
                        <SelectItem value="90">90 dias (Trimestral)</SelectItem>
                        <SelectItem value="180">180 dias (Semestral)</SelectItem>
                        <SelectItem value="365">365 dias (Anual)</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.intervalDays && (
                      <p className="text-sm text-destructive">{errors.intervalDays}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data final (opcional)</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => updateField("endDate", e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Deixe vazio para sem fim
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : formData.isRecurring ? (
                  "Criar Recorrência"
                ) : (
                  "Salvar Transação"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
