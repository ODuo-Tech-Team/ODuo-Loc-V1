"use client"

import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  Settings,
  Receipt,
  Truck,
  Plug,
  FileText,
  User,
  LucideIcon,
} from "lucide-react"

interface ConfigTabsProps {
  activeTab: "geral" | "conta" | "fiscal" | "frete" | "integracoes" | "templates"
}

interface TabConfig {
  value: string
  label: string
  shortLabel: string
  href: string
  icon: LucideIcon
}

export function ConfigTabs({ activeTab }: ConfigTabsProps) {
  const tabs: TabConfig[] = [
    { value: "geral", label: "Geral", shortLabel: "Geral", href: "/configuracoes", icon: Settings },
    { value: "conta", label: "Minha Conta", shortLabel: "Conta", href: "/configuracoes/conta", icon: User },
    { value: "fiscal", label: "Fiscal & NF", shortLabel: "Fiscal", href: "/configuracoes/fiscal", icon: Receipt },
    { value: "frete", label: "Frete", shortLabel: "Frete", href: "/configuracoes/frete", icon: Truck },
    { value: "integracoes", label: "Integrações", shortLabel: "APIs", href: "/configuracoes/integracoes", icon: Plug },
    { value: "templates", label: "Templates", shortLabel: "Docs", href: "/configuracoes/templates", icon: FileText },
  ]

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
