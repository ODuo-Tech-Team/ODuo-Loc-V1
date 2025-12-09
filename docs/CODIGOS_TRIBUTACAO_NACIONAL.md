# Códigos de Tributação Nacional - Sistema Nacional NFS-e

## 📋 Visão Geral

O Sistema Nacional NFS-e utiliza códigos de **6 dígitos** para identificar o tipo de serviço prestado. Estes códigos são diferentes dos códigos da LC 116/2003 (que usam formato como "17.05").

## ⚠️ Erro E0310

**Descrição**: "O código de tributação nacional informado não existe conforme a lista de serviços nacional do Sistema Nacional NFS-e."

**Causa**: O código enviado no campo `codigo_tributacao_nacional_iss` não é válido ou não está na lista oficial.

**Solução**: Usar um código válido de 6 dígitos da lista nacional.

## 🔧 Código para Locação de Bens Móveis

Segundo a **Nota Técnica NFS-e nº 005/2025** (19/11/2025):

### Código Correto
```
990401 - Locação de Bens Móveis
```

### Mapeamento de Códigos Antigos

| Código LC 116/2003 | Código Nacional NFS-e | Descrição |
|-------------------|----------------------|-----------|
| 17.05 | 990401 | Locação de bens móveis |
| 99.04.01 | 990401 | Locação de bens móveis |

## 📝 Como Configurar

### 1. No Banco de Dados

Execute o SQL:

```sql
UPDATE "TenantFiscalConfig"
SET "codigoServico" = '990401'
WHERE "tenantId" = 'SEU_TENANT_ID';
```

### 2. Via Interface Admin

1. Acesse **Configurações** → **Fiscal**
2. No campo **Código do Serviço**, insira: `990401`
3. Salve as alterações

## 🔍 Campos da NFS-e

### Campo Obrigatório (Sistema Nacional)
- **`codigo_tributacao_nacional_iss`**: Código de 6 dígitos (ex: `990401`)

### Campos Opcionais
- **`item_lista_servico`**: Código antigo LC 116/2003 (ex: `17.05`)
- **`codigo_tributario_municipio`**: Código específico do município

## 📚 Referências

- [Nota Técnica NFS-e nº 005/2025](https://www.gov.br/nfse)
- [Documentação Focus NFe - Emissão DPS XML](https://campos.focusnfe.com.br/nfse_nacional/EmissaoDPSXml.html)
- [Portal Nacional NFS-e](https://www.gov.br/nfse)

## ✅ Checklist de Validação

Antes de emitir uma NFS-e, verifique:

- [ ] Campo `codigo_tributacao_nacional_iss` está preenchido
- [ ] Código tem exatamente 6 dígitos
- [ ] Código é `990401` para locação de bens móveis
- [ ] Configuração fiscal está salva no banco de dados
- [ ] Ambiente (HOMOLOGACAO/PRODUCAO) está correto

## 🐛 Debug

Para verificar o payload enviado, procure nos logs:

```
[NFS-e] Payload construído: {...}
[NFS-e] Código de tributação nacional: 990401
```

Se o código não aparecer, verifique se `tenant.fiscalConfig?.codigoServico` está configurado.
