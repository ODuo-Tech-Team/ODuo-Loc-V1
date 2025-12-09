# 🔧 GUIA RÁPIDO: Atualizar Código de Serviço para 990401

## ⚠️ PROBLEMA IDENTIFICADO

Você está usando o código **`85.99-6-04`** que está sendo normalizado para **`859960`**.

Este código está **ERRADO** para locação de bens móveis!

### ❌ Código Atual (Errado)
```
85.99-6-04 → 859960
```

### ✅ Código Correto
```
990401 (Locação de Bens Móveis - Nota Técnica 005/2025)
```

---

## 📝 COMO CORRIGIR VIA PRISMA STUDIO

O Prisma Studio está abrindo. Quando abrir:

### Passo 1: Abrir a tabela
1. No menu lateral, clique em **`TenantFiscalConfig`**

### Passo 2: Localizar o registro
2. Você verá uma linha com os dados da configuração fiscal
3. Procure a coluna **`codigoServico`**
4. Valor atual deve ser: **`85.99-6-04`** ou similar

### Passo 3: Atualizar o código
5. Clique no campo **`codigoServico`**
6. **DELETE** o valor atual
7. Digite: **`990401`** (sem pontos, sem traços)
8. Pressione **Enter**

### Passo 4: Salvar
9. Clique no botão **"Save 1 change"** (verde, no topo)
10. Aguarde a confirmação ✅

---

## 🧪 TESTAR NOVAMENTE

Após salvar no Prisma Studio:

1. **Volte para sua aplicação**
2. **Tente emitir a NFSe novamente**
3. **Verifique os logs**

### ✅ Log Esperado (Correto)

```
[NFS-e] Código de tributação nacional: 990401
[NFS-e] Payload construído: {
  "servico": {
    "codigo_tributacao_nacional_iss": "990401",
    ...
  }
}
[Focus NFe] Response: {
  "status": "autorizado",
  ...
}
```

### ❌ Log Anterior (Errado)

```
[NFS-e] Código 85.99-6-04 normalizado para 859960
[Focus NFe] Response: {
  "status": 422,
  "mensagem": "Item Lista Serviço com valor inválido..."
}
```

---

## 📊 COMPARAÇÃO

| Item | Antes (❌ Errado) | Depois (✅ Correto) |
|------|------------------|---------------------|
| **Código no DB** | `85.99-6-04` | `990401` |
| **Código normalizado** | `859960` | `990401` |
| **Formato** | 6 dígitos (errado) | 6 dígitos (correto) |
| **Resultado** | Erro 422 | Autorizado ✅ |

---

## 🎯 RESUMO

1. ✅ Prisma Studio está abrindo
2. ⏳ Aguarde abrir no navegador (geralmente em `http://localhost:5555`)
3. 📝 Siga os passos acima
4. 💾 Salve a alteração
5. 🧪 Teste novamente a emissão da NFSe

---

## 🆘 SE TIVER DÚVIDAS

- O Prisma Studio abre automaticamente no navegador
- Se não abrir, acesse: **http://localhost:5555**
- Procure pela tabela **TenantFiscalConfig**
- Altere apenas o campo **codigoServico** para **990401**

---

**Após salvar, a próxima emissão de NFSe deve funcionar! 🚀**
