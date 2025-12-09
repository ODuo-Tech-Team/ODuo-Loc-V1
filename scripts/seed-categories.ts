import { PrismaClient, TransactionType } from "@prisma/client"

const prisma = new PrismaClient()

// Categorias padrão para todos os tenants
const defaultCategories = {
  INCOME: [
    { name: "Aluguéis", color: "#10b981", icon: "home" },
    { name: "Serviços", color: "#3b82f6", icon: "wrench" },
    { name: "Vendas", color: "#8b5cf6", icon: "shopping-cart" },
    { name: "Outros Ganhos", color: "#6b7280", icon: "plus-circle" },
  ],
  EXPENSE: [
    { name: "Aluguel/Imóvel", color: "#ef4444", icon: "building" },
    { name: "Salários", color: "#f59e0b", icon: "users" },
    { name: "Utilidades", color: "#06b6d4", icon: "zap" },
    { name: "Marketing", color: "#ec4899", icon: "megaphone" },
    { name: "Manutenção", color: "#84cc16", icon: "tool" },
    { name: "Seguros", color: "#14b8a6", icon: "shield" },
    { name: "Combustível", color: "#f97316", icon: "fuel" },
    { name: "Impostos", color: "#dc2626", icon: "receipt" },
    { name: "Outras Despesas", color: "#6b7280", icon: "minus-circle" },
  ],
}

async function seedCategoriesForTenant(tenantId: string) {
  console.log(`\nSemeando categorias para tenant: ${tenantId}`)

  // Criar categorias de receita
  for (const category of defaultCategories.INCOME) {
    await prisma.transactionCategory.upsert({
      where: {
        tenantId_name_type: {
          tenantId,
          name: category.name,
          type: TransactionType.INCOME,
        },
      },
      update: {
        color: category.color,
        icon: category.icon,
      },
      create: {
        tenantId,
        name: category.name,
        type: TransactionType.INCOME,
        color: category.color,
        icon: category.icon,
        isDefault: true,
      },
    })
    console.log(`  ✅ Categoria INCOME: ${category.name}`)
  }

  // Criar categorias de despesa
  for (const category of defaultCategories.EXPENSE) {
    await prisma.transactionCategory.upsert({
      where: {
        tenantId_name_type: {
          tenantId,
          name: category.name,
          type: TransactionType.EXPENSE,
        },
      },
      update: {
        color: category.color,
        icon: category.icon,
      },
      create: {
        tenantId,
        name: category.name,
        type: TransactionType.EXPENSE,
        color: category.color,
        icon: category.icon,
        isDefault: true,
      },
    })
    console.log(`  ✅ Categoria EXPENSE: ${category.name}`)
  }
}

async function main() {
  console.log("🌱 Iniciando seed de categorias de transações...")

  // Buscar todos os tenants ativos
  const tenants = await prisma.tenant.findMany({
    where: { active: true },
    select: { id: true, name: true },
  })

  console.log(`Encontrados ${tenants.length} tenant(s) ativo(s)`)

  // Criar categorias para cada tenant
  for (const tenant of tenants) {
    await seedCategoriesForTenant(tenant.id)
  }

  console.log("\n✅ Seed de categorias concluído com sucesso!")
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

// Função exportada para criar categorias para um novo tenant
export async function createDefaultCategoriesForTenant(tenantId: string) {
  await seedCategoriesForTenant(tenantId)
}
