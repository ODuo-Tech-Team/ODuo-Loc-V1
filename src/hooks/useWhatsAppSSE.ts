"use client"

import { useEffect, useRef, useCallback, useState } from "react"

export type SSEEventType =
  | "new_message"
  | "message_status"
  | "conversation_update"
  | "connection_status"
  | "typing"
  | "new_assignment"
  | "bot_transfer"

export interface SSEEventData {
  new_message: {
    conversationId: string
    message: {
      id: string
      direction: string
      type: string
      content?: string
      contactPhone: string
      contactName?: string
    }
  }
  message_status: {
    messageId: string
    status: string
  }
  conversation_update: {
    conversationId: string
    status?: string
    unreadCount?: number
    lastMessage?: string
    assignedToId?: string
  }
  connection_status: {
    status: string
    phoneNumber?: string
  }
  typing: {
    conversationId: string
    isTyping: boolean
  }
  new_assignment: {
    targetUserId: string
    conversationId: string
    title: string
    body?: string
    playSound?: boolean
  }
  bot_transfer: {
    targetUserId: string
    conversationId: string
    title: string
    body?: string
    playSound?: boolean
  }
}

type EventCallback<T extends SSEEventType> = (data: SSEEventData[T]) => void

interface UseWhatsAppSSEOptions {
  enabled?: boolean
  onError?: (error: Error) => void
  onConnect?: () => void
  onDisconnect?: () => void
}

export function useWhatsAppSSE(options: UseWhatsAppSSEOptions = {}) {
  const { enabled = true, onError, onConnect, onDisconnect } = options

  const eventSourceRef = useRef<EventSource | null>(null)
  const listenersRef = useRef<Map<SSEEventType, Set<EventCallback<any>>>>(new Map())
  const lastEventIdRef = useRef<string | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null)

  // Função para conectar ao SSE
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const url = new URL("/api/sse/whatsapp", window.location.origin)
    if (lastEventIdRef.current) {
      url.searchParams.set("lastEventId", lastEventIdRef.current)
    }

    const eventSource = new EventSource(url.toString())
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setIsConnected(true)
      onConnect?.()

      // Limpar timeout de reconexão se existir
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      onDisconnect?.()

      // Tentar reconectar após 3 segundos
      if (!reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null
          if (enabled) {
            connect()
          }
        }, 3000)
      }
    }

    // Registrar handlers para cada tipo de evento
    const eventTypes: SSEEventType[] = [
      "new_message",
      "message_status",
      "conversation_update",
      "connection_status",
      "typing",
      "new_assignment",
      "bot_transfer",
    ]

    eventTypes.forEach((eventType) => {
      eventSource.addEventListener(eventType, (event) => {
        try {
          const data = JSON.parse(event.data)
          lastEventIdRef.current = event.lastEventId

          // Atualizar status de conexão se for evento de connection_status
          if (eventType === "connection_status") {
            setConnectionStatus(data.status)
          }

          // Notificar todos os listeners registrados
          const listeners = listenersRef.current.get(eventType)
          if (listeners) {
            listeners.forEach((callback) => callback(data))
          }
        } catch (error) {
          console.error("[SSE] Error parsing event:", error)
          onError?.(error as Error)
        }
      })
    })
  }, [enabled, onConnect, onDisconnect, onError])

  // Função para desconectar
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    setIsConnected(false)
  }, [])

  // Função para adicionar listener
  const addEventListener = useCallback(
    <T extends SSEEventType>(eventType: T, callback: EventCallback<T>) => {
      if (!listenersRef.current.has(eventType)) {
        listenersRef.current.set(eventType, new Set())
      }
      listenersRef.current.get(eventType)!.add(callback)

      // Retorna função para remover listener
      return () => {
        listenersRef.current.get(eventType)?.delete(callback)
      }
    },
    []
  )

  // Conectar/desconectar quando enabled mudar
  useEffect(() => {
    if (enabled) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, connect, disconnect])

  return {
    isConnected,
    connectionStatus,
    addEventListener,
    connect,
    disconnect,
  }
}

// Hook para escutar eventos específicos
export function useWhatsAppEvent<T extends SSEEventType>(
  eventType: T,
  callback: EventCallback<T>,
  deps: React.DependencyList = []
) {
  const { addEventListener } = useWhatsAppSSE()

  useEffect(() => {
    const removeListener = addEventListener(eventType, callback)
    return removeListener
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, addEventListener, ...deps])
}
