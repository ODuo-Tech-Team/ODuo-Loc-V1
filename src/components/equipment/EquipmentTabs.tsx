"use client"

import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  Info,
  Layers,
  Package,
  Wrench,
  DollarSign,
  FileText,
  LucideIcon,
} from "lucide-react"

interface EquipmentTabsProps {
  equipmentId: string
  activeTab: "detalhes" | "unidades" | "estoque" | "manutencao" | "financeiro" | "documentos"
  trackingType?: "SERIALIZED" | "QUANTITY"
}

interface TabConfig {
  value: string
  label: string
  shortLabel: string
  href: string
  icon: LucideIcon
  showFor: string[]
}

export function EquipmentTabs({ equipmentId, activeTab, trackingType = "SERIALIZED" }: EquipmentTabsProps) {
  // Definir todas as abas
  const allTabs: TabConfig[] = [
    { value: "detalhes", label: "Detalhes", shortLabel: "Info", href: `/equipamentos/${equipmentId}`, icon: Info, showFor: ["SERIALIZED", "QUANTITY"] },
    { value: "unidades", label: "Unidades", shortLabel: "Unid.", href: `/equipamentos/${equipmentId}/unidades`, icon: Layers, showFor: ["SERIALIZED"] },
    { value: "estoque", label: "Estoque", shortLabel: "Est.", href: `/equipamentos/${equipmentId}/estoque`, icon: Package, showFor: ["SERIALIZED", "QUANTITY"] },
    { value: "manutencao", label: "Manutenção", shortLabel: "Manut.", href: `/equipamentos/${equipmentId}/manutencao`, icon: Wrench, showFor: ["SERIALIZED"] },
    { value: "financeiro", label: "Financeiro", shortLabel: "Fin.", href: `/equipamentos/${equipmentId}/financeiro`, icon: DollarSign, showFor: ["SERIALIZED", "QUANTITY"] },
    { value: "documentos", label: "Documentos", shortLabel: "Docs", href: `/equipamentos/${equipmentId}/documentos`, icon: FileText, showFor: ["SERIALIZED", "QUANTITY"] },
  ]

  // Filtrar abas baseado no trackingType
  const tabs = allTabs.filter(tab => tab.showFor.includes(trackingType))

  return (
    <Tabs value={activeTab} className="w-full">
      <TabsList className="w-full bg-zinc-900/50 border border-zinc-800 p-1 rounded-xl h-auto flex-wrap justify-start gap-1">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={cn(
              "flex-1 min-w-fit",
              "data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm",
              "hover:bg-zinc-800 hover:text-white",
              "rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium",
              "text-zinc-400 transition-all duration-200",
              "flex items-center justify-center gap-1.5 sm:gap-2"
            )}
            asChild
          >
            <Link href={tab.href}>
              <tab.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
