import { config } from "dotenv"
import { resolve } from "path"

config({ path: resolve(process.cwd(), ".env.local"), override: true })

async function main() {
  const { PrismaClient } = await import("@prisma/client")
  const prisma = new PrismaClient()

  try {
    // Corrigir usuário fernando.melo
    const user = await prisma.user.update({
      where: { email: "fernando.melo@oduo.com.br" },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        role: "ADMIN",
      }
    })
    console.log("✅ Usuário fernando.melo atualizado:", user.email, "Role:", user.role, "Verified:", user.emailVerified)

    // Garantir que o tenant FKM tem todas as features ativas
    const tenant = await prisma.tenant.update({
      where: { slug: "fkm-locacoes" },
      data: {
        active: true,
        nfseEnabled: true,
        stockEnabled: true,
        financialEnabled: true,
        reportsEnabled: true,
        apiEnabled: true,
        webhooksEnabled: true,
        multiUserEnabled: true,
        customDomainsEnabled: true,
      }
    })
    console.log("✅ Tenant FKM atualizado com todas as features ativas")

    console.log("\n=== ESTADO ATUALIZADO ===")
    console.log("Usuário:", user.email)
    console.log("Role:", user.role)
    console.log("Email Verificado:", user.emailVerified)
    console.log("Tenant:", tenant.name)
    console.log("Tenant Ativo:", tenant.active)
    console.log("Features: NFSe, Stock, Financial, Reports, API, Webhooks, MultiUser, CustomDomains = TODAS ATIVAS")

  } catch (e) {
    console.error("Erro:", e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
