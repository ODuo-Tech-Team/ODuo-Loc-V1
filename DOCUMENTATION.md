# ODuo Locação - Documentação Completa

## Sistema SaaS Multi-tenant para Gestão de Locação de Equipamentos

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estrutura do Projeto](#3-estrutura-do-projeto)
4. [Arquitetura Multi-tenant](#4-arquitetura-multi-tenant)
5. [Autenticação e Autorização](#5-autenticação-e-autorização)
6. [Banco de Dados](#6-banco-de-dados)
7. [API Routes](#7-api-routes)
8. [Páginas da Aplicação](#8-páginas-da-aplicação)
9. [Componentes](#9-componentes)
10. [Bibliotecas Utilitárias](#10-bibliotecas-utilitárias)
11. [Funcionalidades Principais](#11-funcionalidades-principais)
12. [Integrações](#12-integrações)
13. [Configuração e Deploy](#13-configuração-e-deploy)

---

## 1. Visão Geral

O **ODuo Locação** é uma plataforma SaaS (Software as a Service) multi-tenant desenvolvida para empresas de locação de equipamentos. O sistema permite que múltiplas empresas (tenants) utilizem a mesma infraestrutura com total isolamento de dados.

### Principais Recursos

- **Gestão de Equipamentos**: Cadastro completo com preços, imagens, documentos e custos
- **Gestão de Clientes**: Base de clientes com informações de contato
- **Sistema de Reservas**: Agendamento com detecção de conflitos
- **Financeiro**: Controle de receitas, despesas e lucratividade
- **Calendário**: Visualização de reservas em formato calendário
- **Documentos**: Geração de contratos e recibos em PDF
- **Notificações**: E-mails automáticos de confirmação e lembrete
- **Storefront Público**: Interface para clientes realizarem reservas
- **Painel Super Admin**: Gestão centralizada de todos os tenants

---

## 2. Stack Tecnológico

### Frontend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| Next.js | 16.0.1 | Framework React com App Router |
| React | 19.2.0 | Biblioteca UI |
| TypeScript | 5.x | Tipagem estática |
| Tailwind CSS | 4.x | Framework CSS utilitário |
| shadcn/ui | - | Componentes baseados em Radix UI |

### Backend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| Next.js API Routes | - | API RESTful |
| Prisma ORM | 6.19.0 | ORM para banco de dados |
| PostgreSQL | - | Banco de dados relacional |

### Autenticação
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| NextAuth.js | 5.0.0-beta.30 | Autenticação |
| bcryptjs | 3.0.3 | Hash de senhas |

### Serviços Externos
| Serviço | Biblioteca | Descrição |
|---------|------------|-----------|
| Stripe | stripe v19.3.0 | Pagamentos |
| Resend | resend v6.5.2 | Envio de e-mails |
| Cloudinary | cloudinary v2.8.0 | Upload de imagens |
| Sentry | @sentry/nextjs v10.24.0 | Monitoramento de erros |
| Upstash | @upstash/redis | Rate limiting |

### Bibliotecas de UI/UX
| Biblioteca | Descrição |
|------------|-----------|
| FullCalendar | Calendário interativo |
| Recharts | Gráficos e charts |
| Sonner | Notificações toast |
| Lucide React | Ícones |
| html2pdf.js | Geração de PDF |

---

## 3. Estrutura do Projeto

```
saas-oduo/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (admin)/           # Rotas administrativas protegidas
│   │   ├── (auth)/            # Rotas de autenticação
│   │   ├── (storefront)/      # Storefront público
│   │   ├── (super-admin)/     # Painel super admin
│   │   ├── api/               # API Routes
│   │   ├── layout.tsx         # Layout raiz
│   │   └── page.tsx           # Landing page
│   ├── components/            # Componentes React
│   │   ├── admin/             # Componentes do admin
│   │   ├── super-admin/       # Componentes super admin
│   │   └── ui/                # Componentes shadcn/ui
│   ├── lib/                   # Utilitários e configurações
│   ├── types/                 # Definições de tipos TypeScript
│   └── middleware.ts          # Middleware de autenticação
├── prisma/
│   └── schema.prisma          # Schema do banco de dados
├── public/                    # Arquivos estáticos
└── [arquivos de configuração]
```

### Route Groups (Grupos de Rotas)

O Next.js App Router utiliza grupos de rotas para organizar o código:

- **(admin)**: Páginas administrativas que requerem autenticação
- **(auth)**: Páginas de login, cadastro e planos
- **(storefront)**: Interface pública para clientes
- **(super-admin)**: Painel de controle do sistema

---

## 4. Arquitetura Multi-tenant

### Conceito

Cada empresa (tenant) possui seus próprios dados isolados. O `tenantId` é armazenado na sessão do usuário e utilizado em todas as queries.

### Fluxo de Dados

```
Usuário → Autenticação → Sessão (tenantId) → API → Prisma (where: {tenantId}) → BD
```

### Identificação do Tenant

1. **Admin**: Via sessão do usuário autenticado
2. **Storefront**: Via slug na URL (`/[tenant]/...`)
3. **API Pública**: Via slug do tenant na rota

### Exemplo de Query com Tenant

```typescript
// Em qualquer API route
const session = await auth()
const tenantId = session?.user?.tenantId

const equipments = await prisma.equipment.findMany({
  where: { tenantId }
})
```

---

## 5. Autenticação e Autorização

### Configuração NextAuth (`src/lib/auth.ts`)

```typescript
// Provider: Credentials (email/password)
// Sessão: JWT
// Dados na sessão: id, email, name, role, tenantId, tenantSlug
```

### Roles (Papéis)

| Role | Descrição | Permissões |
|------|-----------|------------|
| `SUPER_ADMIN` | Administrador do sistema ODuo | Acesso total a todos os tenants |
| `ADMIN` | Dono do tenant | Controle total do tenant |
| `MANAGER` | Gerente | Criar/editar operações |
| `OPERATOR` | Operador | Criar reservas, visualizar dados |
| `VIEWER` | Visualizador | Apenas leitura |

### Middleware de Proteção (`src/middleware.ts`)

Rotas protegidas:
- `/dashboard`
- `/equipamentos`
- `/clientes`
- `/reservas`
- `/usuarios`
- `/financeiro`
- `/configuracoes`
- `/integracoes`
- `/marketing`
- `/logs`
- `/ajuda`
- `/relatorios`

---

## 6. Banco de Dados

### Diagrama de Relacionamentos

```
Tenant (1) ──────────────────┬── (*) User
                             ├── (*) Equipment ────┬── (*) EquipmentCost
                             │                     ├── (*) EquipmentDocument
                             │                     └── (*) UnavailableDate
                             ├── (*) Customer
                             ├── (*) Booking ──────── (*) BookingDocument
                             ├── (*) ActivityLog
                             ├── (*) ApiKey
                             └── (*) Webhook
```

### Modelos Principais

#### Tenant (Empresa)
```prisma
model Tenant {
  id              String   @id @default(cuid())
  slug            String   @unique    // URL amigável
  domain          String?  @unique    // Domínio personalizado
  name            String
  logo            String?
  primaryColor    String   @default("#000000")
  email           String
  phone           String
  address         String?
  whatsappToken   String?
  whatsappPhone   String?
  googleCalendarId String?
  stripeAccountId String?
  active          Boolean  @default(true)
  contractTemplate String?
  receiptTemplate String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

#### Equipment (Equipamento)
```prisma
model Equipment {
  id            String          @id @default(cuid())
  name          String
  description   String?
  category      String
  images        String[]
  pricePerHour  Float?
  pricePerDay   Float
  quantity      Int             @default(1)
  status        EquipmentStatus @default(AVAILABLE)
  purchasePrice Float?
  purchaseDate  DateTime?
  tenantId      String

  @@index([tenantId, status])
  @@index([tenantId, status, category])
}
```

#### Booking (Reserva)
```prisma
model Booking {
  id               String        @id @default(cuid())
  bookingNumber    String        @unique
  startDate        DateTime
  endDate          DateTime
  startTime        String?
  endTime          String?
  totalPrice       Float
  status           BookingStatus @default(PENDING)
  equipmentId      String
  customerId       String
  tenantId         String
  paymentIntentId  String?
  paidAt           DateTime?
  contractUrl      String?
  notes            String?
  confirmationSent Boolean       @default(false)
  reminderSent     Boolean       @default(false)
  googleEventId    String?

  @@index([tenantId, status])
  @@index([tenantId, status, startDate])
  @@index([equipmentId, startDate, endDate])
}
```

#### Customer (Cliente)
```prisma
model Customer {
  id        String   @id @default(cuid())
  name      String
  email     String?
  phone     String
  cpfCnpj   String?
  address   String?
  city      String?
  state     String?
  zipCode   String?
  notes     String?
  tenantId  String

  @@index([tenantId])
}
```

### Enums

```prisma
enum Role {
  SUPER_ADMIN
  ADMIN
  MANAGER
  OPERATOR
  VIEWER
}

enum EquipmentStatus {
  AVAILABLE
  RENTED
  MAINTENANCE
  INACTIVE
}

enum BookingStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
}

enum CostType {
  PURCHASE
  MAINTENANCE
  INSURANCE
  FUEL
  REPAIR
  DEPRECIATION
  OTHER
}
```

---

## 7. API Routes

### Estrutura Base

```
/api
├── /auth                    # Autenticação
├── /bookings               # Reservas
├── /customers              # Clientes
├── /equipments             # Equipamentos
├── /dashboard              # Dashboard
├── /financial              # Financeiro
├── /integrations           # Integrações
├── /tenant                 # Configurações do tenant
├── /super-admin            # Super Admin
├── /storefront             # API pública
├── /email                  # Envio de e-mails
├── /payment                # Pagamentos
├── /notifications          # Notificações
├── /activity-logs          # Logs de atividade
└── /register               # Registro de usuários
```

### Detalhamento das APIs

#### Clientes (`/api/customers`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/customers` | Lista todos os clientes |
| POST | `/api/customers` | Cria novo cliente |
| GET | `/api/customers/[id]` | Busca cliente por ID |
| PUT | `/api/customers/[id]` | Atualiza cliente |
| DELETE | `/api/customers/[id]` | Remove cliente |

#### Equipamentos (`/api/equipments`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/equipments` | Lista equipamentos |
| POST | `/api/equipments` | Cria equipamento |
| GET | `/api/equipments/[id]` | Busca equipamento |
| PUT | `/api/equipments/[id]` | Atualiza equipamento |
| DELETE | `/api/equipments/[id]` | Remove equipamento |
| GET | `/api/equipments/[id]/costs` | Lista custos |
| POST | `/api/equipments/[id]/costs` | Adiciona custo |
| GET | `/api/equipments/[id]/documents` | Lista documentos |
| POST | `/api/equipments/[id]/documents` | Upload documento |

#### Reservas (`/api/bookings`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/bookings` | Lista reservas |
| POST | `/api/bookings` | Cria reserva |
| GET | `/api/bookings/[id]` | Busca reserva |
| PUT | `/api/bookings/[id]` | Atualiza reserva |
| DELETE | `/api/bookings/[id]` | Cancela reserva |
| GET | `/api/bookings/calendar` | Dados do calendário |
| POST | `/api/bookings/[id]/payment` | Registra pagamento |
| DELETE | `/api/bookings/[id]/payment` | Estorna pagamento |
| POST | `/api/bookings/[id]/documents` | Gera documento |

#### Financeiro (`/api/financial`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/financial/stats` | Estatísticas financeiras |
| GET | `/api/financial/overview` | Visão geral |
| GET | `/api/financial/profitability` | Análise de lucratividade |
| GET | `/api/financial/equipment/[id]` | Financeiro do equipamento |

#### Super Admin (`/api/super-admin`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/super-admin/stats` | Estatísticas do sistema |
| GET | `/api/super-admin/tenants` | Lista tenants |
| POST | `/api/super-admin/tenants` | Cria tenant |
| PUT | `/api/super-admin/tenants/[id]` | Atualiza tenant |
| DELETE | `/api/super-admin/tenants/[id]` | Remove tenant |
| GET | `/api/super-admin/users` | Lista usuários |

#### Storefront Público (`/api/storefront/[tenant]`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/storefront/[tenant]/equipments` | Lista equipamentos públicos |
| GET | `/api/storefront/[tenant]/equipments/[id]` | Detalhes do equipamento |
| POST | `/api/storefront/[tenant]/bookings` | Cria reserva pública |

---

## 8. Páginas da Aplicação

### Admin (Área Administrativa)

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/dashboard` | `(admin)/dashboard/page.tsx` | Painel principal |
| `/clientes` | `(admin)/clientes/page.tsx` | Lista de clientes |
| `/clientes/novo` | `(admin)/clientes/novo/page.tsx` | Novo cliente |
| `/clientes/[id]` | `(admin)/clientes/[id]/page.tsx` | Editar cliente |
| `/equipamentos` | `(admin)/equipamentos/page.tsx` | Lista de equipamentos |
| `/equipamentos/novo` | `(admin)/equipamentos/novo/page.tsx` | Novo equipamento |
| `/equipamentos/[id]` | `(admin)/equipamentos/[id]/page.tsx` | Editar equipamento |
| `/equipamentos/[id]/documentos` | `(admin)/equipamentos/[id]/documentos/page.tsx` | Documentos do equipamento |
| `/equipamentos/[id]/financeiro` | `(admin)/equipamentos/[id]/financeiro/page.tsx` | Financeiro do equipamento |
| `/reservas` | `(admin)/reservas/page.tsx` | Lista de reservas |
| `/reservas/novo` | `(admin)/reservas/novo/page.tsx` | Nova reserva |
| `/reservas/[id]` | `(admin)/reservas/[id]/page.tsx` | Editar reserva |
| `/calendario` | `(admin)/calendario/page.tsx` | Calendário geral |
| `/usuarios` | `(admin)/usuarios/page.tsx` | Gestão de usuários |
| `/financeiro` | `(admin)/financeiro/page.tsx` | Painel financeiro |
| `/relatorios` | `(admin)/relatorios/page.tsx` | Relatórios |
| `/configuracoes` | `(admin)/configuracoes/page.tsx` | Configurações |
| `/integracoes` | `(admin)/integracoes/page.tsx` | Integrações |
| `/logs` | `(admin)/logs/page.tsx` | Logs de atividade |
| `/marketing` | `(admin)/marketing/page.tsx` | Marketing |
| `/ajuda` | `(admin)/ajuda/page.tsx` | Central de ajuda |
| `/api-docs` | `(admin)/api-docs/page.tsx` | Documentação da API |

### Autenticação

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/login` | `(auth)/login/page.tsx` | Tela de login |
| `/cadastro` | `(auth)/cadastro/page.tsx` | Registro |
| `/planos` | `(auth)/planos/page.tsx` | Planos e preços |
| `/checkout` | `(auth)/checkout/page.tsx` | Checkout |
| `/sucesso` | `(auth)/sucesso/page.tsx` | Sucesso no cadastro |

### Storefront (Público)

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/[tenant]` | `(storefront)/[tenant]/page.tsx` | Página inicial do tenant |
| `/[tenant]/equipamento/[id]` | `(storefront)/[tenant]/equipamento/[id]/page.tsx` | Detalhes do equipamento |

### Super Admin

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/super-admin` | `(super-admin)/super-admin/page.tsx` | Dashboard super admin |
| `/super-admin/tenants` | `(super-admin)/super-admin/tenants/page.tsx` | Gestão de tenants |
| `/super-admin/users` | `(super-admin)/super-admin/users/page.tsx` | Gestão de usuários |

---

## 9. Componentes

### Estrutura de Componentes

```
src/components/
├── admin/
│   ├── admin-layout-client.tsx   # Layout do admin (client)
│   ├── header.tsx                # Cabeçalho
│   └── sidebar.tsx               # Menu lateral
├── super-admin/
│   └── super-admin-layout-client.tsx
└── ui/                           # shadcn/ui
    ├── alert-dialog.tsx
    ├── avatar.tsx
    ├── badge.tsx
    ├── button.tsx
    ├── card.tsx
    ├── checkbox.tsx
    ├── dialog.tsx
    ├── dropdown-menu.tsx
    ├── image-upload.tsx
    ├── input.tsx
    ├── label.tsx
    ├── select.tsx
    ├── sheet.tsx
    ├── sonner.tsx
    ├── switch.tsx
    ├── table.tsx
    ├── tabs.tsx
    └── textarea.tsx
```

### Componentes UI (shadcn/ui)

Todos os componentes seguem o padrão do shadcn/ui, baseados em Radix UI primitives:

- **Button**: Botões com variantes (default, destructive, outline, secondary, ghost, link)
- **Card**: Container com header, content e footer
- **Dialog**: Modal dialogs
- **Table**: Tabelas com header, body e paginação
- **Select**: Dropdowns customizados
- **Input/Textarea**: Campos de formulário
- **Badge**: Tags e labels
- **Tabs**: Navegação em abas
- **Alert Dialog**: Confirmações

---

## 10. Bibliotecas Utilitárias

### `src/lib/auth.ts`
Configuração do NextAuth com:
- Provider Credentials (email/password)
- Callbacks para JWT e sessão
- Inclusão de dados do tenant na sessão

### `src/lib/prisma.ts`
Cliente Prisma singleton para conexão com banco:
```typescript
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

### `src/lib/email.ts`
Serviço de e-mail com Resend:
- Templates HTML com identidade visual ODuo
- E-mails de confirmação de reserva
- E-mails de lembrete
- Recibos de pagamento
- Notificações de cancelamento

### `src/lib/pdf-templates.ts`
Templates HTML para geração de PDF:
- Contrato de locação
- Recibo de pagamento
- Design moderno com tema escuro ODuo

### `src/lib/pdf-generator.ts`
Utilitário para geração de PDF no cliente:
```typescript
import html2pdf from "html2pdf.js"

export async function generatePDFFromHTML(html: string, options: PDFGeneratorOptions)
export async function downloadDocumentAsPDF(bookingId: string, type: "CONTRACT" | "RECEIPT")
```

### `src/lib/permissions.ts`
Sistema de permissões baseado em roles:
```typescript
export function hasPermission(role: Role, permission: Permission): boolean
export function canAccess(role: Role, resource: Resource, action: Action): boolean
```

### `src/lib/utils.ts`
Utilitários gerais:
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## 11. Funcionalidades Principais

### 11.1 Gestão de Equipamentos

**Recursos:**
- Cadastro com múltiplas imagens (Cloudinary)
- Categorização
- Preços por hora e/ou dia
- Controle de quantidade
- Status (disponível, alugado, manutenção, inativo)
- Histórico de custos (compra, manutenção, seguros, etc.)
- Upload de documentos (manuais, garantias, certificados)
- Bloqueio de datas indisponíveis

### 11.2 Gestão de Clientes

**Recursos:**
- Cadastro completo com dados pessoais
- CPF/CNPJ
- Endereço completo
- Histórico de reservas
- Observações

### 11.3 Sistema de Reservas

**Recursos:**
- Seleção de equipamento e cliente
- Definição de período (data/hora)
- Cálculo automático de preço
- Detecção de conflitos
- Status (pendente, confirmada, concluída, cancelada)
- Geração de contrato e recibo
- Envio de e-mails automáticos
- Registro de pagamento

### 11.4 Financeiro

**Recursos:**
- Dashboard com métricas
- Receitas (reservas pagas)
- Despesas (custos de equipamentos)
- Saldo
- Análise de lucratividade por equipamento
- DRE simplificado
- Fluxo de caixa

### 11.5 Calendário

**Recursos:**
- Visualização mensal/semanal/diária
- Drag & drop para criar reservas
- Cores por status
- Filtro por equipamento
- Detalhes ao clicar

### 11.6 Documentos

**Contratos:**
- Geração automática
- Dados das partes (locador/locatário)
- Descrição do equipamento
- Período e valores
- Cláusulas padrão
- Assinaturas

**Recibos:**
- Confirmação de pagamento
- Valor por extenso
- Dados fiscais

### 11.7 Notificações por E-mail

**Tipos:**
- Confirmação de reserva
- Lembrete (antes do início)
- Recibo de pagamento
- Cancelamento

**Design:**
- Tema escuro ODuo
- Responsivo
- Botões de ação

### 11.8 Storefront Público

**Recursos:**
- Catálogo de equipamentos
- Filtros e busca
- Detalhes do equipamento
- Formulário de reserva
- Personalização por tenant (logo, cores)

### 11.9 Super Admin

**Recursos:**
- Dashboard com estatísticas do sistema
- Gestão de todos os tenants
- Gestão de todos os usuários
- Ativação/desativação de tenants

---

## 12. Integrações

### 12.1 Stripe (Pagamentos)

**Configuração:**
```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

**Funcionalidades:**
- Checkout de planos
- Processamento de pagamentos
- Webhooks para eventos

### 12.2 Resend (E-mails)

**Configuração:**
```env
RESEND_API_KEY=re_...
```

**Funcionalidades:**
- Envio de e-mails transacionais
- Templates HTML personalizados

### 12.3 Cloudinary (Imagens)

**Configuração:**
```env
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

**Funcionalidades:**
- Upload de imagens de equipamentos
- Otimização automática
- Transformações

### 12.4 Sentry (Monitoramento)

**Configuração:**
```env
SENTRY_DSN=...
```

**Funcionalidades:**
- Captura de erros
- Performance monitoring
- Alertas

### 12.5 Upstash (Rate Limiting)

**Configuração:**
```env
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

**Funcionalidades:**
- Rate limiting de API
- Cache distribuído

### 12.6 API Keys e Webhooks

**API Keys:**
- Geração de chaves de API por tenant
- Permissões configuráveis
- Registro de uso

**Webhooks:**
- Configuração de URLs
- Eventos suportados:
  - `booking.created`
  - `booking.updated`
  - `booking.cancelled`
  - `equipment.created`
  - `equipment.updated`

---

## 13. Configuração e Deploy

### 13.1 Variáveis de Ambiente

```env
# Banco de Dados
DATABASE_URL="postgresql://user:pass@host:5432/db"

# NextAuth
AUTH_SECRET="..."
NEXTAUTH_URL="https://..."

# Stripe
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."

# Resend
RESEND_API_KEY="re_..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Sentry
SENTRY_DSN="..."

# Upstash
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

# Super Admin
SUPER_ADMIN_EMAIL="admin@oduo.com.br"
```

### 13.2 Scripts NPM

```json
{
  "dev": "next dev",
  "build": "prisma generate && next build",
  "postbuild": "prisma db push --accept-data-loss",
  "start": "next start",
  "lint": "eslint",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

### 13.3 Docker (Desenvolvimento)

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: oduo
      POSTGRES_PASSWORD: oduo
      POSTGRES_DB: oduo
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 13.4 Deploy Vercel

1. Conectar repositório GitHub
2. Configurar variáveis de ambiente
3. Deploy automático em cada push

**Build Command:** `prisma generate && next build`

**Output Directory:** `.next`

### 13.5 Migrations Prisma

```bash
# Gerar cliente Prisma
npx prisma generate

# Sincronizar schema com banco
npx prisma db push

# Criar migration
npx prisma migrate dev --name nome_da_migration

# Aplicar migrations em produção
npx prisma migrate deploy
```

---

## Apêndice: Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Testes
npm test

# Lint
npm run lint

# Prisma Studio (visualizar banco)
npx prisma studio

# Seed do banco (se existir)
npx prisma db seed
```

---

## Contato e Suporte

- **Sistema**: ODuo Locação
- **Website**: oduo.com.br
- **Suporte**: suporte@oduo.com.br

---

*Documentação gerada automaticamente em 25/11/2025*
