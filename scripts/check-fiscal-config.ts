/**
 * Script para verificar e atualizar a configuração fiscal
 * 
 * Uso:
 * npx tsx scripts/check-fiscal-config.ts
 */

import { prisma } from '../src/lib/prisma'

async function main() {
    console.log('🔍 Verificando configuração fiscal...\n')

    // 1. Listar todos os tenants com NFS-e habilitada
    const tenants = await prisma.tenant.findMany({
        where: { nfseEnabled: true },
        include: { fiscalConfig: true },
    })

    if (tenants.length === 0) {
        console.log('⚠️  Nenhum tenant com NFS-e habilitada encontrado.')
        return
    }

    console.log(`📊 Encontrados ${tenants.length} tenant(s) com NFS-e habilitada:\n`)

    for (const tenant of tenants) {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
        console.log(`🏢 Tenant: ${tenant.name} (${tenant.slug})`)
        console.log(`   ID: ${tenant.id}`)
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

        // Dados fiscais básicos
        console.log('\n📋 Dados Fiscais Básicos:')
        console.log(`   CNPJ: ${tenant.cnpj || '❌ NÃO CONFIGURADO'}`)
        console.log(`   Inscrição Municipal: ${tenant.inscricaoMunicipal || '❌ NÃO CONFIGURADO'}`)
        console.log(`   Código Município: ${tenant.codigoMunicipio || '❌ NÃO CONFIGURADO'}`)
        console.log(`   Regime Tributário: ${tenant.regimeTributario || '❌ NÃO CONFIGURADO'}`)

        // Configuração fiscal
        if (!tenant.fiscalConfig) {
            console.log('\n❌ PROBLEMA: Configuração fiscal não encontrada!')
            console.log('   Execute: npx prisma studio')
            console.log('   E crie uma configuração fiscal para este tenant.')
            continue
        }

        console.log('\n⚙️  Configuração NFS-e:')
        console.log(`   Ambiente: ${tenant.fiscalConfig.focusNfeEnvironment}`)
        console.log(`   Token Focus NFe: ${tenant.fiscalConfig.focusNfeToken ? '✅ Configurado' : '❌ NÃO CONFIGURADO'}`)
        console.log(`   Série NFS-e: ${tenant.fiscalConfig.nfseSerie}`)
        console.log(`   Próximo Número: ${tenant.fiscalConfig.nfseProximoNumero}`)

        // Código do serviço - PONTO CRÍTICO
        console.log('\n🎯 Código de Tributação Nacional:')
        const codigoServico = tenant.fiscalConfig.codigoServico

        if (!codigoServico) {
            console.log('   ❌ ERRO: Código do serviço NÃO CONFIGURADO!')
            console.log('   Este é o problema que causa o erro E0310!')
            console.log('\n   💡 Solução:')
            console.log(`   UPDATE "TenantFiscalConfig"`)
            console.log(`   SET "codigoServico" = '990401'`)
            console.log(`   WHERE "tenantId" = '${tenant.id}';`)
        } else {
            console.log(`   Código atual: ${codigoServico}`)

            // Validar código
            const codigoLimpo = codigoServico.replace(/\D/g, '')

            if (codigoServico === '990401') {
                console.log('   ✅ CORRETO: Código válido para locação de bens móveis')
            } else if (codigoServico === '17.05' || codigoServico === '1705') {
                console.log('   ⚠️  ATENÇÃO: Código no formato antigo (LC 116/2003)')
                console.log('   Será automaticamente convertido para: 990401')
            } else if (codigoLimpo.length !== 6) {
                console.log('   ❌ ERRO: Código deve ter 6 dígitos!')
                console.log(`   Código atual tem ${codigoLimpo.length} dígitos`)
            } else {
                console.log('   ⚠️  Código não reconhecido. Verifique se é válido.')
            }
        }

        // Outras configurações
        console.log('\n💰 Configurações de ISS:')
        console.log(`   Alíquota ISS: ${tenant.fiscalConfig.aliquotaIss}%`)
        console.log(`   ISS Retido: ${tenant.fiscalConfig.issRetido ? 'Sim' : 'Não'}`)

        // Template de descrição
        console.log('\n📝 Template de Descrição:')
        if (tenant.fiscalConfig.descricaoTemplate) {
            console.log(`   ✅ Configurado (${tenant.fiscalConfig.descricaoTemplate.length} caracteres)`)
        } else {
            console.log('   ⚠️  Usando template padrão')
        }
    }

    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Verificação concluída!')
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
