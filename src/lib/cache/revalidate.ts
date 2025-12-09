"use server"

import { revalidateTag } from "next/cache"
import { CACHE_TAGS } from "./index"

// Profile de cache padrão para invalidação
const CACHE_PROFILE = "default"

/**
 * Invalida o cache do dashboard para um tenant
 */
export async function revalidateDashboard(tenantId: string) {
  revalidateTag(CACHE_TAGS.DASHBOARD, CACHE_PROFILE)
  revalidateTag(`tenant-${tenantId}`, CACHE_PROFILE)
}

/**
 * Invalida o cache de equipamentos para um tenant
 */
export async function revalidateEquipments(tenantId: string) {
  revalidateTag(CACHE_TAGS.EQUIPMENTS, CACHE_PROFILE)
  revalidateTag(CACHE_TAGS.STOCK_ALERTS, CACHE_PROFILE)
  revalidateTag(`tenant-${tenantId}`, CACHE_PROFILE)
}

/**
 * Invalida o cache de clientes para um tenant
 */
export async function revalidateCustomers(tenantId: string) {
  revalidateTag(CACHE_TAGS.CUSTOMERS, CACHE_PROFILE)
  revalidateTag(`tenant-${tenantId}`, CACHE_PROFILE)
}

/**
 * Invalida o cache de reservas para um tenant
 */
export async function revalidateBookings(tenantId: string) {
  revalidateTag(CACHE_TAGS.BOOKINGS, CACHE_PROFILE)
  revalidateTag(CACHE_TAGS.DASHBOARD, CACHE_PROFILE)
  revalidateTag(`tenant-${tenantId}`, CACHE_PROFILE)
}

/**
 * Invalida o cache de alertas de estoque para um tenant
 */
export async function revalidateStockAlerts(tenantId: string) {
  revalidateTag(CACHE_TAGS.STOCK_ALERTS, CACHE_PROFILE)
  revalidateTag(`tenant-${tenantId}`, CACHE_PROFILE)
}

/**
 * Invalida todo o cache de um tenant
 */
export async function revalidateTenantCache(tenantId: string) {
  revalidateTag(`tenant-${tenantId}`, CACHE_PROFILE)
}
