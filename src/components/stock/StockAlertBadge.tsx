"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Package, PackageX, PackageMinus, PackageOpen, Wrench } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface StockAlert {
  id: string
  type: "OUT_OF_STOCK" | "LOW_STOCK" | "DAMAGED" | "MAINTENANCE"
  severity: "critical" | "warning" | "info"
  equipment: {
    id: string
    name: string
    category: string
    image: string | null
  }
  message: string
}

interface AlertSummary {
  totalAlerts: number
  lowStockCount: number
  outOfStockCount: number
  damagedCount: number
  inMaintenanceCount: number
}

// Retorna o ícone correto baseado no tipo de alerta
const getAlertIcon = (type: StockAlert["type"]) => {
  switch (type) {
    case "OUT_OF_STOCK":
      return PackageX
    case "LOW_STOCK":
      return PackageMinus
    case "DAMAGED":
      return PackageOpen
    case "MAINTENANCE":
      return Wrench
    default:
      return Package
  }
}

export function StockAlertBadge() {
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [summary, setSummary] = useState<AlertSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlerts()
    // Atualizar a cada 5 minutos
    const interval = setInterval(loadAlerts, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadAlerts = async () => {
    try {
      const res = await fetch("/api/stock/alerts")
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts || [])
        setSummary(data.summary || null)
      }
    } catch (error) {
      console.error("Erro ao carregar alertas:", error)
    } finally {
      setLoading(false)
    }
  }

  const totalAlerts = summary?.totalAlerts || 0
  const hasCritical = alerts.some((a) => a.severity === "critical")

  if (loading || totalAlerts === 0) {
    return null
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative",
            hasCritical && "text-red-500 hover:text-red-600"
          )}
        >
          <Package className="h-5 w-5" />
          {totalAlerts > 0 && (
            <Badge
              variant="destructive"
              className={cn(
                "absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center text-xs p-0",
                hasCritical && "animate-pulse"
              )}
            >
              {totalAlerts > 99 ? "99+" : totalAlerts}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {/* Header */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm">Alertas de Estoque</h4>
              {summary && (
                <div className="flex items-center gap-2 mt-1">
                  {summary.outOfStockCount > 0 && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                      {summary.outOfStockCount} esgotado{summary.outOfStockCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {summary.lowStockCount > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/20 text-amber-500 hover:bg-amber-500/30">
                      {summary.lowStockCount} baixo{summary.lowStockCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {summary.damagedCount > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 h-4 bg-orange-500/20 text-orange-500 hover:bg-orange-500/30">
                      {summary.damagedCount} avariado{summary.damagedCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <Link href="/estoque">
              <Button variant="ghost" size="sm" className="text-xs h-7">
                Ver Todos
              </Button>
            </Link>
          </div>
        </div>

        {/* Alert List */}
        <div className="max-h-72 overflow-y-auto">
          {alerts.slice(0, 5).map((alert) => {
            const AlertIcon = getAlertIcon(alert.type)
            return (
              <Link
                key={alert.id}
                href={`/estoque/${alert.equipment.id}`}
                className="block"
              >
                <div
                  className={cn(
                    "px-4 py-3 border-b border-border/30 last:border-b-0 transition-all",
                    "hover:bg-muted/50",
                    alert.severity === "critical" && "border-l-2 border-l-red-500 bg-red-500/5 hover:bg-red-500/10",
                    alert.severity === "warning" && "border-l-2 border-l-amber-500 bg-amber-500/5 hover:bg-amber-500/10",
                    alert.severity === "info" && "border-l-2 border-l-blue-500 bg-blue-500/5 hover:bg-blue-500/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-lg shrink-0",
                        alert.severity === "critical" && "bg-red-500/10",
                        alert.severity === "warning" && "bg-amber-500/10",
                        alert.severity === "info" && "bg-blue-500/10"
                      )}
                    >
                      <AlertIcon
                        className={cn(
                          "h-4 w-4",
                          alert.severity === "critical" && "text-red-500",
                          alert.severity === "warning" && "text-amber-500",
                          alert.severity === "info" && "text-blue-500"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {alert.equipment.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Footer */}
        {alerts.length > 5 && (
          <div className="p-2 border-t border-border/50">
            <Link href="/estoque">
              <Button variant="ghost" size="sm" className="w-full text-xs h-8">
                Ver mais {alerts.length - 5} alerta{alerts.length - 5 > 1 ? 's' : ''}
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
