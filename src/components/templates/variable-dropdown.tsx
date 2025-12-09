"use client"

import { useState } from "react"
import { Editor } from "@tiptap/react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import {
  VARIABLES_BY_CATEGORY,
  CATEGORY_LABELS,
  type TemplateVariable,
} from "@/lib/template-variables"
import { Braces, Search, User, Calendar, Package, Building2, Clock } from "lucide-react"

interface VariableDropdownProps {
  editor: Editor | null
}

// Ícones por categoria
const categoryIcons: Record<string, React.ReactNode> = {
  cliente: <User className="h-3.5 w-3.5" />,
  reserva: <Calendar className="h-3.5 w-3.5" />,
  equipamento: <Package className="h-3.5 w-3.5" />,
  empresa: <Building2 className="h-3.5 w-3.5" />,
  outros: <Clock className="h-3.5 w-3.5" />,
}

// Cores por categoria
const categoryColors: Record<string, string> = {
  cliente: "text-blue-600",
  reserva: "text-green-600",
  equipamento: "text-orange-600",
  empresa: "text-purple-600",
  outros: "text-gray-600",
}

export function VariableDropdown({ editor }: VariableDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const handleInsertVariable = (variable: TemplateVariable) => {
    if (editor) {
      editor.chain().focus().insertVariable(variable.key).run()
      setOpen(false)
      setSearch("")
    }
  }

  // Filtrar variáveis pela busca
  const filteredCategories = Object.entries(VARIABLES_BY_CATEGORY).map(
    ([category, variables]) => ({
      category,
      variables: variables.filter(
        (v) =>
          v.label.toLowerCase().includes(search.toLowerCase()) ||
          v.key.toLowerCase().includes(search.toLowerCase()) ||
          v.description.toLowerCase().includes(search.toLowerCase())
      ),
    })
  ).filter((cat) => cat.variables.length > 0)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2"
          title="Inserir variável"
        >
          <Braces className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Variáveis</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar variável..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-1">
          {filteredCategories.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma variável encontrada
            </div>
          ) : (
            filteredCategories.map(({ category, variables }) => (
              <div key={category} className="mb-2">
                <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <span className={categoryColors[category]}>
                    {categoryIcons[category]}
                  </span>
                  {CATEGORY_LABELS[category]}
                </div>
                {variables.map((variable) => (
                  <button
                    key={variable.key}
                    onClick={() => handleInsertVariable(variable)}
                    className="w-full flex items-start gap-2 px-2 py-1.5 text-left rounded-md hover:bg-muted transition-colors"
                  >
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono shrink-0">
                      {`{${variable.key}}`}
                    </code>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{variable.label}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        Ex: {variable.example}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
