import { PrismaClient } from '@prisma/client'

// Usar URL de produção diretamente para evitar conflito com .env.local
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.PROD_DATABASE_URL || process.env.DATABASE_URL
    }
  }
})

async function main() {
  console.log('🌱 Criando planos de assinatura...')

  // Plano Starter
  await prisma.plan.upsert({
    where: { slug: 'starter' },
    update: {
      name: 'Starter',
      description: 'Ideal para quem está começando',
      monthlyPrice: 997,
      annualPrice: 9970,
      maxUsers: 2,
      maxEquipments: 50,
      maxBookingsPerMonth: 200,
      storageGb: 5,
      nfseEnabled: false,
      stockEnabled: true,
      financialEnabled: false,
      reportsEnabled: false,
      apiEnabled: false,
      webhooksEnabled: false,
      multiUserEnabled: true,
      customDomainsEnabled: false,
      whatsappEnabled: false,
      sortOrder: 1,
    },
    create: {
      name: 'Starter',
      slug: 'starter',
      description: 'Ideal para quem está começando',
      monthlyPrice: 997,
      annualPrice: 9970,
      maxUsers: 2,
      maxEquipments: 50,
      maxBookingsPerMonth: 200,
      storageGb: 5,
      nfseEnabled: false,
      stockEnabled: true,
      financialEnabled: false,
      reportsEnabled: false,
      apiEnabled: false,
      webhooksEnabled: false,
      multiUserEnabled: true,
      customDomainsEnabled: false,
      whatsappEnabled: false,
      sortOrder: 1,
    },
  })

  // Plano Professional
  await prisma.plan.upsert({
    where: { slug: 'professional' },
    update: {
      name: 'Professional',
      description: 'Para empresas em crescimento',
      monthlyPrice: 1497,
      annualPrice: 14970,
      maxUsers: 5,
      maxEquipments: 200,
      maxBookingsPerMonth: 1000,
      storageGb: 20,
      nfseEnabled: true,
      stockEnabled: true,
      financialEnabled: true,
      reportsEnabled: true,
      apiEnabled: true,
      webhooksEnabled: false,
      multiUserEnabled: true,
      customDomainsEnabled: false,
      whatsappEnabled: true,
      featured: true,
      sortOrder: 2,
    },
    create: {
      name: 'Professional',
      slug: 'professional',
      description: 'Para empresas em crescimento',
      monthlyPrice: 1497,
      annualPrice: 14970,
      maxUsers: 5,
      maxEquipments: 200,
      maxBookingsPerMonth: 1000,
      storageGb: 20,
      nfseEnabled: true,
      stockEnabled: true,
      financialEnabled: true,
      reportsEnabled: true,
      apiEnabled: true,
      webhooksEnabled: false,
      multiUserEnabled: true,
      customDomainsEnabled: false,
      whatsappEnabled: true,
      featured: true,
      sortOrder: 2,
    },
  })

  // Plano Enterprise
  await prisma.plan.upsert({
    where: { slug: 'enterprise' },
    update: {
      name: 'Enterprise',
      description: 'Solução completa para grandes operações',
      monthlyPrice: 2997,
      annualPrice: 29970,
      maxUsers: 10,
      maxEquipments: -1, // Ilimitado
      maxBookingsPerMonth: -1, // Ilimitado
      storageGb: 500,
      nfseEnabled: true,
      stockEnabled: true,
      financialEnabled: true,
      reportsEnabled: true,
      apiEnabled: true,
      webhooksEnabled: true,
      multiUserEnabled: true,
      customDomainsEnabled: true,
      whatsappEnabled: true,
      sortOrder: 3,
    },
    create: {
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'Solução completa para grandes operações',
      monthlyPrice: 2997,
      annualPrice: 29970,
      maxUsers: 10,
      maxEquipments: -1, // Ilimitado
      maxBookingsPerMonth: -1, // Ilimitado
      storageGb: 500,
      nfseEnabled: true,
      stockEnabled: true,
      financialEnabled: true,
      reportsEnabled: true,
      apiEnabled: true,
      webhooksEnabled: true,
      multiUserEnabled: true,
      customDomainsEnabled: true,
      whatsappEnabled: true,
      sortOrder: 3,
    },
  })

  console.log('✅ Planos criados com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
