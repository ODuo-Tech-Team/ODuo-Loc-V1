import { z } from "zod"

// Tipos de movimentação de estoque
export const MovementTypeEnum = z.enum([
  "PURCHASE",
  "RENTAL_OUT",
  "RENTAL_RETURN",
  "ADJUSTMENT",
  "DAMAGE",
  "LOSS",
  "MAINTENANCE_OUT",
  "MAINTENANCE_IN",
])

export type MovementType = z.infer<typeof MovementTypeEnum>

// Schema para criar movimentação de estoque
export const stockMovementSchema = z.object({
  type: MovementTypeEnum,
  quantity: z.number().int().positive("Quantidade deve ser maior que zero"),
  reason: z.string().optional(),
  bookingId: z.string().optional(),
})

export type StockMovementInput = z.infer<typeof stockMovementSchema>

// Schema para ajuste manual de estoque
export const stockAdjustmentSchema = z.object({
  newTotalStock: z.number().int().min(0, "Estoque não pode ser negativo"),
  reason: z.string().min(1, "Motivo do ajuste é obrigatório"),
})

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>

// Schema para verificar disponibilidade
export const availabilityCheckSchema = z.object({
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  quantity: z.number().int().positive().default(1),
  excludeBookingId: z.string().optional(), // Para edição de reservas
})

export type AvailabilityCheckInput = z.infer<typeof availabilityCheckSchema>

// Schema para item de reserva
export const bookingItemSchema = z.object({
  equipmentId: z.string().min(1, "Equipamento é obrigatório"),
  quantity: z.number().int().positive("Quantidade deve ser maior que zero"),
  unitPrice: z.number().positive("Preço unitário deve ser maior que zero").optional(),
  notes: z.string().optional(),
  // Para equipamentos serializados: IDs das unidades selecionadas
  selectedUnitIds: z.array(z.string()).optional(),
})

export type BookingItemInput = z.infer<typeof bookingItemSchema>

// Schema para devolução de item
export const returnItemSchema = z.object({
  bookingItemId: z.string().min(1, "Item é obrigatório"),
  returnedQty: z.number().int().min(0, "Quantidade devolvida não pode ser negativa"),
  damagedQty: z.number().int().min(0, "Quantidade avariada não pode ser negativa"),
  damageNotes: z.string().optional(),
  repairCost: z.number().min(0).optional(),
})

export type ReturnItemInput = z.infer<typeof returnItemSchema>

// Labels em português para tipos de movimentação
export const movementTypeLabels: Record<MovementType, string> = {
  PURCHASE: "Compra/Entrada",
  RENTAL_OUT: "Saída para Locação",
  RENTAL_RETURN: "Retorno de Locação",
  ADJUSTMENT: "Ajuste Manual",
  DAMAGE: "Avaria",
  LOSS: "Perda/Extravio",
  MAINTENANCE_OUT: "Enviado para Manutenção",
  MAINTENANCE_IN: "Retorno de Manutenção",
}

// Cores para badges de tipos de movimentação
export const movementTypeColors: Record<MovementType, string> = {
  PURCHASE: "bg-green-500",
  RENTAL_OUT: "bg-blue-500",
  RENTAL_RETURN: "bg-emerald-500",
  ADJUSTMENT: "bg-yellow-500",
  DAMAGE: "bg-red-500",
  LOSS: "bg-red-700",
  MAINTENANCE_OUT: "bg-orange-500",
  MAINTENANCE_IN: "bg-teal-500",
}
