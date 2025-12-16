"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Mic,
  Square,
  Pause,
  Play,
  Trash2,
  Send,
  X,
  Loader2,
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

// Componente de onda sonora animada
function AudioWaveform({ isActive, barCount = 24 }: { isActive: boolean; barCount?: number }) {
  return (
    <div className="flex items-center justify-center gap-[2px] h-8">
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-[3px] rounded-full transition-all duration-150",
            isActive
              ? "bg-gradient-to-t from-emerald-600 to-emerald-400 animate-audio-wave"
              : "bg-zinc-600 h-1"
          )}
          style={isActive ? {
            animationDelay: `${i * 60}ms`,
            height: `${Math.sin((i / barCount) * Math.PI) * 16 + 8}px`,
          } : undefined}
        />
      ))}
    </div>
  )
}

// Componente de barra de progresso do audio
function AudioProgressBar({
  audioRef,
  duration
}: {
  audioRef: React.RefObject<HTMLAudioElement | null>
  duration: number
}) {
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const progressBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100)
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [audioRef])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    const progressBar = progressBarRef.current
    if (!audio || !progressBar) return

    const rect = progressBar.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    audio.currentTime = audio.duration * percentage
  }, [audioRef])

  return (
    <div
      ref={progressBarRef}
      onClick={handleProgressClick}
      className="flex-1 h-8 flex items-center cursor-pointer group"
    >
      <div className="w-full h-[6px] bg-zinc-700 rounded-full overflow-hidden relative">
        {/* Fundo com waveform pattern */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 3 Q 5 0, 10 3 T 20 3 T 30 3 T 40 3 T 50 3 T 60 3 T 70 3 T 80 3 T 90 3 T 100 3' stroke='%2310b981' fill='none' stroke-width='2'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat-x',
            backgroundSize: '100px 6px',
          }}
        />
        {/* Progresso */}
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-100 relative"
          style={{ width: `${progress}%` }}
        >
          {/* Indicador circular */}
          <div
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2",
              "w-3 h-3 bg-white rounded-full shadow-md",
              "transition-transform duration-150",
              "group-hover:scale-125",
              isPlaying && "scale-110"
            )}
          />
        </div>
      </div>
    </div>
  )
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
  const [isPlayingPreview, setIsPlayingPreview] = useState(false)

  // Iniciar gravacao automaticamente quando o componente monta
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

  const togglePlayPreview = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      audio.play()
      setIsPlayingPreview(true)
    } else {
      audio.pause()
      audio.currentTime = 0
      setIsPlayingPreview(false)
    }
  }, [])

  // Atualizar estado quando o audio termina
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = () => setIsPlayingPreview(false)
    audio.addEventListener("ended", handleEnded)
    return () => audio.removeEventListener("ended", handleEnded)
  }, [audioUrl])

  // Estado: Gravando
  if (isRecording) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-zinc-800 to-zinc-800/80 rounded-xl border border-zinc-700/50 shadow-lg">
        {/* Indicador de gravacao pulsante */}
        <div className="flex items-center gap-2 min-w-[80px]">
          <div className="relative">
            <div
              className={cn(
                "w-3 h-3 rounded-full transition-colors",
                isPaused ? "bg-amber-500" : "bg-red-500"
              )}
            />
            {!isPaused && (
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-red-500 animate-ping opacity-75" />
            )}
          </div>
          <span className="text-sm font-mono font-medium text-zinc-200 tabular-nums">
            {formatRecordingTime(recordingTime)}
          </span>
        </div>

        {/* Visualizacao de onda */}
        <div className="flex-1">
          {isPaused ? (
            <div className="flex items-center justify-center h-8">
              <span className="text-xs text-amber-400/80 font-medium uppercase tracking-wide">
                Pausado
              </span>
            </div>
          ) : (
            <AudioWaveform isActive={true} />
          )}
        </div>

        {/* Controles */}
        <div className="flex items-center gap-1.5">
          {/* Pausar/Retomar */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-9 w-9 rounded-full transition-colors",
              isPaused
                ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                : "text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10"
            )}
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
            className="h-9 w-9 rounded-full text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            onClick={handleCancel}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          {/* Parar e preparar para enviar */}
          <Button
            size="icon"
            className="h-9 w-9 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 transition-all hover:shadow-lg hover:shadow-emerald-500/30"
            onClick={stopRecording}
          >
            <Square className="h-4 w-4 fill-current" />
          </Button>
        </div>
      </div>
    )
  }

  // Estado: Audio gravado (preview)
  if (audioBlob && audioUrl) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-zinc-800 to-zinc-800/80 rounded-xl border border-zinc-700/50 shadow-lg">
        {/* Player de audio oculto */}
        <audio ref={audioRef} src={audioUrl} className="hidden" />

        {/* Botao Play/Pause */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-10 w-10 rounded-full transition-all",
            isPlayingPreview
              ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
              : "bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700 hover:text-white"
          )}
          onClick={togglePlayPreview}
        >
          {isPlayingPreview ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>

        {/* Barra de progresso interativa */}
        <AudioProgressBar audioRef={audioRef} duration={recordingTime} />

        {/* Duracao */}
        <span className="text-sm font-mono text-zinc-400 tabular-nums min-w-[48px] text-right">
          {formatRecordingTime(recordingTime)}
        </span>

        {/* Separador */}
        <div className="w-px h-6 bg-zinc-700" />

        {/* Acoes */}
        <div className="flex items-center gap-1.5">
          {/* Descartar */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            onClick={handleCancel}
            disabled={sending}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Regravar */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
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
            size="icon"
            className="h-9 w-9 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 transition-all hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50"
            onClick={handleSend}
            disabled={sending}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
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
      className={cn(
        "h-10 w-10 rounded-full transition-all duration-200",
        "text-zinc-400 hover:text-emerald-400",
        "hover:bg-emerald-500/10",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
      onClick={onClick}
      disabled={disabled}
      title="Gravar audio"
    >
      <Mic className="h-5 w-5" />
    </Button>
  )
}

// Player de audio estilizado para mensagens
interface AudioMessagePlayerProps {
  src: string
  isOutbound?: boolean
}

export function AudioMessagePlayer({ src, isOutbound = false }: AudioMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100)
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)
      setCurrentTime(0)
    }

    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      audio.play()
    } else {
      audio.pause()
    }
  }, [])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    const progressBar = progressRef.current
    if (!audio || !progressBar || !audio.duration) return

    const rect = progressBar.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    audio.currentTime = audio.duration * percentage
  }, [])

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex items-center gap-2 min-w-[200px] max-w-[280px]">
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

      {/* Botao Play/Pause */}
      <button
        onClick={togglePlay}
        className={cn(
          "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all",
          isOutbound
            ? "bg-emerald-500/30 text-white hover:bg-emerald-500/40"
            : "bg-zinc-600/50 text-zinc-200 hover:bg-zinc-600/70"
        )}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" />
        )}
      </button>

      {/* Barra de progresso */}
      <div className="flex-1 flex flex-col gap-0.5">
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="h-5 flex items-center cursor-pointer group"
        >
          <div className={cn(
            "w-full h-[4px] rounded-full overflow-hidden relative",
            isOutbound ? "bg-emerald-500/30" : "bg-zinc-600/50"
          )}>
            {/* Waveform pattern de fundo */}
            <div className="absolute inset-0 flex items-center justify-around opacity-40">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-[2px] rounded-full",
                    isOutbound ? "bg-emerald-300" : "bg-zinc-400"
                  )}
                  style={{
                    height: `${Math.sin((i / 30) * Math.PI * 3) * 2 + 3}px`,
                  }}
                />
              ))}
            </div>
            {/* Progresso */}
            <div
              className={cn(
                "h-full rounded-full transition-all duration-100 relative",
                isOutbound ? "bg-white/80" : "bg-emerald-400"
              )}
              style={{ width: `${progress}%` }}
            >
              {/* Indicador circular */}
              <div
                className={cn(
                  "absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2",
                  "w-2.5 h-2.5 rounded-full shadow-sm",
                  "transition-transform duration-150",
                  "group-hover:scale-125",
                  isOutbound ? "bg-white" : "bg-emerald-400"
                )}
              />
            </div>
          </div>
        </div>

        {/* Duracao */}
        <span className={cn(
          "text-[10px] font-mono tabular-nums",
          isOutbound ? "text-emerald-200/70" : "text-zinc-400"
        )}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  )
}
