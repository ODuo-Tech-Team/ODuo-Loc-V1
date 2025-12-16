"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Mic,
  Square,
  Pause,
  Play,
  Trash2,
  Send,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useAudioRecorder,
  formatRecordingTime,
  blobToBase64,
} from "@/hooks/useAudioRecorder"
import { toast } from "sonner"

interface AudioRecorderProps {
  onSend: (audioBase64: string) => Promise<void>
  onCancel: () => void
  sending?: boolean
}

export function AudioRecorder({ onSend, onCancel, sending }: AudioRecorderProps) {
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    clearRecording,
  } = useAudioRecorder()

  const audioRef = useRef<HTMLAudioElement>(null)

  // Iniciar gravação automaticamente quando o componente monta
  useEffect(() => {
    startRecording()
  }, [startRecording])

  // Mostrar erros
  useEffect(() => {
    if (error) {
      toast.error(error)
      onCancel()
    }
  }, [error, onCancel])

  const handleSend = async () => {
    if (!audioBlob) return

    try {
      const base64 = await blobToBase64(audioBlob)
      await onSend(base64)
      clearRecording()
    } catch (err) {
      toast.error("Erro ao enviar audio")
    }
  }

  const handleCancel = () => {
    cancelRecording()
    onCancel()
  }

  // Estado: Gravando
  if (isRecording) {
    return (
      <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
        {/* Indicador de gravação */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-3 h-3 rounded-full",
              isPaused ? "bg-yellow-500" : "bg-red-500 animate-pulse"
            )}
          />
          <span className="text-sm font-mono text-zinc-300">
            {formatRecordingTime(recordingTime)}
          </span>
        </div>

        {/* Visualização de onda (simplificada) */}
        <div className="flex-1 flex items-center justify-center gap-0.5">
          {!isPaused && Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-emerald-500 rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 16 + 8}px`,
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
          {isPaused && (
            <span className="text-xs text-zinc-500">Pausado</span>
          )}
        </div>

        {/* Controles */}
        <div className="flex items-center gap-2">
          {/* Pausar/Retomar */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={isPaused ? resumeRecording : pauseRecording}
          >
            {isPaused ? (
              <Play className="h-4 w-4" />
            ) : (
              <Pause className="h-4 w-4" />
            )}
          </Button>

          {/* Cancelar */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-red-500"
            onClick={handleCancel}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          {/* Parar e preparar para enviar */}
          <Button
            variant="default"
            size="icon"
            className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700"
            onClick={stopRecording}
          >
            <Square className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  // Estado: Audio gravado (preview)
  if (audioBlob && audioUrl) {
    return (
      <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
        {/* Player de audio */}
        <div className="flex-1 flex items-center gap-3">
          <audio ref={audioRef} src={audioUrl} className="hidden" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              if (audioRef.current) {
                if (audioRef.current.paused) {
                  audioRef.current.play()
                } else {
                  audioRef.current.pause()
                  audioRef.current.currentTime = 0
                }
              }
            }}
          >
            <Play className="h-4 w-4" />
          </Button>

          {/* Barra de progresso simplificada */}
          <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-full" />
          </div>

          <span className="text-sm font-mono text-zinc-400">
            {formatRecordingTime(recordingTime)}
          </span>
        </div>

        {/* Acoes */}
        <div className="flex items-center gap-2">
          {/* Descartar */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-red-500"
            onClick={handleCancel}
            disabled={sending}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Regravar */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              clearRecording()
              startRecording()
            }}
            disabled={sending}
          >
            <Mic className="h-4 w-4" />
          </Button>

          {/* Enviar */}
          <Button
            variant="default"
            size="icon"
            className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSend}
            disabled={sending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  // Estado inicial ou erro
  return null
}

// Botao para iniciar gravacao (usado no ChatPanel)
interface AudioRecordButtonProps {
  onClick: () => void
  disabled?: boolean
}

export function AudioRecordButton({ onClick, disabled }: AudioRecordButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-zinc-400 hover:text-emerald-500"
      onClick={onClick}
      disabled={disabled}
      title="Gravar audio"
    >
      <Mic className="h-5 w-5" />
    </Button>
  )
}
