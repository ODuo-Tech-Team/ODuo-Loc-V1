-- Script para verificar e atualizar o código de serviço para locação de bens móveis
-- Execute este script no seu banco de dados PostgreSQL

-- 1. Verificar configuração fiscal atual
SELECT 
  t.id,
  t.name,
  t.slug,
  tfc.codigoServico,
  tfc.aliquotaIss,
  tfc.issRetido,
  tfc.focusNfeEnvironment
FROM "Tenant" t
LEFT JOIN "TenantFiscalConfig" tfc ON t.id = tfc."tenantId"
WHERE t."nfseEnabled" = true;

-- 2. Atualizar código de serviço para 990401 (Locação de Bens Móveis)
-- IMPORTANTE: Substitua 'SEU_TENANT_ID' pelo ID do seu tenant
UPDATE "TenantFiscalConfig"
SET "codigoServico" = '990401'
WHERE "tenantId" = 'SEU_TENANT_ID';

-- 3. Verificar se foi atualizado
SELECT 
  t.name,
  tfc.codigoServico,
  tfc.aliquotaIss,
  tfc.issRetido
FROM "Tenant" t
LEFT JOIN "TenantFiscalConfig" tfc ON t.id = tfc."tenantId"
WHERE t.id = 'SEU_TENANT_ID';
