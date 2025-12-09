"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LucideIcon, Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface AdminPageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  iconColor?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
    icon?: LucideIcon
    variant?: "default" | "secondary" | "outline" | "ghost" | "destructive"
  }
  backHref?: string
  backLabel?: string
  badge?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

export function AdminPageHeader({
  title,
  description,
  icon: Icon,
  iconColor = "text-primary",
  action,
  backHref,
  backLabel = "Voltar",
  badge,
  className,
  children,
}: AdminPageHeaderProps) {
  const ActionIcon = action?.icon || Plus

  return (
    <div className={cn("mb-8", className)}>
      {/* Back Link */}
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl md:text-4xl font-bold font-headline tracking-wide flex items-center gap-3">
            {Icon && <Icon className={cn("h-7 w-7 md:h-8 md:w-8", iconColor)} />}
            {title}
            {badge}
          </h1>
          {description && (
            <p className="text-muted-foreground text-sm md:text-base mt-1">
              {description}
            </p>
          )}
        </div>

        {/* Action Button */}
        {action && (
          action.href ? (
            <Link href={action.href}>
              <Button
                variant={action.variant || "default"}
                className="gap-2 transition-colors duration-200"
              >
                <ActionIcon className="h-4 w-4" />
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button
              onClick={action.onClick}
              variant={action.variant || "default"}
              className="gap-2 transition-colors duration-200"
            >
              <ActionIcon className="h-4 w-4" />
              {action.label}
            </Button>
          )
        )}

        {/* Custom Children */}
        {children}
      </div>
    </div>
  )
}
