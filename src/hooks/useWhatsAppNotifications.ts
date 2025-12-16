"use client"

import { useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useWhatsAppSSE, SSEEventData } from "./useWhatsAppSSE"

interface UseWhatsAppNotificationsOptions {
  enabled?: boolean
  currentUserId?: string
  playSound?: boolean
}

/**
 * Hook para gerenciar notificacoes do WhatsApp
 * - Toca som quando recebe nova atribuicao ou transferencia do bot
 * - Mostra toast com acao para ir para a conversa
 */
export function useWhatsAppNotifications(options: UseWhatsAppNotificationsOptions = {}) {
  const { enabled = true, currentUserId, playSound = true } = options
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { addEventListener } = useWhatsAppSSE({ enabled })

  // Inicializar audio
  useEffect(() => {
    if (typeof window !== "undefined" && playSound) {
      // Usar um som de notificacao padrao (Base64 de um beep curto)
      audioRef.current = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleGo0dJB9Y1JTfKO4qp9rb1Z6lqahn39uc3t8d3RzbnJyb2xsaWtrampoaGdnZmVlZGRjY2JiYWFgYF9fXl5dXVxcW1tbWlpaWVlZWFhYV1dXVlZWVVVVVFRUU1NTUlJSUVFRUFBQT09PT05OTk1NTUxMTEtLS0pKSklJSUhISEdHR0ZGRkVFRUREREND"
      )
      audioRef.current.volume = 0.5
    }
    return () => {
      audioRef.current = null
    }
  }, [playSound])

  // Funcao para tocar som
  const playNotificationSound = useCallback(() => {
    if (audioRef.current && playSound) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch((error) => {
        // Ignora erro se usuario nao interagiu ainda
        console.debug("[Notifications] Could not play sound:", error.message)
      })
    }
  }, [playSound])

  // Funcao para navegar para conversa
  const goToConversation = useCallback(
    (conversationId: string) => {
      router.push(`/whatsapp?conversation=${conversationId}`)
    },
    [router]
  )

  // Handler para nova atribuicao
  const handleNewAssignment = useCallback(
    (data: SSEEventData["new_assignment"]) => {
      // Verificar se e para o usuario atual
      if (currentUserId && data.targetUserId !== currentUserId) {
        return
      }

      if (data.playSound) {
        playNotificationSound()
      }

      toast(data.title, {
        description: data.body,
        action: {
          label: "Ver conversa",
          onClick: () => goToConversation(data.conversationId),
        },
        duration: 10000,
      })
    },
    [currentUserId, playNotificationSound, goToConversation]
  )

  // Handler para transferencia do bot
  const handleBotTransfer = useCallback(
    (data: SSEEventData["bot_transfer"]) => {
      // Verificar se e para o usuario atual
      if (currentUserId && data.targetUserId !== currentUserId) {
        return
      }

      if (data.playSound) {
        playNotificationSound()
      }

      toast.success(data.title, {
        description: data.body,
        action: {
          label: "Atender",
          onClick: () => goToConversation(data.conversationId),
        },
        duration: 15000,
      })
    },
    [currentUserId, playNotificationSound, goToConversation]
  )

  // Registrar listeners
  useEffect(() => {
    if (!enabled) return

    const removeAssignment = addEventListener("new_assignment", handleNewAssignment)
    const removeTransfer = addEventListener("bot_transfer", handleBotTransfer)

    return () => {
      removeAssignment()
      removeTransfer()
    }
  }, [enabled, addEventListener, handleNewAssignment, handleBotTransfer])

  return {
    playNotificationSound,
    goToConversation,
  }
}

/**
 * Hook simplificado para tocar som de notificacao
 */
export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleGo0dJB9Y1JTfKO4qp9rb1Z6lqahn39uc3t8d3RzbnJyb2xsaWtrampoaGdnZmVlZGRjY2JiYWFgYF9fXl5dXVxcW1tbWlpaWVlZWFhYV1dXVlZWVVVVVFRUU1NTUlJSUVFRUFBQT09PT05OTk1NTUxMTEtLS0pKSklJSUhISEdHR0ZGRkVFRUREREND"
      )
      audioRef.current.volume = 0.5
    }
    return () => {
      audioRef.current = null
    }
  }, [])

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
  }, [])

  return { play }
}
