import { prisma } from "./prisma"

interface RentalPeriod {
  id: string
  days: number
  price: number
  label: string | null
}

interface PriceCalculationResult {
  unitPrice: number
  totalPrice: number
  appliedPeriod: RentalPeriod | null
  periodLabel: string
  pricePerDay: number
}

/**
 * Calcula o preço de locação baseado nos períodos configurados do equipamento
 *
 * Estratégia:
 * 1. Se tiver períodos configurados, usa a combinação que resulta no menor preço
 * 2. Se não tiver períodos, usa o pricePerDay como fallback
 *
 * @param equipmentId ID do equipamento
 * @param days Quantidade de dias da locação
 * @param quantity Quantidade de unidades
 * @returns Resultado do cálculo de preço
 */
export async function calculateRentalPrice(
  equipmentId: string,
  days: number,
  quantity: number = 1
): Promise<PriceCalculationResult> {
  // Buscar equipamento com períodos
  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    include: {
      rentalPeriods: {
        orderBy: { days: "desc" }, // Ordenar do maior para o menor
      },
    },
  })

  if (!equipment) {
    throw new Error("Equipamento não encontrado")
  }

  // Se não tiver períodos configurados, usar pricePerDay
  if (!equipment.rentalPeriods.length) {
    const unitPrice = equipment.pricePerDay
    const totalPrice = unitPrice * days * quantity
    return {
      unitPrice,
      totalPrice,
      appliedPeriod: null,
      periodLabel: "Diária",
      pricePerDay: equipment.pricePerDay,
    }
  }

  // Encontrar a melhor combinação de períodos
  const result = findBestPriceCombo(equipment.rentalPeriods, days)

  return {
    unitPrice: result.pricePerDay,
    totalPrice: result.totalPrice * quantity,
    appliedPeriod: result.mainPeriod,
    periodLabel: result.periodLabel,
    pricePerDay: result.pricePerDay,
  }
}

interface PriceComboResult {
  totalPrice: number
  mainPeriod: RentalPeriod | null
  periodLabel: string
  pricePerDay: number
}

/**
 * Encontra a melhor combinação de períodos para minimizar o preço
 *
 * Exemplo: 10 dias de locação
 * - Se tiver período de 7 dias por R$ 500 e 1 dia por R$ 100
 * - Opção 1: 1x 7 dias + 3x 1 dia = R$ 500 + R$ 300 = R$ 800
 * - Opção 2: 10x 1 dia = R$ 1000
 * - Melhor opção: R$ 800
 */
function findBestPriceCombo(
  periods: RentalPeriod[],
  totalDays: number
): PriceComboResult {
  // Ordenar períodos do maior para o menor
  const sortedPeriods = [...periods].sort((a, b) => b.days - a.days)

  // Estratégia greedy: usar o maior período possível primeiro
  let remainingDays = totalDays
  let totalPrice = 0
  let mainPeriod: RentalPeriod | null = null
  const usedPeriods: { period: RentalPeriod; count: number }[] = []

  for (const period of sortedPeriods) {
    if (remainingDays >= period.days) {
      const count = Math.floor(remainingDays / period.days)
      usedPeriods.push({ period, count })
      totalPrice += period.price * count
      remainingDays -= period.days * count

      if (!mainPeriod) {
        mainPeriod = period
      }
    }
  }

  // Se ainda sobraram dias e existe um período de 1 dia
  if (remainingDays > 0) {
    const dailyPeriod = sortedPeriods.find(p => p.days === 1)
    if (dailyPeriod) {
      usedPeriods.push({ period: dailyPeriod, count: remainingDays })
      totalPrice += dailyPeriod.price * remainingDays
    } else {
      // Se não tiver período de 1 dia, usar o menor período disponível
      const smallestPeriod = sortedPeriods[sortedPeriods.length - 1]
      // Cobrar proporcionalmente ou o período completo (o que for mais justo para o cliente)
      const proportionalPrice = (smallestPeriod.price / smallestPeriod.days) * remainingDays
      totalPrice += proportionalPrice
    }
  }

  // Comparar com estratégia alternativa: usar apenas o menor período
  const smallestPeriod = sortedPeriods[sortedPeriods.length - 1]
  const alternativePrice = (smallestPeriod.price / smallestPeriod.days) * totalDays

  // Usar a estratégia que resultar no menor preço para o cliente
  if (alternativePrice < totalPrice) {
    return {
      totalPrice: alternativePrice,
      mainPeriod: smallestPeriod,
      periodLabel: smallestPeriod.label || `${smallestPeriod.days} dia(s)`,
      pricePerDay: smallestPeriod.price / smallestPeriod.days,
    }
  }

  const pricePerDay = totalPrice / totalDays

  // Gerar label descritivo
  let periodLabel = ""
  if (usedPeriods.length === 1) {
    const { period, count } = usedPeriods[0]
    periodLabel = count === 1
      ? (period.label || `${period.days} dia(s)`)
      : `${count}x ${period.label || `${period.days} dia(s)`}`
  } else {
    periodLabel = usedPeriods
      .map(({ period, count }) => `${count}x ${period.label || `${period.days}d`}`)
      .join(" + ")
  }

  return {
    totalPrice,
    mainPeriod,
    periodLabel,
    pricePerDay,
  }
}

/**
 * Calcula o preço para múltiplos equipamentos
 */
export async function calculateMultipleRentalPrices(
  items: { equipmentId: string; quantity: number }[],
  days: number
): Promise<{
  items: Array<{
    equipmentId: string
    quantity: number
    unitPrice: number
    totalPrice: number
    periodLabel: string
  }>
  grandTotal: number
}> {
  const calculatedItems = await Promise.all(
    items.map(async (item) => {
      const result = await calculateRentalPrice(item.equipmentId, days, item.quantity)
      return {
        equipmentId: item.equipmentId,
        quantity: item.quantity,
        unitPrice: result.pricePerDay,
        totalPrice: result.totalPrice,
        periodLabel: result.periodLabel,
      }
    })
  )

  const grandTotal = calculatedItems.reduce((sum, item) => sum + item.totalPrice, 0)

  return {
    items: calculatedItems,
    grandTotal,
  }
}
