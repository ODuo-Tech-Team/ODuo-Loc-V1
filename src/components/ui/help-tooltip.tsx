"use client"

import * as React from "react"
import { HelpCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface HelpTooltipProps {
  content: React.ReactNode
  className?: string
  iconClassName?: string
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
}

export function HelpTooltip({
  content,
  className,
  iconClassName,
  side = "top",
  align = "center",
}: HelpTooltipProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              className
            )}
          >
            <HelpCircle className={cn("h-4 w-4", iconClassName)} />
            <span className="sr-only">Ajuda</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} align={align} className="max-w-xs">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Componente para usar em Labels de formulário
interface LabelWithHelpProps {
  children: React.ReactNode
  helpText: string
  htmlFor?: string
  required?: boolean
}

export function LabelWithHelp({
  children,
  helpText,
  htmlFor,
  required,
}: LabelWithHelpProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1.5"
    >
      {children}
      {required && <span className="text-destructive">*</span>}
      <HelpTooltip content={helpText} />
    </label>
  )
}
