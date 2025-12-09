/**
 * Script para atualizar o código de serviço para 990401 (Locação de Bens Móveis)
 * 
 * Uso:
 * npx tsx scripts/fix-codigo-servico.ts
 */

import { prisma } from '../src/lib/prisma'

async function main() {
    console.log('🔧 Atualizando código de serviço para 990401...\n')

    // Buscar todos os tenants com NFS-e habilitada
    const tenants = await prisma.tenant.findMany({
        where: { nfseEnabled: true },
        include: { fiscalConfig: true },
    })

    if (tenants.length === 0) {
        console.log('⚠️  Nenhum tenant com NFS-e habilitada encontrado.')
        return
    }

    for (const tenant of tenants) {
        console.log(`\n📋 Tenant: ${tenant.name} (${tenant.slug})`)

        if (!tenant.fiscalConfig) {
            console.log('   ⚠️  Sem configuração fiscal - pulando...')
            continue
        }

        const codigoAtual = tenant.fiscalConfig.codigoServico

        console.log(`   Código atual: ${codigoAtual || 'NÃO CONFIGURADO'}`)

        // Atualizar para 990401
        await prisma.tenantFiscalConfig.update({
            where: { id: tenant.fiscalConfig.id },
            data: { codigoServico: '990401' },
        })

        console.log('   ✅ Atualizado para: 990401 (Locação de Bens Móveis)')
    }

    console.log('\n\n✅ Atualização concluída!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main()
    .catch((e) => {
        console.error('❌ Erro ao executar script:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
