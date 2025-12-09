"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilterOption {
  value: string
  label: string
}

interface FilterConfig {
  key: string
  label: string
  placeholder?: string
  options: FilterOption[]
  width?: string
}

interface AdminFilterCardProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  filters?: FilterConfig[]
  filterValues?: Record<string, string>
  onFilterChange?: (key: string, value: string) => void
  onClearFilters?: () => void
  showClearButton?: boolean
  className?: string
  children?: React.ReactNode
}

export function AdminFilterCard({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Buscar...",
  filters = [],
  filterValues = {},
  onFilterChange,
  onClearFilters,
  showClearButton = true,
  className,
  children,
}: AdminFilterCardProps) {
  const hasActiveFilters = Object.values(filterValues).some((v) => v && v !== "all")

  return (
    <Card className={cn("bg-zinc-900/50 border-zinc-800", className)}>
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          {onSearchChange && (
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className={cn(
                  "pl-10 h-11",
                  "bg-zinc-800/50 border-zinc-700",
                  "focus:border-primary focus:ring-1 focus:ring-primary/30",
                  "placeholder:text-zinc-500"
                )}
              />
              {searchValue && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* Filters */}
          {filters.length > 0 && (
            <div className="flex flex-wrap gap-3 items-center">
              {filters.map((filter) => (
                <Select
                  key={filter.key}
                  value={filterValues[filter.key] || "all"}
                  onValueChange={(value) => onFilterChange?.(filter.key, value)}
                >
                  <SelectTrigger
                    className={cn(
                      filter.width || "w-[180px]",
                      "h-11 bg-zinc-800/50 border-zinc-700",
                      "focus:border-primary focus:ring-1 focus:ring-primary/30"
                    )}
                  >
                    <SelectValue placeholder={filter.placeholder || filter.label} />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="all" className="text-zinc-400">
                      {filter.label}
                    </SelectItem>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}

              {/* Clear Filters Button */}
              {showClearButton && hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="h-11 px-3 text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          )}

          {/* Custom Children */}
          {children}
        </div>
      </CardContent>
    </Card>
  )
}
