"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Paperclip,
  Image,
  Video,
  FileText,
  X,
  Send,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface UploadResult {
  url: string
  publicId: string
  type: string
  fileName: string
  mimeType: string
  size: number
}

interface FileUploaderProps {
  onUpload: (result: UploadResult, caption?: string) => Promise<void>
  disabled?: boolean
}

const ACCEPTED_TYPES = {
  image: "image/jpeg,image/png,image/webp,image/gif",
  video: "video/mp4,video/quicktime,video/webm",
  document: "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}

const ALL_ACCEPTED = `${ACCEPTED_TYPES.image},${ACCEPTED_TYPES.video},${ACCEPTED_TYPES.document}`

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return <Image className="h-8 w-8" />
  if (type.startsWith("video/")) return <Video className="h-8 w-8" />
  return <FileText className="h-8 w-8" />
}

export function FileUploader({ onUpload, disabled }: FileUploaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)

    // Criar preview para imagens
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else if (file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file)
      setPreview(url)
    } else {
      setPreview(null)
    }

    // Resetar input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setSelectedFile(null)
    setPreview(null)
    setCaption("")
    if (preview && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/whatsapp/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao fazer upload")
      }

      const result: UploadResult = await response.json()
      await onUpload(result, caption || undefined)

      handleClose()
      toast.success("Arquivo enviado")
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao enviar arquivo")
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      {/* Botao de anexo */}
      <Button
        variant="ghost"
        size="icon"
        className="flex-shrink-0"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        title="Anexar arquivo"
      >
        <Paperclip className="h-5 w-5" />
      </Button>

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALL_ACCEPTED}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Dialog de preview */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar arquivo</DialogTitle>
          </DialogHeader>

          {!selectedFile ? (
            // Selecao de tipo de arquivo
            <div className="space-y-4">
              <p className="text-sm text-zinc-500">
                Selecione o tipo de arquivo que deseja enviar
              </p>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = ACCEPTED_TYPES.image
                      fileInputRef.current.click()
                    }
                  }}
                  className="flex flex-col items-center gap-2 p-4 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <Image className="h-8 w-8 text-emerald-500" />
                  <span className="text-sm">Imagem</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = ACCEPTED_TYPES.video
                      fileInputRef.current.click()
                    }
                  }}
                  className="flex flex-col items-center gap-2 p-4 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <Video className="h-8 w-8 text-blue-500" />
                  <span className="text-sm">Video</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = ACCEPTED_TYPES.document
                      fileInputRef.current.click()
                    }
                  }}
                  className="flex flex-col items-center gap-2 p-4 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <FileText className="h-8 w-8 text-amber-500" />
                  <span className="text-sm">Documento</span>
                </button>
              </div>
            </div>
          ) : (
            // Preview do arquivo selecionado
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative border border-zinc-700 rounded-lg overflow-hidden">
                {selectedFile.type.startsWith("image/") && preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-48 object-contain bg-zinc-900"
                  />
                ) : selectedFile.type.startsWith("video/") && preview ? (
                  <video
                    src={preview}
                    controls
                    className="w-full h-48 object-contain bg-zinc-900"
                  />
                ) : (
                  <div className="w-full h-32 flex flex-col items-center justify-center bg-zinc-900 gap-2">
                    {getFileIcon(selectedFile.type)}
                    <span className="text-sm text-zinc-400 truncate max-w-full px-4">
                      {selectedFile.name}
                    </span>
                  </div>
                )}

                {/* Botao de remover */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 bg-zinc-900/80 hover:bg-zinc-800"
                  onClick={() => {
                    setSelectedFile(null)
                    setPreview(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Info do arquivo */}
              <div className="flex items-center justify-between text-sm text-zinc-500">
                <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                <span>{formatFileSize(selectedFile.size)}</span>
              </div>

              {/* Campo de legenda (para imagens e videos) */}
              {(selectedFile.type.startsWith("image/") || selectedFile.type.startsWith("video/")) && (
                <Input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Adicionar legenda (opcional)"
                  className="bg-zinc-800 border-zinc-700"
                />
              )}

              {/* Botoes de acao */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                  disabled={uploading}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
