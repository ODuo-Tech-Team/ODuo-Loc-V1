"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  FileText,
  Receipt,
  Mail,
  ClipboardCheck,
  Settings,
} from "lucide-react"

interface BookingTabsProps {
  bookingId: string
  activeTab: "detalhes" | "documentos" | "email" | "checklist"
}

const tabs = [
  {
    key: "detalhes",
    label: "Detalhes",
    shortLabel: "Detalhes",
    icon: Settings,
    href: (id: string) => `/reservas/${id}`,
  },
  {
    key: "documentos",
    label: "Documentos & NF",
    shortLabel: "Docs",
    icon: Receipt,
    href: (id: string) => `/reservas/${id}/documentos`,
  },
  {
    key: "email",
    label: "Contratos & Emails",
    shortLabel: "Emails",
    icon: Mail,
    href: (id: string) => `/reservas/${id}/emails`,
  },
  {
    key: "checklist",
    label: "Checklist",
    shortLabel: "Check",
    icon: ClipboardCheck,
    href: (id: string) => `/reservas/${id}/checklist`,
  },
]

export function BookingTabs({ bookingId, activeTab }: BookingTabsProps) {
  return (
    <div className="w-full">
      <div className="flex gap-1 p-1 bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key

          return (
            <Link
              key={tab.key}
              href={tab.href(bookingId)}
              className={cn(
                "flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex-1 min-w-0",
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline truncate">{tab.label}</span>
              <span className="sm:hidden truncate">{tab.shortLabel}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
