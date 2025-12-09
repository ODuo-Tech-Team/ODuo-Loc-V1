/**
 * Script para atualizar ambiente Focus NFe (HOMOLOGACAO <-> PRODUCAO)
 *
 * Uso:
 * npx tsx scripts/update-ambiente-focus.ts [HOMOLOGACAO|PRODUCAO]
 *
 * Exemplos:
 * npx tsx scripts/update-ambiente-focus.ts PRODUCAO
 * npx tsx scripts/update-ambiente-focus.ts HOMOLOGACAO
 */

import { prisma } from '../src/lib/prisma'

async function main() {
    const novoAmbiente = process.argv[2]?.toUpperCase()

    if (!novoAmbiente || !['HOMOLOGACAO', 'PRODUCAO'].includes(novoAmbiente)) {
        console.log('❌ Erro: Ambiente inválido!')
        console.log('\n📖 Uso:')
        console.log('   npx tsx scripts/update-ambiente-focus.ts [HOMOLOGACAO|PRODUCAO]')
        console.log('\n📋 Exemplos:')
        console.log('   npx tsx scripts/update-ambiente-focus.ts PRODUCAO')
        console.log('   npx tsx scripts/update-ambiente-focus.ts HOMOLOGACAO')
        process.exit(1)
    }

    console.log(`\n🔄 Atualizando ambiente Focus NFe para: ${novoAmbiente}\n`)

    // 1. Verificar estado atual
    const configs = await prisma.tenantFiscalConfig.findMany({
        include: {
            tenant: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    nfseEnabled: true,
                }
            }
        }
    })

    if (configs.length === 0) {
        console.log('⚠️  Nenhuma configuração fiscal encontrada.')
        return
    }

    console.log(`📊 Encontradas ${configs.length} configuração(ões) fiscal(is):\n`)

    for (const config of configs) {
        console.log(`🏢 ${config.tenant.name} (${config.tenant.slug})`)
        console.log(`   Ambiente atual: ${config.focusNfeEnvironment}`)
        console.log(`   NFS-e habilitada: ${config.tenant.nfseEnabled ? 'Sim' : 'Não'}`)
        console.log(`   Token configurado: ${config.focusNfeToken ? 'Sim' : 'Não'}`)

        if (config.focusNfeEnvironment === novoAmbiente) {
            console.log(`   ✅ Já está em ${novoAmbiente}`)
        } else {
            console.log(`   🔄 Será atualizado para ${novoAmbiente}`)
        }
        console.log('')
    }

    // 2. Confirmar alteração
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('⚠️  ATENÇÃO:')
    console.log(`   Todas as configurações serão alteradas para: ${novoAmbiente}`)

    if (novoAmbiente === 'PRODUCAO') {
        console.log('')
        console.log('🚨 IMPORTANTE - Ambiente de PRODUÇÃO:')
        console.log('   ✓ Certifique-se de que está usando token de PRODUÇÃO')
        console.log('   ✓ NFS-e emitidas serão VÁLIDAS e enviadas à prefeitura')
        console.log('   ✓ Não use este ambiente para testes!')
    } else {
        console.log('')
        console.log('🧪 Ambiente de HOMOLOGAÇÃO:')
        console.log('   ✓ Use token de HOMOLOGAÇÃO')
        console.log('   ✓ NFS-e emitidas são apenas para testes')
        console.log('   ✓ Não tem validade fiscal')
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Para segurança, vou fazer a atualização diretamente sem confirmação adicional
    // pois o usuário já especificou o ambiente como argumento

    const urls = {
        HOMOLOGACAO: 'https://homologacao.focusnfe.com.br/v2',
        PRODUCAO: 'https://api.focusnfe.com.br/v2',
    }

    console.log(`🔄 Atualizando configurações...`)
    console.log(`   URL que será usada: ${urls[novoAmbiente as 'HOMOLOGACAO' | 'PRODUCAO']}\n`)

    const result = await prisma.tenantFiscalConfig.updateMany({
        data: {
            focusNfeEnvironment: novoAmbiente,
        },
    })

    console.log(`✅ ${result.count} configuração(ões) atualizada(s) com sucesso!\n`)

    // 3. Verificar resultado
    console.log('📋 Estado final:')
    const verificacao = await prisma.tenantFiscalConfig.findMany({
        include: {
            tenant: {
                select: {
                    name: true,
                    slug: true,
                }
            }
        }
    })

    for (const config of verificacao) {
        const icon = config.focusNfeEnvironment === novoAmbiente ? '✅' : '❌'
        console.log(`${icon} ${config.tenant.name}: ${config.focusNfeEnvironment}`)
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Atualização concluída!')
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
