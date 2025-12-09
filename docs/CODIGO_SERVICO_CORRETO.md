# 🎯 Identificar Código de Serviço Correto - ODuo Assessoria

## ⚠️ IMPORTANTE: Você NÃO é uma locadora!

Você mencionou que a **ODuo Assessoria** presta **serviços para locadoras**, não aluga equipamentos.

Portanto, o código **990401 (Locação de Bens Móveis) está ERRADO** para o seu caso!

---

## 🔍 Qual é o seu serviço?

Você presta serviços de:
- ✅ **Software como Serviço (SaaS)**
- ✅ **Assessoria/Consultoria**
- ✅ **Desenvolvimento de sistemas**
- ✅ **Hospedagem/Licenciamento de software**

---

## 📋 Códigos Corretos LC 116/2003

Dependendo do tipo de serviço que você presta, os códigos corretos são:

### 1. **Desenvolvimento de Sistemas / Software**
```
Código: 01.01
Formato 6 dígitos: 010101
Descrição: Análise e desenvolvimento de sistemas
```

### 2. **Licenciamento ou Cessão de Software**
```
Código: 01.05
Formato 6 dígitos: 010501
Descrição: Licenciamento ou cessão de direito de uso de programas de computação
```

### 3. **Assessoria e Consultoria**
```
Código: 17.01
Formato 6 dígitos: 170101
Descrição: Assessoria ou consultoria de qualquer natureza
```

### 4. **Planejamento, Organização e Administração**
```
Código: 17.02
Formato 6 dígitos: 170201
Descrição: Datilografia, digitação, estenografia, expediente, secretaria em geral, resposta audível, redação, edição, interpretação, revisão, tradução, apoio e infraestrutura administrativa e congêneres
```

### 5. **SaaS (Software como Serviço)**
```
Código: 01.07
Formato 6 dígitos: 010701
Descrição: Suporte técnico em informática, inclusive instalação, configuração e manutenção de programas de computação e bancos de dados
```

---

## 🎯 Recomendação

Para um **SaaS de gestão de locadoras**, o código mais apropriado seria:

### **01.05 → 010501**
**Licenciamento ou cessão de direito de uso de programas de computação**

Ou, se você também presta suporte:

### **01.07 → 010701**
**Suporte técnico em informática**

---

## 🔧 Como Atualizar

### Via Prisma Studio

1. Abra: `npx prisma studio`
2. Vá em **TenantFiscalConfig**
3. Altere **codigoServico** para: **`010501`** ou **`010701`**
4. Salve

### Via SQL

```sql
UPDATE "TenantFiscalConfig"
SET "codigoServico" = '010501'  -- ou '010701'
WHERE "tenantId" = 'SEU_TENANT_ID';
```

---

## ⚖️ Consulte seu Contador

**IMPORTANTE**: Consulte seu contador para confirmar qual código é o mais adequado para o seu caso específico, pois isso impacta:

- Alíquota de ISS
- Tributação municipal
- Enquadramento fiscal

---

## 📊 Comparação

| Código | Descrição | Quando Usar |
|--------|-----------|-------------|
| 010101 | Análise e desenvolvimento de sistemas | Se você desenvolve software customizado |
| 010501 | Licenciamento de software | Se você cobra mensalidade por uso do software (SaaS) |
| 010701 | Suporte técnico em informática | Se você presta suporte técnico |
| 170101 | Assessoria/consultoria | Se você presta consultoria |
| ~~990401~~ | ~~Locação de bens móveis~~ | ❌ **NÃO É SEU CASO** |

---

## 🚀 Próximos Passos

1. **Defina o código correto** (provavelmente 010501 ou 010701)
2. **Atualize no banco de dados**
3. **Teste a emissão da NFSe**
4. **Verifique com seu contador**

---

**Nota**: O endpoint `/nfsen` (NFSe Nacional) é usado apenas para códigos que começam com **99**. Para os códigos acima (01.xx, 17.xx), você usará o endpoint `/nfse` (NFSe Municipal), que o sistema já detecta automaticamente.
