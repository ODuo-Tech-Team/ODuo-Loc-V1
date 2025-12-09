import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// ============================================
// Types
// ============================================

export interface DashboardStats {
  customers: { total: number }
  equipment: { total: number; available: number }
  bookings: { total: number; active: number; pending: number }
  revenue: { total: number; thisMonth: number; pending: number }
  recentBookings: Array<{
    id: string
    startDate: string
    endDate: string
    totalPrice: number
    status: string
    customer: { name: string }
    equipment: { name: string }
  }>
}

export interface Equipment {
  id: string
  name: string
  description?: string | null
  category: string
  images: string[]
  pricePerHour?: number | null
  pricePerDay: number | null
  quantity: number
  status: string
  createdAt: string
}

export interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  cpfCnpj: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  _count: { bookings: number }
}

export interface Booking {
  id: string
  startDate: string
  endDate: string
  totalPrice: number
  status: string
  notes: string | null
  equipment: {
    id: string
    name: string
    category: string
    pricePerDay: number
  }
  customer: {
    id: string
    name: string
    email: string | null
    phone: string | null
  }
}

export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST"
export type LeadSource = "DIRECT" | "REFERRAL" | "WEBSITE" | "COLD_CALL" | "SOCIAL_MEDIA" | "EVENT" | "OTHER"

export interface Lead {
  id: string
  name: string
  company?: string | null
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
  city?: string | null
  state?: string | null
  status: LeadStatus
  source: LeadSource
  contactType: "PRESENCIAL" | "ONLINE"
  expectedValue?: number | null
  nextAction?: string | null
  nextActionDate?: string | null
  assignedTo?: {
    id: string
    name: string | null
    email: string | null
  } | null
  _count?: { activities: number }
  updatedAt: string
}

// ============================================
// Query Keys
// ============================================

export const queryKeys = {
  dashboard: ["dashboard"] as const,
  equipments: ["equipments"] as const,
  equipment: (id: string) => ["equipments", id] as const,
  customers: (params?: { search?: string; status?: string }) =>
    ["customers", params] as const,
  customer: (id: string) => ["customers", id] as const,
  bookings: (params?: { status?: string }) => ["bookings", params] as const,
  booking: (id: string) => ["bookings", id] as const,
  leads: ["leads"] as const,
  lead: (id: string) => ["leads", id] as const,
}

// ============================================
// Fetchers
// ============================================

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return response.json()
}

// ============================================
// Dashboard Hooks
// ============================================

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const data = await fetchJson<DashboardStats>("/api/dashboard/stats")
      return {
        ...data,
        recentBookings: data.recentBookings || [],
      }
    },
  })
}

// ============================================
// Equipment Hooks
// ============================================

interface UseEquipmentsOptions {
  initialData?: Equipment[]
}

export function useEquipments(options?: UseEquipmentsOptions) {
  return useQuery({
    queryKey: queryKeys.equipments,
    queryFn: async () => {
      const data = await fetchJson<Equipment[]>("/api/equipments")
      return Array.isArray(data) ? data : []
    },
    initialData: options?.initialData,
    // Se tem initialData, considera stale após 30s para refetch em background
    staleTime: options?.initialData ? 30 * 1000 : undefined,
  })
}

export function useDeleteEquipment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (equipmentId: string) => {
      const response = await fetch(`/api/equipments/${equipmentId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Erro ao deletar equipamento")
      return equipmentId
    },
    onSuccess: (deletedId) => {
      // Atualiza o cache removendo o item deletado
      queryClient.setQueryData<Equipment[]>(queryKeys.equipments, (old) =>
        old?.filter((eq) => eq.id !== deletedId) || []
      )
    },
  })
}

// ============================================
// Customer Hooks
// ============================================

interface UseCustomersOptions {
  search?: string
  status?: string
  initialData?: Customer[]
}

export function useCustomers(options?: UseCustomersOptions) {
  const searchParams = new URLSearchParams()
  if (options?.search) searchParams.append("search", options.search)
  if (options?.status && options.status !== "all") {
    searchParams.append("status", options.status)
  }

  return useQuery({
    queryKey: queryKeys.customers(options),
    queryFn: async () => {
      const data = await fetchJson<Customer[]>(`/api/customers?${searchParams}`)
      return Array.isArray(data) ? data : []
    },
    initialData: options?.initialData,
    staleTime: options?.initialData ? 30 * 1000 : undefined,
  })
}

export function useToggleCustomerStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      customerId,
      currentStatus,
    }: {
      customerId: string
      currentStatus: boolean
    }) => {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao atualizar status")
      }
      return { customerId, newStatus: !currentStatus }
    },
    onSuccess: ({ customerId, newStatus }) => {
      // Invalida todas as queries de customers para refetch
      queryClient.invalidateQueries({ queryKey: ["customers"] })
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (customerId: string) => {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao excluir cliente")
      }
      return customerId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
    },
  })
}

// ============================================
// Booking Hooks
// ============================================

interface UseBookingsOptions {
  status?: string
  initialData?: Booking[]
}

export function useBookings(options?: UseBookingsOptions) {
  const searchParams = new URLSearchParams()
  if (options?.status && options.status !== "all") {
    searchParams.append("status", options.status)
  }

  return useQuery({
    queryKey: queryKeys.bookings(options),
    queryFn: async () => {
      const data = await fetchJson<Booking[]>(`/api/bookings?${searchParams}`)
      return Array.isArray(data) ? data : []
    },
    initialData: options?.initialData,
    staleTime: options?.initialData ? 30 * 1000 : undefined,
  })
}

export function useMarkBookingAsLost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao marcar como perdido")
      }
      return bookingId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
    },
  })
}

export function useDeleteBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await fetch(`/api/bookings/${bookingId}?permanent=true`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao excluir orçamento")
      }
      return bookingId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
    },
  })
}

// ============================================
// Lead Hooks
// ============================================

export function useLeads() {
  return useQuery({
    queryKey: queryKeys.leads,
    queryFn: async () => {
      const data = await fetchJson<Lead[]>("/api/comercial")
      return Array.isArray(data) ? data : []
    },
  })
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      leadId,
      status,
    }: {
      leadId: string
      status: LeadStatus
    }) => {
      const response = await fetch(`/api/comercial/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error("Erro ao atualizar status")
      return { leadId, status }
    },
    // Atualização otimista
    onMutate: async ({ leadId, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.leads })
      const previousLeads = queryClient.getQueryData<Lead[]>(queryKeys.leads)

      queryClient.setQueryData<Lead[]>(queryKeys.leads, (old) =>
        old?.map((lead) =>
          lead.id === leadId ? { ...lead, status } : lead
        ) || []
      )

      return { previousLeads }
    },
    onError: (_err, _vars, context) => {
      // Reverte em caso de erro
      if (context?.previousLeads) {
        queryClient.setQueryData(queryKeys.leads, context.previousLeads)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads })
    },
  })
}

export function useCreateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (leadData: Partial<Lead>) => {
      const response = await fetch("/api/comercial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadData),
      })
      if (!response.ok) throw new Error("Erro ao criar lead")
      return response.json() as Promise<Lead>
    },
    onSuccess: (newLead) => {
      queryClient.setQueryData<Lead[]>(queryKeys.leads, (old) =>
        old ? [newLead, ...old] : [newLead]
      )
    },
  })
}
