import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding production database...")

  // Criar Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: "oduo" },
    update: {},
    create: {
      slug: "oduo",
      name: "ODuo Assessoria",
      email: "contato@oduo.com.br",
      phone: "(11) 99999-9999",
      primaryColor: "#000000",
      active: true,
    },
  })

  console.log("✅ Tenant criado:", tenant.name)

  // Criar Super Admin
  const passwordHash = await bcrypt.hash("admin123", 10)

  const user = await prisma.user.upsert({
    where: { email: "admin@oduo.com.br" },
    update: {},
    create: {
      email: "admin@oduo.com.br",
      passwordHash,
      name: "Super Admin",
      role: "SUPER_ADMIN",
      tenantId: tenant.id,
    },
  })

  console.log("✅ Usuário criado:", user.email)
  console.log("\n🎉 Seed concluído com sucesso!")
  console.log("\n📋 Credenciais:")
  console.log("Email: admin@oduo.com.br")
  console.log("Senha: admin123")
  console.log("\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!")
}

main()
  .catch((e) => {
    console.error("❌ Erro ao fazer seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
