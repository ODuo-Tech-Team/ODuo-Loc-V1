"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus, Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

export interface SearchableSelectOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value?: string
  onSelect: (value: string) => void
  onCreateNew?: () => void
  createNewLabel?: string
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  loading?: boolean
  className?: string
  renderOption?: (option: SearchableSelectOption) => React.ReactNode
}

export function SearchableSelect({
  options,
  value,
  onSelect,
  onCreateNew,
  createNewLabel = "Adicionar novo",
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum resultado encontrado",
  disabled = false,
  loading = false,
  className,
  renderOption,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Filtra opções baseado na busca
  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options

    const searchLower = search.toLowerCase()
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchLower) ||
        option.description?.toLowerCase().includes(searchLower)
    )
  }, [options, search])

  // Encontra a opção selecionada
  const selectedOption = options.find((option) => option.value === value)

  // Foca no input quando abre
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      setSearch("")
    }
  }, [open])

  const handleSelect = (optionValue: string) => {
    onSelect(optionValue)
    setOpen(false)
  }

  const handleCreateNew = () => {
    setOpen(false)
    onCreateNew?.()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando...
            </span>
          ) : selectedOption ? (
            <span className="truncate">{selectedOption.label}</span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        {/* Campo de busca */}
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            ref={inputRef}
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
          />
        </div>

        {/* Lista de opções */}
        <div className="max-h-[300px] overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            <div className="p-1">
              {filteredOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  disabled={option.disabled}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm outline-none transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground",
                    option.disabled && "opacity-50 cursor-not-allowed",
                    value === option.value && "bg-accent"
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 flex-shrink-0",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {renderOption ? (
                    renderOption(option)
                  ) : (
                    <div className="flex flex-col items-start">
                      <span>{option.label}</span>
                      {option.description && (
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Botão de adicionar novo */}
        {onCreateNew && (
          <div className="border-t p-1">
            <button
              onClick={handleCreateNew}
              className={cn(
                "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm outline-none transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "text-primary font-medium"
              )}
            >
              <Plus className="mr-2 h-4 w-4" />
              {createNewLabel}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// Versão controlada com label
interface SearchableSelectFieldProps extends SearchableSelectProps {
  label?: string
  error?: string
  required?: boolean
  helpText?: string
}

export function SearchableSelectField({
  label,
  error,
  required,
  helpText,
  className,
  ...props
}: SearchableSelectFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </label>
      )}
      <SearchableSelect {...props} />
      {helpText && !error && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
