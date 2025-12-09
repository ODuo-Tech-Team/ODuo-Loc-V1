import { config } from "dotenv"
import { resolve } from "path"

config({ path: resolve(process.cwd(), ".env.local"), override: true })

async function main() {
  const { PrismaClient } = await import("@prisma/client")
  const prisma = new PrismaClient()

  try {
    console.log("=== VERIFICANDO ESTADO DO BANCO ===\n")

    // Listar todos os tenants
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: { users: true, equipments: true, customers: true, bookings: true }
        }
      }
    })

    console.log("TENANTS:")
    for (const t of tenants) {
      console.log(`  - ${t.name} (slug: ${t.slug})`)
      console.log(`    ID: ${t.id}`)
      console.log(`    Ativo: ${t.active}`)
      console.log(`    Features: NFSe=${t.nfseEnabled}, Stock=${t.stockEnabled}, Financial=${t.financialEnabled}`)
      console.log(`    Contagem: ${t._count.users} users, ${t._count.equipments} equip, ${t._count.customers} clientes, ${t._count.bookings} reservas`)
      console.log("")
    }

    // Listar todos os usuários
    const users = await prisma.user.findMany({
      include: { tenant: true }
    })

    console.log("\nUSUÁRIOS:")
    for (const u of users) {
      console.log(`  - ${u.email}`)
      console.log(`    Nome: ${u.name}`)
      console.log(`    Role: ${u.role}`)
      console.log(`    Tenant: ${u.tenant.name} (${u.tenant.slug})`)
      console.log(`    Email Verificado: ${u.emailVerified}`)
      console.log("")
    }

  } catch (e) {
    console.error("Erro:", e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
