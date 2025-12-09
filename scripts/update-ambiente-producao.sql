-- Script para atualizar ambiente Focus NFe para PRODUCAO
-- Use este script se você está usando token de PRODUCAO
--
-- IMPORTANTE:
-- - Ambiente PRODUCAO usa: https://api.focusnfe.com.br/v2
-- - Ambiente HOMOLOGACAO usa: https://homologacao.focusnfe.com.br/v2
-- - Certifique-se de que o token configurado é de PRODUCAO!

-- ============================================
-- 1. Verificar ambiente atual
-- ============================================
SELECT
  t.id as tenant_id,
  t.name as tenant_name,
  fc."focusNfeEnvironment" as ambiente_atual,
  CASE
    WHEN fc."focusNfeToken" IS NOT NULL THEN '✅ Configurado'
    ELSE '❌ Não configurado'
  END as status_token
FROM "Tenant" t
LEFT JOIN "TenantFiscalConfig" fc ON fc."tenantId" = t.id
WHERE fc.id IS NOT NULL;

-- ============================================
-- 2. ATUALIZAR PARA PRODUCAO
-- ============================================
-- ⚠️  ATENÇÃO: Descomente a linha abaixo para executar a atualização
-- Esta mudança afeta TODAS as configurações fiscais!

UPDATE "TenantFiscalConfig" SET "focusNfeEnvironment" = 'PRODUCAO';

-- ============================================
-- 3. Verificar após atualização
-- ============================================
SELECT
  t.id as tenant_id,
  t.name as tenant_name,
  fc."focusNfeEnvironment" as ambiente_atualizado,
  CASE
    WHEN fc."focusNfeEnvironment" = 'PRODUCAO' THEN '✅ PRODUCAO (https://api.focusnfe.com.br/v2)'
    WHEN fc."focusNfeEnvironment" = 'HOMOLOGACAO' THEN '🧪 HOMOLOGACAO (https://homologacao.focusnfe.com.br/v2)'
    ELSE '❓ Desconhecido'
  END as url_ambiente
FROM "Tenant" t
LEFT JOIN "TenantFiscalConfig" fc ON fc."tenantId" = t.id
WHERE fc.id IS NOT NULL;
