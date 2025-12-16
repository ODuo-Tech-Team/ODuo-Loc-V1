"use client"

import { useState, useRef, useCallback, useEffect } from "react"

interface AudioRecorderState {
  isRecording: boolean
  isPaused: boolean
  recordingTime: number
  audioBlob: Blob | null
  audioUrl: string | null
  error: string | null
}

interface UseAudioRecorderReturn extends AudioRecorderState {
  startRecording: () => Promise<void>
  stopRecording: () => void
  pauseRecording: () => void
  resumeRecording: () => void
  cancelRecording: () => void
  clearRecording: () => void
}

const MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/mpeg",
]

function getSupportedMimeType(): string {
  for (const mimeType of MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType
    }
  }
  return "audio/webm"
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    recordingTime: 0,
    audioBlob: null,
    audioUrl: null,
    error: null,
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Limpar recursos ao desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (state.audioUrl) {
        URL.revokeObjectURL(state.audioUrl)
      }
    }
  }, [state.audioUrl])

  const startRecording = useCallback(async () => {
    try {
      // Verificar suporte
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Seu navegador nao suporta gravacao de audio")
      }

      // Solicitar permissao do microfone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })

      streamRef.current = stream
      chunksRef.current = []

      const mimeType = getSupportedMimeType()
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType })
        const audioUrl = URL.createObjectURL(audioBlob)

        setState((prev) => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          audioBlob,
          audioUrl,
        }))

        // Limpar stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event)
        setState((prev) => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          error: "Erro durante a gravacao",
        }))
      }

      // Iniciar gravacao
      mediaRecorder.start(100) // Coletar dados a cada 100ms

      // Iniciar timer
      timerRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          recordingTime: prev.recordingTime + 1,
        }))
      }, 1000)

      setState({
        isRecording: true,
        isPaused: false,
        recordingTime: 0,
        audioBlob: null,
        audioUrl: null,
        error: null,
      })
    } catch (error) {
      console.error("Error starting recording:", error)

      let errorMessage = "Erro ao iniciar gravacao"
      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          errorMessage = "Permissao de microfone negada"
        } else if (error.name === "NotFoundError") {
          errorMessage = "Nenhum microfone encontrado"
        } else if (error.name === "NotReadableError") {
          errorMessage = "Microfone em uso por outro aplicativo"
        }
      }

      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }))
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause()

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      setState((prev) => ({
        ...prev,
        isPaused: true,
      }))
    }
  }, [])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume()

      timerRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          recordingTime: prev.recordingTime + 1,
        }))
      }, 1000)

      setState((prev) => ({
        ...prev,
        isPaused: false,
      }))
    }
  }, [])

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    chunksRef.current = []

    setState({
      isRecording: false,
      isPaused: false,
      recordingTime: 0,
      audioBlob: null,
      audioUrl: null,
      error: null,
    })
  }, [])

  const clearRecording = useCallback(() => {
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl)
    }

    setState((prev) => ({
      ...prev,
      audioBlob: null,
      audioUrl: null,
      recordingTime: 0,
    }))
  }, [state.audioUrl])

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    clearRecording,
  }
}

// Utilitário para formatar tempo de gravação
export function formatRecordingTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

// Utilitário para converter Blob para base64
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      // Remove o prefixo "data:audio/...;base64,"
      const base64Data = base64.split(",")[1]
      resolve(base64Data)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
