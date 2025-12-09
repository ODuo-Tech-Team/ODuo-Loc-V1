"use client"

import { Package, AlertTriangle, Wrench, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StockStats {
  totalEquipments: number
  totalStock: number
  totalAvailable: number
  totalReserved: number
  totalMaintenance: number
  totalDamaged: number
  lowStockCount: number
}

interface StockOverviewCardProps {
  stats: StockStats
  className?: string
}

export function StockOverviewCard({ stats, className }: StockOverviewCardProps) {
  const cards = [
    {
      title: "Estoque Total",
      value: stats.totalStock,
      subtitle: `${stats.totalEquipments} equipamentos`,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Disponível",
      value: stats.totalAvailable,
      subtitle: `${Math.round((stats.totalAvailable / stats.totalStock) * 100) || 0}% do total`,
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Em Locação",
      value: stats.totalReserved,
      subtitle: "Atualmente locado",
      icon: Package,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Manutenção",
      value: stats.totalMaintenance,
      subtitle: "Indisponível",
      icon: Wrench,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Avariado",
      value: stats.totalDamaged,
      subtitle: "Necessita reparo",
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Estoque Baixo",
      value: stats.lowStockCount,
      subtitle: "Equipamentos",
      icon: AlertTriangle,
      color: stats.lowStockCount > 0 ? "text-red-600" : "text-gray-600",
      bgColor: stats.lowStockCount > 0 ? "bg-red-100" : "bg-gray-100",
    },
  ]

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4", className)}>
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <div className={cn("p-1.5 rounded-md", card.bgColor)}>
                <card.icon className={cn("h-4 w-4", card.color)} />
              </div>
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
