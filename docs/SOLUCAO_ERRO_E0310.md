# 🔧 Solução para Erro E0310 - NFSe Rejeitada

## ❌ Problema Identificado

Você está recebendo o erro:
```json
{
  "Codigo": "E0310",
  "Descricao": "O código de tributação nacional informado não existe conforme a lista de serviços nacional do Sistema Nacional NFS-e."
}
```

## 🎯 Causa Raiz

O código estava enviando o campo **`item_lista_servico`** (formato antigo LC 116/2003), mas o Sistema Nacional NFS-e exige o campo **`codigo_tributacao_nacional_iss`** com um código de **6 dígitos**.

## ✅ Correções Aplicadas

### 1. **Atualização do Type Definition** (`types.ts`)

Adicionado o campo obrigatório:
```typescript
servico: {
  valor_servicos: number
  discriminacao: string
  codigo_tributacao_nacional_iss?: string // ✅ NOVO CAMPO
  item_lista_servico?: string
  // ... outros campos
}
```

### 2. **Atualização do Serviço** (`nfse-service.ts`)

Alterado de:
```typescript
payload.servico.item_lista_servico = this.normalizeServiceCode(...)
```

Para:
```typescript
payload.servico.codigo_tributacao_nacional_iss = this.normalizeServiceCode(...)
```

### 3. **Código Correto para Locação de Bens Móveis**

Segundo a **Nota Técnica NFS-e nº 005/2025**:
- **Código**: `990401`
- **Descrição**: Locação de Bens Móveis

## 📋 Próximos Passos

### Passo 1: Verificar Configuração no Banco de Dados

Execute o script de verificação:
```bash
npx tsx scripts/check-fiscal-config.ts
```

### Passo 2: Atualizar Código do Serviço

Se o código não estiver configurado ou estiver incorreto, execute:

```sql
-- Substitua 'SEU_TENANT_ID' pelo ID real do seu tenant
UPDATE "TenantFiscalConfig"
SET "codigoServico" = '990401'
WHERE "tenantId" = 'SEU_TENANT_ID';
```

Ou use o Prisma Studio:
```bash
npx prisma studio
```

### Passo 3: Testar Emissão

1. Tente emitir uma nova NFSe
2. Verifique os logs para confirmar que o código está sendo enviado:
   ```
   [NFS-e] Código de tributação nacional: 990401
   ```

## 🔍 Como Verificar se Está Funcionando

### Logs Esperados

Quando você emitir uma NFSe, deve ver nos logs:

```
[NFS-e] Dados da reserva: {...}
[NFS-e] Dados fiscais do tenant: {...}
[NFS-e] Código de tributação nacional: 990401
[NFS-e] Payload construído: {
  ...
  "servico": {
    "codigo_tributacao_nacional_iss": "990401",
    ...
  }
}
```

### Payload Correto

O JSON enviado para o Focus NFe deve conter:

```json
{
  "servico": {
    "codigo_tributacao_nacional_iss": "990401",
    "valor_servicos": 1000.00,
    "discriminacao": "Locação de equipamentos...",
    "aliquota": 5.0,
    "iss_retido": false
  }
}
```

## 🐛 Troubleshooting

### Se ainda receber erro E0310:

1. **Verifique se o código está salvo no banco**:
   ```sql
   SELECT "codigoServico" FROM "TenantFiscalConfig" WHERE "tenantId" = 'SEU_ID';
   ```

2. **Verifique os logs do servidor** para ver o payload completo

3. **Confirme que está usando a versão correta do código**:
   - ✅ Correto: `990401` (6 dígitos)
   - ❌ Errado: `17.05` (formato antigo)
   - ❌ Errado: `1705` (4 dígitos)

### Se o código não aparecer no payload:

Verifique se `tenant.fiscalConfig?.codigoServico` está preenchido:
```typescript
console.log('Código configurado:', tenant.fiscalConfig?.codigoServico)
```

## 📚 Referências

- [Nota Técnica NFS-e nº 005/2025](https://www.gov.br/nfse)
- [Documentação Focus NFe](https://campos.focusnfe.com.br/nfse_nacional/EmissaoDPSXml.html)
- [Códigos de Tributação Nacional](./CODIGOS_TRIBUTACAO_NACIONAL.md)

## ✅ Checklist Final

Antes de emitir uma NFSe, confirme:

- [ ] Código alterado em `types.ts` (campo `codigo_tributacao_nacional_iss`)
- [ ] Código alterado em `nfse-service.ts` (usando campo correto)
- [ ] Código `990401` salvo no banco de dados
- [ ] Script de verificação executado sem erros
- [ ] Logs mostram o código sendo enviado
- [ ] Ambiente correto (HOMOLOGACAO/PRODUCAO)

## 🎉 Resultado Esperado

Após aplicar todas as correções, a NFSe deve ser **autorizada** com sucesso e você receberá:

```json
{
  "status": "autorizado",
  "numero": "123456",
  "codigo_verificacao": "ABC123",
  "url_danfse": "https://..."
}
```

---

**Data da correção**: 2025-11-27
**Versão**: 1.0
