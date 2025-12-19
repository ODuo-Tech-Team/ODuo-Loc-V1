"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, FileText, Package, ArrowDownLeft, Info } from "lucide-react"
import { toast } from "sonner"

interface RemessaItem {
  id: string
  equipmentId: string
  descricao: string
  ncm: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  equipment: {
    id: string
    name: string
  }
}

interface EmitirRetornoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  remessaId: string
  remessaNumero: string
  remessaChave: string
  items: RemessaItem[]
  onSuccess?: () => void
}

export function EmitirRetornoDialog({
  open,
  onOpenChange,
  remessaId,
  remessaNumero,
  remessaChave,
  items,
  onSuccess,
}: EmitirRetornoDialogProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Selecionar todos os itens quando o dialog abrir
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSelectedItems(items.map(item => item.equipmentId))
    } else {
      setSelectedItems([])
    }
    onOpenChange(isOpen)
  }

  const toggleItem = (equipmentId: string) => {
    setSelectedItems(prev =>
      prev.includes(equipmentId)
        ? prev.filter(id => id !== equipmentId)
        : [...prev, equipmentId]
    )
  }

  const toggleAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(items.map(item => item.equipmentId))
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const truncateChave = (chave: string) => {
    if (!chave) return "-"
    return `${chave.slice(0, 12)}...${chave.slice(-12)}`
  }

  const canEmit = selectedItems.length > 0

  const handleEmit = async () => {
    if (!canEmit) return

    try {
      setLoading(true)

      const response = await fetch(`/api/product-invoices/${remessaId}/retorno`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentIds: selectedItems,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao emitir NF-e de retorno")
      }

      toast.success("NF-e de retorno emitida com sucesso!")
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Erro ao emitir NF-e de retorno:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao emitir NF-e de retorno")
    } finally {
      setLoading(false)
    }
  }

  // Calcular valor total dos itens selecionados
  const valorTotalSelecionado = items
    .filter(item => selectedItems.includes(item.equipmentId))
    .reduce((sum, item) => sum + item.valorTotal, 0)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDownLeft className="h-5 w-5 text-purple-500" />
            Emitir NF-e de Retorno
          </DialogTitle>
          <DialogDescription>
            Retorno referente à NF-e de Remessa #{remessaNumero}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info da NF-e de Remessa referenciada */}
          <Alert className="bg-blue-500/10 border-blue-500/30">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertTitle className="text-blue-500">NF-e de Remessa Referenciada</AlertTitle>
            <AlertDescription className="text-blue-400/80">
              <div className="mt-1 font-mono text-xs">
                Chave: {truncateChave(remessaChave)}
              </div>
              <p className="mt-2 text-xs">
                Esta NF-e de retorno será vinculada automaticamente à remessa acima.
              </p>
            </AlertDescription>
          </Alert>

          {/* Lista de itens */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Equipamentos para Retorno</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAll}
                className="text-xs"
              >
                {selectedItems.length === items.length ? "Desmarcar todos" : "Selecionar todos"}
              </Button>
            </div>

            <div className="border rounded-lg divide-y border-zinc-800 divide-zinc-800 max-h-[300px] overflow-y-auto">
              {items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 hover:bg-zinc-800/50"
                >
                  <Checkbox
                    checked={selectedItems.includes(item.equipmentId)}
                    onCheckedChange={() => toggleItem(item.equipmentId)}
                    disabled={loading}
                  />
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {item.equipment.name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        Qtd: {item.quantidade}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        NCM: {item.ncm}
                      </Badge>
                      <span>{formatCurrency(item.valorUnitario)} un.</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-sm">
                      {formatCurrency(item.valorTotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {selectedItems.length} de {items.length} equipamento(s) selecionado(s)
            </span>
            <span className="font-semibold">
              Total: {formatCurrency(valorTotalSelecionado)}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleEmit}
            disabled={!canEmit || loading}
            className="gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <ArrowDownLeft className="h-4 w-4" />
            Emitir NF-e de Retorno
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
