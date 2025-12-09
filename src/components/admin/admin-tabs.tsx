"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface TabItem {
  value: string
  label: string
  shortLabel?: string // Label curto para mobile
  icon?: LucideIcon
  count?: number
}

interface AdminTabsProps {
  tabs: TabItem[]
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

export function AdminTabs({
  tabs,
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: AdminTabsProps) {
  return (
    <Tabs
      defaultValue={defaultValue || tabs[0]?.value}
      value={value}
      onValueChange={onValueChange}
      className={cn("w-full", className)}
    >
      <TabsList className="w-full bg-zinc-900/50 border border-zinc-800 p-1 rounded-xl h-auto flex-wrap">
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
          >
            {tab.icon && <tab.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel || tab.label}</span>
            {tab.count !== undefined && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] sm:text-xs rounded-full bg-zinc-800 data-[state=active]:bg-white/20">
                {tab.count}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  )
}

// Re-export TabsContent for convenience
export { TabsContent as AdminTabsContent }
