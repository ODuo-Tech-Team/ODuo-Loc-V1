/**
 * Script de migração de dados para o sistema de gestão de estoque
 *
 * Este script:
 * 1. Atualiza os campos de estoque dos equipamentos existentes
 * 2. Cria BookingItems para as reservas existentes que usam equipmentId
 * 3. Cria movimentações iniciais de estoque (PURCHASE) para cada equipamento
 *
 * Executar com: npx tsx scripts/migrate-stock-data.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🚀 Iniciando migração de dados de estoque...")

  // 1. Buscar todos os equipamentos
  const equipments = await prisma.equipment.findMany({
    include: {
      bookings: {
        where: {
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      },
    },
  })

  console.log(`📦 Encontrados ${equipments.length} equipamentos`)

  for (const equipment of equipments) {
    // Calcular estoque reservado baseado em reservas ativas
    const reservedStock = equipment.bookings.length

    // Atualizar campos de estoque
    await prisma.equipment.update({
      where: { id: equipment.id },
      data: {
        totalStock: equipment.quantity,
        availableStock: Math.max(0, equipment.quantity - reservedStock),
        reservedStock: reservedStock,
        maintenanceStock: 0,
        damagedStock: 0,
        minStockLevel: 1,
      },
    })

    console.log(
      `  ✅ ${equipment.name}: total=${equipment.quantity}, disponível=${equipment.quantity - reservedStock}, reservado=${reservedStock}`
    )
  }

  // 2. Criar BookingItems para reservas existentes
  const bookingsWithEquipment = await prisma.booking.findMany({
    where: {
      equipmentId: { not: null },
    },
    include: {
      equipment: true,
      items: true,
    },
  })

  console.log(`\n📋 Encontradas ${bookingsWithEquipment.length} reservas com equipamento`)

  let bookingItemsCreated = 0
  for (const booking of bookingsWithEquipment) {
    // Só criar se não existe BookingItem para este booking
    if (booking.items.length === 0 && booking.equipment) {
      // Calcular dias
      const startDate = new Date(booking.startDate)
      const endDate = new Date(booking.endDate)
      const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))

      await prisma.bookingItem.create({
        data: {
          bookingId: booking.id,
          equipmentId: booking.equipment.id,
          quantity: 1,
          unitPrice: booking.equipment.pricePerDay,
          totalPrice: booking.totalPrice,
          deliveredQty: booking.status === "COMPLETED" ? 1 : 0,
          returnedQty: booking.status === "COMPLETED" ? 1 : 0,
          damagedQty: 0,
        },
      })
      bookingItemsCreated++
    }
  }

  console.log(`  ✅ Criados ${bookingItemsCreated} BookingItems`)

  // 3. Criar movimentações iniciais de estoque (opcional - apenas para novos equipamentos)
  // Isso é feito apenas se não houver movimentações existentes
  const equipmentsWithoutMovements = await prisma.equipment.findMany({
    where: {
      stockMovements: { none: {} },
    },
    include: {
      tenant: {
        include: {
          users: {
            where: { role: "ADMIN" },
            take: 1,
          },
        },
      },
    },
  })

  console.log(`\n📊 Criando movimentações iniciais para ${equipmentsWithoutMovements.length} equipamentos`)

  for (const equipment of equipmentsWithoutMovements) {
    const adminUser = equipment.tenant.users[0]
    if (!adminUser) {
      console.log(`  ⚠️ ${equipment.name}: sem usuário admin, pulando movimentação`)
      continue
    }

    await prisma.stockMovement.create({
      data: {
        type: "PURCHASE",
        quantity: equipment.totalStock,
        previousStock: 0,
        newStock: equipment.totalStock,
        reason: "Estoque inicial - Migração",
        equipmentId: equipment.id,
        userId: adminUser.id,
        tenantId: equipment.tenantId,
      },
    })

    console.log(`  ✅ ${equipment.name}: movimentação inicial criada`)
  }

  console.log("\n✨ Migração concluída com sucesso!")
}

main()
  .catch((e) => {
    console.error("❌ Erro na migração:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
