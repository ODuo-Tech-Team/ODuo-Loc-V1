import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const email = "fernando.melo@oduo.com.br"
  const testPassword = "Fkmjkm02@@"

  console.log("=== Debug de Usuário ===\n")
  console.log(`Buscando usuário: ${email}`)

  // Query raw para evitar problemas com colunas novas
  const users = await prisma.$queryRaw<any[]>`
    SELECT u.id, u.email, u.name, u.role, u."passwordHash", u."tenantId",
           t.name as "tenantName", t.slug as "tenantSlug", t.active as "tenantActive"
    FROM "User" u
    JOIN "Tenant" t ON u."tenantId" = t.id
    WHERE u.email = ${email}
  `

  const user = users[0]

  if (!user) {
    console.log("\n❌ USUÁRIO NÃO ENCONTRADO!")
    console.log("\nListando todos os usuários do sistema:")
    const allUsers = await prisma.$queryRaw<any[]>`
      SELECT u.email, u.name, u.role, t.name as "tenantName", t.slug as "tenantSlug", t.active as "tenantActive"
      FROM "User" u
      JOIN "Tenant" t ON u."tenantId" = t.id
    `
    console.log(JSON.stringify(allUsers, null, 2))
    return
  }

  console.log("\n✅ Usuário encontrado:")
  console.log(`  - ID: ${user.id}`)
  console.log(`  - Nome: ${user.name}`)
  console.log(`  - Email: ${user.email}`)
  console.log(`  - Role: ${user.role}`)
  console.log(`  - Tenant: ${user.tenantName} (${user.tenantSlug})`)
  console.log(`  - Tenant Ativo: ${user.tenantActive}`)
  console.log(`  - Password Hash (primeiros 20 chars): ${user.passwordHash.substring(0, 20)}...`)

  console.log("\n=== Testando Senha ===")
  console.log(`Testando senha: ${testPassword}`)

  const passwordMatch = await bcrypt.compare(testPassword, user.passwordHash)

  if (passwordMatch) {
    console.log("\n✅ SENHA CORRETA!")
  } else {
    console.log("\n❌ SENHA INCORRETA!")

    // Vamos gerar um novo hash e comparar
    const newHash = await bcrypt.hash(testPassword, 10)
    console.log(`\nNovo hash gerado: ${newHash.substring(0, 30)}...`)
    console.log(`Hash atual: ${user.passwordHash.substring(0, 30)}...`)

    // Verificar se o hash está no formato correto
    if (!user.passwordHash.startsWith("$2")) {
      console.log("\n⚠️ ALERTA: O hash não parece ser um hash bcrypt válido!")
    }
  }

  // Verificar problemas potenciais
  console.log("\n=== Verificações Adicionais ===")

  if (!user.tenantActive) {
    console.log("⚠️ PROBLEMA: Tenant está INATIVO - login será bloqueado!")
  }

  if (user.role !== "SUPER_ADMIN" && !user.tenantActive) {
    console.log("⚠️ PROBLEMA: Usuário não é SUPER_ADMIN e tenant inativo!")
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
