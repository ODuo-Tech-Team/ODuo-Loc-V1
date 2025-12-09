import { config } from "dotenv"
import { resolve } from "path"

// Carregar .env.local para usar banco local
const envLocalPath = resolve(process.cwd(), ".env.local")
config({ path: envLocalPath, override: true })
console.log("DATABASE_URL:", process.env.DATABASE_URL?.substring(0, 60) + "...")

async function main() {
  const { PrismaClient } = await import("@prisma/client")
  const bcrypt = await import("bcryptjs")

  const prisma = new PrismaClient()

  try {
    const email = "superadmin@oduoloc.co.br"
    // Senha mais simples para teste local
    const password = "Admin@123"

    const passwordHash = await bcrypt.default.hash(password, 12)

    console.log("Criando superadmin no banco LOCAL...")
    console.log("Email:", email)
    console.log("Senha:", password)

    // Verificar se já existe um tenant ODuo
    let tenant = await prisma.tenant.findFirst({
      where: { slug: "oduo" }
    })

    if (!tenant) {
      console.log("Criando tenant ODuo...")
      tenant = await prisma.tenant.create({
        data: {
          slug: "oduo",
          name: "ODuo",
          email: email,
          phone: "",
          primaryColor: "#000000",
        }
      })
      console.log("Tenant criado:", tenant.id)
    } else {
      console.log("Tenant já existe:", tenant.id)
    }

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log("Usuário já existe! Atualizando...")
      await prisma.user.update({
        where: { email },
        data: {
          passwordHash,
          role: "SUPER_ADMIN",
          emailVerified: true,
          emailVerifiedAt: new Date(),
        }
      })
      console.log("Usuário atualizado!")
    } else {
      console.log("Criando novo usuário...")
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: "Super Admin",
          role: "SUPER_ADMIN",
          emailVerified: true,
          emailVerifiedAt: new Date(),
          tenantId: tenant.id,
        }
      })
      console.log("Usuário criado:", user.id)
    }

    console.log("\n✅ Superadmin criado com sucesso!")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("Email: superadmin@oduoloc.co.br")
    console.log("Senha: Admin@123")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  } catch (e) {
    console.error("Erro:", e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
