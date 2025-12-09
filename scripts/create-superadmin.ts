import { config } from "dotenv"
import { resolve } from "path"

// Carregar variáveis de ambiente do .env ANTES de importar Prisma
// Usar override: true para sobrescrever qualquer valor existente do .env.local
const envPath = resolve(process.cwd(), ".env")
console.log("Carregando .env de:", envPath)
const envResult = config({ path: envPath, override: true })
console.log("Dotenv resultado:", envResult.error ? envResult.error.message : "OK")
console.log("DATABASE_URL:", process.env.DATABASE_URL?.substring(0, 60) + "...")

async function main() {
  // Dynamic import para garantir que DATABASE_URL está setado antes
  const { PrismaClient } = await import("@prisma/client")
  const bcrypt = await import("bcryptjs")

  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  })

  try {
    const email = "superadmin@oduoloc.co.br"
    const password = 'i<J3/?"gM1e>46Sno@9PG$0!.7Fv/F8dn\\!S&vQ!zL$7\\Tw_}:'

    // Gerar hash da senha
    const passwordHash = await bcrypt.default.hash(password, 12)

    console.log("Criando superadmin...")
    console.log("Email:", email)

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
    }

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log("Usuário já existe! Atualizando senha...")
      await prisma.user.update({
        where: { email },
        data: {
          passwordHash,
          role: "SUPER_ADMIN",
          emailVerified: true,
          emailVerifiedAt: new Date(),
        }
      })
      console.log("Senha atualizada com sucesso!")
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

    console.log("\n✅ Superadmin criado/atualizado com sucesso!")
    console.log("Email:", email)
    console.log("Role: SUPER_ADMIN")
  } catch (e) {
    console.error("Erro:", e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
