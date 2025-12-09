# Plano de Melhorias do Dashboard

## Visão Geral
Este plano cobre 4 melhorias solicitadas para o dashboard do SaaS Oduo.

---

## 1. Adicionar Scroll no Sidebar do Dashboard

**Arquivo:** `src/components/admin/sidebar.tsx`

**Problema:** O sidebar atual usa `h-full flex flex-col` mas não tem scroll implementado. Se houver muitos itens de navegação, o conteúdo será cortado.

**Solução:**
- Adicionar `overflow-y-auto` na seção de navegação
- Manter o logo/header e footer (plano) fixos
- Adicionar estilização customizada para scrollbar (dark theme)

**Alterações:**
```tsx
// Seção de navegação (linha ~161)
<div className="px-3 py-2 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
```

**Estimativa:** Simples, ~5 linhas de código

---

## 2. Alterar Ícone de Notificações de Estoque

**Arquivo:** `src/components/stock/StockAlertBadge.tsx`

**Problema:** O componente usa `Bell` (sino) como ícone principal e `AlertTriangle` para cada alerta. Ícones mais relacionados a estoque seriam mais apropriados.

**Solução:**
- Trocar `Bell` por `Package` ou `Boxes` (ícone de caixas/pacotes)
- Trocar `AlertTriangle` por ícones específicos por tipo de alerta:
  - OUT_OF_STOCK: `PackageX` (pacote com X)
  - LOW_STOCK: `PackageMinus` (pacote com menos)
  - DAMAGED: `PackageOpen` (pacote aberto/danificado)
  - MAINTENANCE: `Wrench` (ferramenta)

**Alterações:**
- Linha 5: Atualizar imports
- Linha 81: Trocar `<Bell>` por `<Package>`
- Linha 147: Usar ícone dinâmico baseado no tipo de alerta

**Estimativa:** Simples, ~15 linhas de código

---

## 3. Sistema de Transações Financeiras com Recorrência

Esta é a funcionalidade mais complexa. Precisa de:

### 3.1 Modelo de Dados (Prisma Schema)

**Novos modelos necessários:**

```prisma
// Categorias customizáveis de transações
model TransactionCategory {
  id          String   @id @default(cuid())
  name        String
  type        TransactionType // INCOME ou EXPENSE
  color       String?  // Cor para UI
  icon        String?  // Nome do ícone Lucide
  isDefault   Boolean  @default(false) // Categorias padrão do sistema

  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  transactions FinancialTransaction[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([tenantId, name])
}

enum TransactionType {
  INCOME    // Receita/Ganho
  EXPENSE   // Despesa
}

// Transações financeiras (gerais ou vinculadas a equipamento)
model FinancialTransaction {
  id          String   @id @default(cuid())

  type        TransactionType
  description String
  amount      Float
  date        DateTime

  // Status da transação
  status      TransactionStatus @default(PENDING)
  paidAt      DateTime?

  // Categoria
  categoryId  String
  category    TransactionCategory @relation(fields: [categoryId], references: [id])

  // Opcional: vinculado a equipamento
  equipmentId String?
  equipment   Equipment? @relation(fields: [equipmentId], references: [id])

  // Recorrência
  isRecurring       Boolean  @default(false)
  recurrenceId      String?  // ID do template de recorrência
  recurrence        RecurringTransaction? @relation(fields: [recurrenceId], references: [id])

  // Tenant
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId, date])
  @@index([tenantId, status])
  @@index([tenantId, type])
}

enum TransactionStatus {
  PENDING     // Pendente
  PAID        // Pago/Recebido
  OVERDUE     // Vencido
  CANCELLED   // Cancelado
}

// Template de transações recorrentes
model RecurringTransaction {
  id          String   @id @default(cuid())

  type        TransactionType
  description String
  amount      Float

  // Categoria
  categoryId  String
  category    TransactionCategory @relation(fields: [categoryId], references: [id])

  // Opcional: vinculado a equipamento
  equipmentId String?
  equipment   Equipment? @relation(fields: [equipmentId], references: [id])

  // Configuração de recorrência
  intervalDays    Int      // Período em dias (7=semanal, 30=mensal, 365=anual)
  startDate       DateTime // Data de início
  endDate         DateTime? // Data de término (null = sem fim)
  nextDueDate     DateTime // Próxima data prevista

  // Status da recorrência
  status      RecurrenceStatus @default(ACTIVE)

  // Transações geradas a partir deste template
  transactions FinancialTransaction[]

  // Tenant
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId, status])
  @@index([tenantId, nextDueDate])
}

enum RecurrenceStatus {
  ACTIVE      // Ativa
  PAUSED      // Pausada temporariamente
  CANCELLED   // Cancelada
  COMPLETED   // Finalizada (chegou ao endDate)
}
```

### 3.2 API Routes

**Novas rotas necessárias:**

```
/api/financial/transactions
  GET    - Listar transações (com filtros: tipo, status, categoria, período)
  POST   - Criar nova transação (única ou recorrente)

/api/financial/transactions/[id]
  GET    - Detalhes de uma transação
  PATCH  - Atualizar transação
  DELETE - Excluir transação

/api/financial/transactions/[id]/pay
  POST   - Marcar como paga/recebida

/api/financial/recurring
  GET    - Listar recorrências ativas e próximas transações previstas
  POST   - Criar nova recorrência

/api/financial/recurring/[id]
  GET    - Detalhes da recorrência
  PATCH  - Atualizar recorrência (opção: só esta ou esta e futuras)
  DELETE - Cancelar recorrência

/api/financial/recurring/[id]/pause
  POST   - Pausar recorrência

/api/financial/recurring/[id]/resume
  POST   - Retomar recorrência

/api/financial/recurring/[id]/confirm
  POST   - Confirmar próxima transação prevista (cria a transação real)

/api/financial/categories
  GET    - Listar categorias
  POST   - Criar categoria

/api/financial/categories/[id]
  PATCH  - Atualizar categoria
  DELETE - Excluir categoria (se não tiver transações)
```

### 3.3 UI Components

**Novos componentes:**

1. **TransactionDialog** - Modal para criar/editar transação
   - Campos: tipo (receita/despesa), descrição, valor, data, categoria, equipamento (opcional)
   - Toggle: "Transação recorrente"
   - Se recorrente: campo de intervalo em dias + data fim (opcional)

2. **RecurringTransactionCard** - Card mostrando recorrência e próximas datas
   - Nome, valor, próxima data
   - Botões: Confirmar próxima, Pausar, Editar, Cancelar

3. **CategoryManager** - Gerenciador de categorias
   - Lista de categorias com cores/ícones
   - Criar/editar/excluir categorias

4. **TransactionFilters** - Filtros para listagem
   - Por tipo, categoria, status, período

**Alterações na página financeiro:**

- Adicionar botão "Nova Transação" funcional (já existe mas não funciona)
- Nova aba "Recorrências" mostrando transações recorrentes ativas
- Integrar com novo sistema de categorias

### 3.4 Seed de Categorias Padrão

Criar categorias iniciais:
- **Receitas:** Aluguéis, Serviços, Vendas, Outros
- **Despesas:** Aluguel/Imóvel, Salários, Utilidades, Marketing, Manutenção, Seguros, Combustível, Outros

---

## 4. Feedback Visual no Calendário (Drag-to-Create)

**Arquivo:** `src/app/(admin)/calendario/page.tsx`

**Problema:** O calendário permite arrastar para criar reservas mas falta feedback visual durante o arrasto.

**Solução:**
Adicionar CSS customizado para o FullCalendar:

```css
/* Highlight durante seleção/arrasto */
.fc .fc-highlight {
  background: rgba(59, 130, 246, 0.3) !important;
  border: 2px dashed #3b82f6 !important;
  border-radius: 4px;
}

/* Cursor durante arrasto */
.fc-timegrid-slot:hover,
.fc-daygrid-day:hover {
  cursor: crosshair;
}

/* Efeito ao clicar e segurar */
.fc-timegrid-slot:active,
.fc-daygrid-day:active {
  background: rgba(59, 130, 246, 0.1);
}

/* Mirror (preview) do evento sendo criado */
.fc-event-mirror {
  background: rgba(59, 130, 246, 0.5) !important;
  border: 2px solid #3b82f6 !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* Animação suave */
.fc-highlight,
.fc-event-mirror {
  transition: all 0.15s ease;
}
```

**Alterações:**
- Adicionar estilos CSS no bloco `<style>` existente (linha ~666)
- Já existe `selectMirror={true}` configurado, só precisa melhorar o visual

**Estimativa:** Simples, ~30 linhas de CSS

---

## Ordem de Implementação Sugerida

1. **Sidebar scroll** (5 min) - Mais simples
2. **Ícone de estoque** (10 min) - Simples
3. **Calendar visual feedback** (15 min) - Simples, só CSS
4. **Sistema financeiro completo** (mais complexo):
   - 4.1 Schema Prisma + migrate
   - 4.2 Seed de categorias padrão
   - 4.3 API routes
   - 4.4 UI Components
   - 4.5 Integração na página financeiro

---

## Arquivos que Serão Modificados/Criados

### Modificados:
- `src/components/admin/sidebar.tsx`
- `src/components/stock/StockAlertBadge.tsx`
- `src/app/(admin)/calendario/page.tsx`
- `src/app/(admin)/financeiro/page.tsx`
- `prisma/schema.prisma`

### Novos:
- `src/app/api/financial/transactions/route.ts`
- `src/app/api/financial/transactions/[id]/route.ts`
- `src/app/api/financial/transactions/[id]/pay/route.ts`
- `src/app/api/financial/recurring/route.ts`
- `src/app/api/financial/recurring/[id]/route.ts`
- `src/app/api/financial/recurring/[id]/pause/route.ts`
- `src/app/api/financial/recurring/[id]/resume/route.ts`
- `src/app/api/financial/recurring/[id]/confirm/route.ts`
- `src/app/api/financial/categories/route.ts`
- `src/app/api/financial/categories/[id]/route.ts`
- `src/components/financial/TransactionDialog.tsx`
- `src/components/financial/RecurringTransactionCard.tsx`
- `src/components/financial/CategoryManager.tsx`
- `src/components/financial/TransactionFilters.tsx`
- `scripts/seed-categories.ts`

---

## 5. Sistema de Limites do Plano e Aviso de Upgrade

Esta funcionalidade implementa verificação de limites do plano (usuários, equipamentos, reservas) e exibe avisos para upgrade quando o cliente atinge ou ultrapassa os limites.

### 5.1 Limites dos Planos

| Plano | Usuários | Equipamentos | Reservas/mês |
|-------|----------|--------------|--------------|
| Starter | 2 | 50 | 200 |
| Professional | 5 | 200 | 1000 |
| Enterprise | 10 | Ilimitado (-1) | Ilimitado (-1) |

### 5.2 Arquitetura da Solução

#### A. Hook de Verificação de Limites

**Arquivo:** `src/hooks/usePlanLimits.ts`

```typescript
interface PlanLimits {
  maxUsers: number
  maxEquipments: number
  maxBookingsPerMonth: number
  currentUsers: number
  currentEquipments: number
  currentBookingsThisMonth: number
  isAtUserLimit: boolean
  isAtEquipmentLimit: boolean
  isAtBookingLimit: boolean
  isOverAnyLimit: boolean
  percentageUsers: number
  percentageEquipments: number
  percentageBookings: number
}

export function usePlanLimits(): PlanLimits & { loading: boolean }
```

#### B. API de Verificação de Uso

**Rota:** `GET /api/tenant/usage`

Retorna contagem atual de:
- Usuários ativos no tenant
- Equipamentos cadastrados
- Reservas criadas no mês atual

#### C. Componente de Aviso de Limite

**Arquivo:** `src/components/plan/LimitWarningBanner.tsx`

Banner que aparece em páginas relevantes quando o cliente está próximo ou atingiu o limite:

```tsx
interface LimitWarningBannerProps {
  type: 'users' | 'equipments' | 'bookings'
  current: number
  max: number
  showUpgradeButton?: boolean
}
```

**Comportamento:**
- **80-99%**: Banner amarelo de aviso "Você está usando X de Y"
- **100%+**: Banner vermelho "Limite atingido! Faça upgrade"
- Botão "Fazer Upgrade" leva para `/renovar`

#### D. Componente de Modal de Upgrade

**Arquivo:** `src/components/plan/UpgradeModal.tsx`

Modal que aparece quando o usuário tenta criar algo além do limite:

```tsx
interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  limitType: 'users' | 'equipments' | 'bookings'
  currentPlan: string
}
```

### 5.3 Onde Implementar as Verificações

#### Limite de Usuários
- **API:** `POST /api/team` - Verificar antes de adicionar usuário
- **UI:** `src/app/(admin)/equipe/page.tsx` - Mostrar banner de aviso

#### Limite de Equipamentos
- **API:** `POST /api/equipment` - Verificar antes de adicionar equipamento
- **UI:** `src/app/(admin)/equipamentos/page.tsx` - Mostrar banner de aviso

#### Limite de Reservas
- **API:** `POST /api/bookings` - Verificar antes de criar reserva
- **UI:** `src/app/(admin)/calendario/page.tsx` - Mostrar banner de aviso
- **UI:** `src/app/(admin)/reservas/page.tsx` - Mostrar banner de aviso

### 5.4 Lógica de Verificação na API

```typescript
// Exemplo para equipamentos
async function checkEquipmentLimit(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { subscription: { include: { plan: true } } }
  })

  const plan = tenant?.subscription?.plan
  if (!plan) throw new Error('Sem plano ativo')

  // -1 significa ilimitado
  if (plan.maxEquipments === -1) return { allowed: true }

  const currentCount = await prisma.equipment.count({
    where: { tenantId }
  })

  if (currentCount >= plan.maxEquipments) {
    return {
      allowed: false,
      message: `Limite de ${plan.maxEquipments} equipamentos atingido`,
      current: currentCount,
      max: plan.maxEquipments
    }
  }

  return { allowed: true, current: currentCount, max: plan.maxEquipments }
}
```

### 5.5 Resposta da API quando Limite Atingido

```json
{
  "error": "PLAN_LIMIT_EXCEEDED",
  "message": "Limite de equipamentos atingido",
  "details": {
    "limitType": "equipments",
    "current": 50,
    "max": 50,
    "upgradeUrl": "/renovar"
  }
}
```

### 5.6 Arquivos a Criar/Modificar

#### Novos Arquivos:
- `src/hooks/usePlanLimits.ts` - Hook para verificar limites
- `src/lib/plan-limits.ts` - Funções de verificação server-side
- `src/app/api/tenant/usage/route.ts` - API de uso atual
- `src/components/plan/LimitWarningBanner.tsx` - Banner de aviso
- `src/components/plan/UpgradeModal.tsx` - Modal de upgrade

#### Arquivos a Modificar:
- `src/app/api/equipment/route.ts` - Adicionar verificação em POST
- `src/app/api/bookings/route.ts` - Adicionar verificação em POST
- `src/app/api/team/route.ts` - Adicionar verificação em POST
- `src/app/(admin)/equipamentos/page.tsx` - Adicionar banner
- `src/app/(admin)/calendario/page.tsx` - Adicionar banner
- `src/app/(admin)/reservas/page.tsx` - Adicionar banner
- `src/app/(admin)/equipe/page.tsx` - Adicionar banner

### 5.7 Fluxo de Experiência do Usuário

1. **Antes do limite (0-79%)**: Uso normal, sem avisos
2. **Próximo do limite (80-99%)**: Banner amarelo informativo
3. **No limite (100%)**: Banner vermelho + botão de upgrade
4. **Tentativa além do limite**: Modal de bloqueio com opção de upgrade

### 5.8 Página de Renovação (/renovar)

Modificações já implementadas:
- ✅ Plano atual aparece como "PLANO ATUAL" (não selecionável)
- ✅ Outros planos podem ser selecionados para upgrade
- ✅ Seção "Precisa de mais?" para contato com vendas

### 5.9 Ordem de Implementação

1. Criar `src/lib/plan-limits.ts` com funções de verificação
2. Criar `src/app/api/tenant/usage/route.ts`
3. Criar `src/hooks/usePlanLimits.ts`
4. Criar `src/components/plan/LimitWarningBanner.tsx`
5. Criar `src/components/plan/UpgradeModal.tsx`
6. Modificar APIs de criação (equipment, bookings, team)
7. Adicionar banners nas páginas relevantes
8. Testar fluxo completo
