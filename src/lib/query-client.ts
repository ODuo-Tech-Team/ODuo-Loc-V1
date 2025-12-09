import { QueryClient } from "@tanstack/react-query"

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Dados ficam "frescos" por 5 minutos antes de refetch automático
        staleTime: 5 * 60 * 1000,
        // Cache é mantido por 30 minutos
        gcTime: 30 * 60 * 1000,
        // Retry 2 vezes em caso de erro
        retry: 2,
        // Não refetch automático ao focar a janela (evita requests desnecessários)
        refetchOnWindowFocus: false,
        // Refetch ao reconectar
        refetchOnReconnect: true,
      },
      mutations: {
        // Retry 1 vez para mutations
        retry: 1,
      },
    },
  })
}

// Singleton para o cliente
let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: sempre cria um novo query client
    return makeQueryClient()
  } else {
    // Browser: reutiliza o mesmo query client
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient()
    }
    return browserQueryClient
  }
}
