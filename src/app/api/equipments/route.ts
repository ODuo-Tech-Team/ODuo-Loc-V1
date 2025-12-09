import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkEquipmentLimit } from "@/lib/plan-limits"
import { revalidateEquipments } from "@/lib/cache/revalidate"

// GET - Listar equipamentos
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Buscar parâmetros de filtro
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const where: Record<string, unknown> = { tenantId: session.user.tenantId }
    if (status) {
      where.status = status
    }

    const equipments = await prisma.equipment.findMany({
      where,
      include: {
        rentalPeriods: {
          orderBy: { days: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Retornar array diretamente para compatibilidade
    return NextResponse.json(equipments, { status: 200 })
  } catch (error) {
    console.error("Erro ao buscar equipamentos:", error)
    return NextResponse.json(
      { error: "Erro ao buscar equipamentos" },
      { status: 500 }
    )
  }
}

// POST - Criar equipamento
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar limite de equipamentos do plano
    const limitCheck = await checkEquipmentLimit(session.user.tenantId)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: "PLAN_LIMIT_EXCEEDED",
          message: limitCheck.message,
          details: {
            limitType: "equipments",
            current: limitCheck.current,
            max: limitCheck.max,
            upgradeUrl: "/renovar"
          }
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, category, pricePerDay, pricePerHour, quantity, images, purchasePrice, purchaseDate, rentalPeriods, trackingType } = body

    // rentalPeriods é obrigatório e deve ter pelo menos um período
    // pricePerDay agora é calculado a partir do primeiro período (fallback para compatibilidade)
    if (!name || !category) {
      return NextResponse.json(
        { error: "Campos obrigatórios: name, category" },
        { status: 400 }
      )
    }

    if (!rentalPeriods || rentalPeriods.length === 0) {
      // Se não enviou rentalPeriods, exige pricePerDay (compatibilidade com API antiga)
      if (!pricePerDay) {
        return NextResponse.json(
          { error: "Adicione pelo menos um período de locação" },
          { status: 400 }
        )
      }
    }

    // Calcular pricePerDay a partir do primeiro período (menor quantidade de dias)
    // Isso mantém compatibilidade com o sistema existente
    const sortedPeriods = rentalPeriods?.length
      ? [...rentalPeriods].sort((a: { days: number }, b: { days: number }) => a.days - b.days)
      : null
    const calculatedPricePerDay = sortedPeriods
      ? sortedPeriods[0].price / sortedPeriods[0].days
      : parseFloat(pricePerDay)

    // Determinar quantidade inicial do estoque
    const initialQuantity = trackingType === "QUANTITY" ? (quantity || 1) : 0

    const equipment = await prisma.equipment.create({
      data: {
        name,
        description,
        category,
        pricePerDay: calculatedPricePerDay,
        pricePerHour: pricePerHour ? parseFloat(pricePerHour) : null,
        quantity: initialQuantity,
        images: images || [],
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        tenantId: session.user.tenantId,
        status: "AVAILABLE",
        // Tipo de rastreamento: SERIALIZED (por serial) ou QUANTITY (por quantidade)
        trackingType: trackingType || "SERIALIZED",
        // Campos de estoque - para QUANTITY, usar a quantidade informada
        totalStock: initialQuantity,
        availableStock: initialQuantity,
        reservedStock: 0,
        maintenanceStock: 0,
        damagedStock: 0,
        // Criar períodos de locação se fornecidos
        rentalPeriods: rentalPeriods?.length ? {
          create: rentalPeriods.map((period: { days: number; price: number; label?: string }) => ({
            days: period.days,
            price: period.price,
            label: period.label || null,
          })),
        } : undefined,
      },
      include: {
        rentalPeriods: {
          orderBy: { days: "asc" },
        },
      },
    })

    // Invalidar cache
    revalidateEquipments(session.user.tenantId)

    return NextResponse.json(equipment, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar equipamento:", error)
    return NextResponse.json(
      { error: "Erro ao criar equipamento" },
      { status: 500 }
    )
  }
}
