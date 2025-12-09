import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      stockEnabled: true,
      financialEnabled: true,
      nfseEnabled: true,
      reportsEnabled: true,
      apiEnabled: true,
    }
  })
  console.log('Tenants com módulos:')
  console.log(JSON.stringify(tenants, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
