"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tag, Plus, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Tags pre-definidas com cores
const PREDEFINED_TAGS = [
  { name: "interessado", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { name: "urgente", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { name: "aguardando", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { name: "negociando", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { name: "orcamento", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { name: "recorrente", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  { name: "vip", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { name: "novo", color: "bg-green-500/20 text-green-400 border-green-500/30" },
]

interface TagSelectorProps {
  conversationId: string
  tags: string[]
  onTagsChange: (tags: string[]) => void
  compact?: boolean
}

export function TagSelector({
  conversationId,
  tags,
  onTagsChange,
  compact = false,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false)
  const [newTag, setNewTag] = useState("")
  const [saving, setSaving] = useState(false)

  const getTagColor = (tagName: string) => {
    const predefined = PREDEFINED_TAGS.find(
      (t) => t.name.toLowerCase() === tagName.toLowerCase()
    )
    return predefined?.color || "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
  }

  const handleToggleTag = async (tagName: string) => {
    const normalizedTag = tagName.toLowerCase().trim()
    const isSelected = tags.includes(normalizedTag)
    const newTags = isSelected
      ? tags.filter((t) => t !== normalizedTag)
      : [...tags, normalizedTag]

    await updateTags(newTags)
  }

  const handleAddCustomTag = async () => {
    if (!newTag.trim()) return

    const normalizedTag = newTag.toLowerCase().trim()
    if (tags.includes(normalizedTag)) {
      toast.error("Tag ja existe")
      return
    }

    const newTags = [...tags, normalizedTag]
    await updateTags(newTags)
    setNewTag("")
  }

  const handleRemoveTag = async (tagName: string) => {
    const newTags = tags.filter((t) => t !== tagName)
    await updateTags(newTags)
  }

  const updateTags = async (newTags: string[]) => {
    try {
      setSaving(true)
      const response = await fetch(
        `/api/whatsapp/conversations/${conversationId}/tags`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tags: newTags }),
        }
      )

      if (response.ok) {
        onTagsChange(newTags)
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao atualizar tags")
      }
    } catch (error) {
      toast.error("Erro ao atualizar tags")
    } finally {
      setSaving(false)
    }
  }

  if (compact) {
    // Versao compacta para lista de conversas
    return (
      <div className="flex flex-wrap gap-1">
        {tags.slice(0, 2).map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className={cn("text-xs px-1.5 py-0", getTagColor(tag))}
          >
            {tag}
          </Badge>
        ))}
        {tags.length > 2 && (
          <Badge variant="outline" className="text-xs px-1.5 py-0">
            +{tags.length - 2}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="text-xs text-zinc-500 uppercase flex items-center gap-1">
        <Tag className="h-3 w-3" />
        Tags
      </label>

      {/* Tags atuais */}
      <div className="flex flex-wrap gap-1 min-h-[28px]">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className={cn("gap-1 pr-1", getTagColor(tag))}
          >
            {tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="ml-1 hover:text-red-400"
              disabled={saving}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {tags.length === 0 && (
          <span className="text-xs text-zinc-500">Nenhuma tag</span>
        )}
      </div>

      {/* Adicionar tag */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <Plus className="h-3 w-3 mr-2" />
            Adicionar Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="space-y-3">
            {/* Tags pre-definidas */}
            <div>
              <p className="text-xs text-zinc-500 mb-2">Tags disponiveis</p>
              <div className="flex flex-wrap gap-1">
                {PREDEFINED_TAGS.map(({ name, color }) => {
                  const isSelected = tags.includes(name)
                  return (
                    <button
                      key={name}
                      onClick={() => handleToggleTag(name)}
                      disabled={saving}
                      className={cn(
                        "px-2 py-1 text-xs rounded-full border transition-all",
                        color,
                        isSelected && "ring-2 ring-white/30"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 inline mr-1" />}
                      {name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tag customizada */}
            <div>
              <p className="text-xs text-zinc-500 mb-2">Tag personalizada</p>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Nova tag..."
                  className="h-8 text-sm bg-zinc-800 border-zinc-700"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCustomTag()
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleAddCustomTag}
                  disabled={saving || !newTag.trim()}
                  className="h-8"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Export para uso na lista de conversas
export function TagBadges({ tags }: { tags: string[] }) {
  const getTagColor = (tagName: string) => {
    const predefined = PREDEFINED_TAGS.find(
      (t) => t.name.toLowerCase() === tagName.toLowerCase()
    )
    return predefined?.color || "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
  }

  if (!tags || tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {tags.slice(0, 2).map((tag) => (
        <Badge
          key={tag}
          variant="outline"
          className={cn("text-xs px-1.5 py-0 h-4", getTagColor(tag))}
        >
          {tag}
        </Badge>
      ))}
      {tags.length > 2 && (
        <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 bg-zinc-800">
          +{tags.length - 2}
        </Badge>
      )}
    </div>
  )
}
