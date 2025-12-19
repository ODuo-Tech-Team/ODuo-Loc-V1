"use client"

import { useState, useEffect } from "react"
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
import { Loader2, AlertTriangle, FileText, Package, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface BookingItem {
  id: string
  quantity: number
  equipment: {
    id: string
    name: string
    category: string
    ncm: string | null
    codigoProduto: string | null
    pricePerDay: number
  }
}

interface EmitirRemessaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingId: string
  bookingNumber: string | number
  items: BookingItem[]
  customerName: string
  onSuccess?: () => void
}

export function EmitirRemessaDialog({
  open,
  onOpenChange,
  bookingId,
  bookingNumber,
  items,
  customerName,
  onSuccess,
}: EmitirRemessaDialogProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [certificateValid, setCertificateValid] = useState<boolean | null>(null)
  const [checkingConfig, setCheckingConfig] = useState(true)

  // Verificar configuração fiscal ao abrir
  useEffect(() => {
    if (open) {
      checkFiscalConfig()
      // Selecionar todos os itens por padrão
      setSelectedItems(items.map(item => item.equipment.id))
    }
  }, [open, items])

  const checkFiscalConfig = async () => {
    try {
      setCheckingConfig(true)
      const response = await fetch("/api/fiscal/config")
      if (response.ok) {
        const config = await response.json()
        setCertificateValid(config.certificadoValido === true)
      }
    } catch (error) {
      console.error("Erro ao verificar configuração fiscal:", error)
      setCertificateValid(false)
    } finally {
      setCheckingConfig(false)
    }
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
      setSelectedItems(items.map(item => item.equipment.id))
    }
  }

  // Verificar se algum item selecionado não tem NCM
  const itemsWithoutNcm = items.filter(
    item => selectedItems.includes(item.equipment.id) && !item.equipment.ncm
  )

  const canEmit =
    certificateValid &&
    selectedItems.length > 0 &&
    itemsWithoutNcm.length === 0

  const handleEmit = async () => {
    if (!canEmit) return

    try {
      setLoading(true)

      const response = await fetch("/api/product-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          equipmentIds: selectedItems,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao emitir NF-e")
      }

      toast.success("NF-e de remessa emitida com sucesso!")
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Erro ao emitir NF-e:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao emitir NF-e")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Emitir NF-e de Remessa
          </DialogTitle>
          <DialogDescription>
            Reserva #{bookingNumber} - {customerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status do certificado */}
          {checkingConfig ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando configuração fiscal...
            </div>
          ) : certificateValid === false ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Certificado Digital Inválido</AlertTitle>
              <AlertDescription>
                O certificado digital A1 não está configurado ou expirou.
                Configure o certificado em Configurações &gt; Fiscal.
              </AlertDescription>
            </Alert>
          ) : certificateValid === true ? (
            <Alert className="bg-green-500/10 border-green-500/30">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-500">Certificado Válido</AlertTitle>
              <AlertDescription className="text-green-400/80">
                O certificado digital está configurado e válido.
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Aviso sobre itens sem NCM */}
          {itemsWithoutNcm.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Equipamentos sem NCM</AlertTitle>
              <AlertDescription>
                Os seguintes equipamentos não possuem código NCM cadastrado:
                <ul className="mt-2 list-disc list-inside">
                  {itemsWithoutNcm.map(item => (
                    <li key={item.equipment.id}>{item.equipment.name}</li>
                  ))}
                </ul>
                <p className="mt-2">
                  Cadastre o NCM no equipamento antes de emitir a NF-e.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Lista de itens */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Equipamentos para Remessa</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAll}
                className="text-xs"
              >
                {selectedItems.length === items.length ? "Desmarcar todos" : "Selecionar todos"}
              </Button>
            </div>

            <div className="border rounded-lg divide-y border-zinc-800 divide-zinc-800">
              {items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 hover:bg-zinc-800/50"
                >
                  <Checkbox
                    checked={selectedItems.includes(item.equipment.id)}
                    onCheckedChange={() => toggleItem(item.equipment.id)}
                    disabled={loading}
                  />
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {item.equipment.name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        Qtd: {item.quantity}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{item.equipment.category}</span>
                      {item.equipment.ncm ? (
                        <Badge variant="outline" className="text-xs">
                          NCM: {item.equipment.ncm}
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          Sem NCM
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo */}
          <div className="text-sm text-muted-foreground">
            {selectedItems.length} de {items.length} equipamento(s) selecionado(s)
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
            Emitir NF-e
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
