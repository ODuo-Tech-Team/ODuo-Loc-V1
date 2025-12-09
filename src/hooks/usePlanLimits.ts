"use client"

import { useState, useEffect, useCallback } from "react"

interface UsageItem {
  current: number
  max: number
  percentage: number
  isUnlimited: boolean
}

interface TenantUsage {
  users: UsageItem
  equipments: UsageItem
  bookingsThisMonth: UsageItem
  planName: string | null
  isOverAnyLimit: boolean
  isNearAnyLimit: boolean
}

export function usePlanLimits() {
  const [usage, setUsage] = useState<TenantUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsage = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/tenant/usage")

      if (!response.ok) {
        throw new Error("Erro ao carregar limites")
      }

      const data = await response.json()
      setUsage(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  const refetch = useCallback(() => {
    fetchUsage()
  }, [fetchUsage])

  return {
    usage,
    loading,
    error,
    refetch,
    // Helpers
    isAtUserLimit: usage ? (!usage.users.isUnlimited && usage.users.percentage >= 100) : false,
    isAtEquipmentLimit: usage ? (!usage.equipments.isUnlimited && usage.equipments.percentage >= 100) : false,
    isAtBookingLimit: usage ? (!usage.bookingsThisMonth.isUnlimited && usage.bookingsThisMonth.percentage >= 100) : false,
    isNearUserLimit: usage ? (!usage.users.isUnlimited && usage.users.percentage >= 80) : false,
    isNearEquipmentLimit: usage ? (!usage.equipments.isUnlimited && usage.equipments.percentage >= 80) : false,
    isNearBookingLimit: usage ? (!usage.bookingsThisMonth.isUnlimited && usage.bookingsThisMonth.percentage >= 80) : false,
  }
}
