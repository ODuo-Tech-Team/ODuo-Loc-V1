import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// ============================================
// Types
// ============================================

export interface SuperAdminStats {
  overview: {
    totalTenants: number
    activeTenants: number
    inactiveTenants: number
    totalUsers: number
    totalEquipments: number
    totalCustomers: number
    totalBookings: number
    totalRevenue: number
  }
  bookingsByStatus: {
    pending: number
    confirmed: number
    completed: number
    cancelled: number
  }
  recentTenants: Array<{
    id: string
    name: string
    slug: string
    email: string
    active: boolean
    createdAt: string
    _count: {
      users: number
      equipments: number
      bookings: number
      customers: number
    }
  }>
  monthlyStats: Array<{
    month: string
    tenants: number
    bookings: number
    revenue: number
  }>
}

export interface Tenant {
  id: string
  name: string
  slug: string
  email: string
  phone: string
  active: boolean
  createdAt: string
  totalRevenue: number
  _count: {
    users: number
    equipments: number
    bookings: number
    customers: number
  }
}

export interface TenantsPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface TenantsResponse {
  tenants: Tenant[]
  pagination: TenantsPagination
}

// ============================================
// Query Keys
// ============================================

export const superAdminKeys = {
  stats: ["super-admin", "stats"] as const,
  tenants: (params?: { search?: string; status?: string; page?: number }) =>
    ["super-admin", "tenants", params] as const,
  tenant: (id: string) => ["super-admin", "tenants", id] as const,
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
// Stats Hooks
// ============================================

export function useSuperAdminStats() {
  return useQuery({
    queryKey: superAdminKeys.stats,
    queryFn: () => fetchJson<SuperAdminStats>("/api/super-admin/stats"),
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

// ============================================
// Tenants Hooks
// ============================================

interface UseTenantsOptions {
  search?: string
  status?: string
  page?: number
}

export function useTenants(options?: UseTenantsOptions) {
  const params = new URLSearchParams()
  if (options?.search) params.set("search", options.search)
  if (options?.status && options.status !== "all") params.set("status", options.status)
  if (options?.page) params.set("page", options.page.toString())
  params.set("limit", "10")

  return useQuery({
    queryKey: superAdminKeys.tenants(options),
    queryFn: () => fetchJson<TenantsResponse>(`/api/super-admin/tenants?${params}`),
    staleTime: 60 * 1000, // 1 minuto
  })
}

export function useToggleTenantStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tenantId, active }: { tenantId: string; active: boolean }) => {
      const response = await fetch(`/api/super-admin/tenants/${tenantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      })
      if (!response.ok) throw new Error("Erro ao atualizar")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "tenants"] })
      queryClient.invalidateQueries({ queryKey: superAdminKeys.stats })
    },
  })
}

export function useCreateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      name: string
      slug: string
      email: string
      phone: string
      address?: string
      adminName?: string
      adminEmail?: string
      adminPassword?: string
    }) => {
      const response = await fetch("/api/super-admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao criar tenant")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "tenants"] })
      queryClient.invalidateQueries({ queryKey: superAdminKeys.stats })
    },
  })
}

export function useDeleteTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tenantId: string) => {
      const response = await fetch(
        `/api/super-admin/tenants/${tenantId}?confirm=DELETE_TENANT`,
        { method: "DELETE" }
      )
      if (!response.ok) throw new Error("Erro ao deletar")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "tenants"] })
      queryClient.invalidateQueries({ queryKey: superAdminKeys.stats })
    },
  })
}
