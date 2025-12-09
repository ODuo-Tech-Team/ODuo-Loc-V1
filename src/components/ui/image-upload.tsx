"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, X, Loader2, ImageIcon, AlertCircle } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ImageUploadProps {
  value?: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
  className?: string
  maxImages?: number
}

export function ImageUpload({
  value = [],
  onChange,
  disabled,
  className,
  maxImages = 5
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    // Verificar limite de imagens
    const remainingSlots = maxImages - value.length
    if (remainingSlots <= 0) {
      toast.error(`Limite de ${maxImages} imagens atingido`)
      return
    }

    // Limitar arquivos ao espaço disponível
    const filesToUpload = Array.from(files).slice(0, remainingSlots)

    setUploading(true)

    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        // Validar tipo
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`${file.name}: Tipo não permitido. Use JPG, PNG, WebP ou GIF`)
        }

        // Validar tamanho (5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name}: Arquivo muito grande (máx. 5MB)`)
        }

        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Erro no upload")
        }

        const data = await response.json()
        return data.url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      onChange([...value, ...uploadedUrls])
      toast.success(`${uploadedUrls.length} imagem${uploadedUrls.length > 1 ? 's' : ''} enviada${uploadedUrls.length > 1 ? 's' : ''}`)
    } catch (error: any) {
      console.error("Upload error:", error)
      toast.error(error.message || "Erro ao enviar imagem")
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }, [value, onChange, maxImages])

  const handleRemove = useCallback((index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }, [value, onChange])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled || uploading) return
    handleUpload(e.dataTransfer.files)
  }, [disabled, uploading, handleUpload])

  const canUpload = value.length < maxImages && !disabled && !uploading

  return (
    <div className={cn("space-y-4", className)}>
      {/* Image Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {value.map((url, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted"
            >
              <img
                src={url}
                alt={`Imagem ${index + 1}`}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                onClick={() => handleRemove(index)}
                disabled={disabled || uploading}
              >
                <X className="h-4 w-4" />
              </Button>
              <span className="absolute bottom-2 left-2 text-xs text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                {index + 1}/{value.length}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-all",
          dragActive && canUpload && "border-primary bg-primary/5",
          !canUpload && "opacity-50 cursor-not-allowed",
          canUpload && !dragActive && "border-border hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={(e) => handleUpload(e.target.files)}
          disabled={!canUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="flex flex-col items-center justify-center py-8 px-4">
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
              <p className="text-sm font-medium">Enviando...</p>
            </>
          ) : (
            <>
              <div className={cn(
                "p-3 rounded-full mb-3 transition-colors",
                dragActive ? "bg-primary/10" : "bg-muted"
              )}>
                {value.length >= maxImages ? (
                  <AlertCircle className="h-6 w-6 text-muted-foreground" />
                ) : (
                  <ImageIcon className={cn(
                    "h-6 w-6",
                    dragActive ? "text-primary" : "text-muted-foreground"
                  )} />
                )}
              </div>

              <p className="text-sm font-medium mb-1">
                {value.length >= maxImages
                  ? "Limite de imagens atingido"
                  : dragActive
                    ? "Solte para enviar"
                    : "Arraste imagens ou clique para selecionar"
                }
              </p>

              <p className="text-xs text-muted-foreground">
                {value.length < maxImages && (
                  <>
                    JPG, PNG, WebP ou GIF (máx. 5MB) • {value.length}/{maxImages}
                  </>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
