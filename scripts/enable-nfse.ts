// Script para habilitar NFS-e para um tenant
// Execute com: npx tsx scripts/enable-nfse.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function enableNfse() {
  // Buscar todos os tenants
  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      nfseEnabled: true,
    },
  })

  console.log('\n=== Tenants disponíveis ===\n')
  tenants.forEach((t, i) => {
    console.log(`${i + 1}. ${t.name} (${t.slug}) - NFS-e: ${t.nfseEnabled ? 'Habilitado' : 'Desabilitado'}`)
  })

  // Habilitar para todos que não são "oduo-system"
  const tenantsToEnable = tenants.filter(t => t.slug !== 'oduo-system' && !t.nfseEnabled)

  if (tenantsToEnable.length === 0) {
    console.log('\n✓ Todos os tenants já estão com NFS-e habilitado ou não há tenants para habilitar.\n')
  } else {
    console.log(`\n→ Habilitando NFS-e para ${tenantsToEnable.length} tenant(s)...\n`)

    for (const tenant of tenantsToEnable) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { nfseEnabled: true },
      })
      console.log(`  ✓ ${tenant.name} - NFS-e habilitado`)
    }
  }

  // Mostrar status final
  const updatedTenants = await prisma.tenant.findMany({
    select: {
      name: true,
      slug: true,
      nfseEnabled: true,
    },
  })

  console.log('\n=== Status final ===\n')
  updatedTenants.forEach(t => {
    const status = t.nfseEnabled ? '✓ Habilitado' : '✗ Desabilitado'
    console.log(`  ${t.name}: ${status}`)
  })

  console.log('\n')
}

enableNfse()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
