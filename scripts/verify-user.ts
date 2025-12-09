import { config } from "dotenv"
import { resolve } from "path"

// Carregar variáveis de ambiente do .env
const envPath = resolve(process.cwd(), ".env")
config({ path: envPath, override: true })

async function main() {
  const { PrismaClient } = await import("@prisma/client")
  const bcrypt = await import("bcryptjs")

  const prisma = new PrismaClient()

  try {
    const email = "superadmin@oduoloc.co.br"
    const password = 'i<J3/?"gM1e>46Sno@9PG$0!.7Fv/F8dn\\!S&vQ!zL$7\\Tw_}:'

    console.log("Buscando usuário:", email)
    console.log("Senha a testar:", password)

    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true }
    })

    if (!user) {
      console.log("❌ Usuário NÃO encontrado!")
      return
    }

    console.log("\n✅ Usuário encontrado:")
    console.log("  ID:", user.id)
    console.log("  Email:", user.email)
    console.log("  Nome:", user.name)
    console.log("  Role:", user.role)
    console.log("  Tenant:", user.tenant.name, "(slug:", user.tenant.slug + ")")
    console.log("  Tenant Ativo:", user.tenant.active)
    console.log("  Email Verificado:", user.emailVerified)
    console.log("  Hash:", user.passwordHash.substring(0, 20) + "...")

    // Testar senha
    const passwordMatch = await bcrypt.default.compare(password, user.passwordHash)
    console.log("\n🔐 Teste de senha:", passwordMatch ? "✅ CORRETA" : "❌ INCORRETA")

  } catch (e) {
    console.error("Erro:", e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
