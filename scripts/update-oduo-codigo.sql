-- Script para atualizar código de serviço da ODuo Assessoria
-- Código correto: 170101 (Assessoria ou consultoria de qualquer natureza)

-- Verificar configuração atual
SELECT 
  t.id,
  t.name,
  t.cnpj,
  tfc."codigoServico" as codigo_atual,
  tfc."aliquotaIss",
  tfc."issRetido"
FROM "Tenant" t
LEFT JOIN "TenantFiscalConfig" tfc ON t.id = tfc."tenantId"
WHERE t.cnpj = '48501609000170';

-- Atualizar para o código correto
UPDATE "TenantFiscalConfig"
SET "codigoServico" = '170101'
WHERE "tenantId" IN (
  SELECT id FROM "Tenant" WHERE cnpj = '48501609000170'
);

-- Verificar se foi atualizado
SELECT 
  t.name,
  tfc."codigoServico" as codigo_novo,
  tfc."aliquotaIss",
  tfc."issRetido"
FROM "Tenant" t
LEFT JOIN "TenantFiscalConfig" tfc ON t.id = tfc."tenantId"
WHERE t.cnpj = '48501609000170';
