# ODuo Locação - Sistema SaaS Multi-tenant

Sistema completo de gestão para locadoras de equipamentos, construído como SaaS multi-tenant com Next.js 16, TypeScript, Prisma e NextAuth v5.

## 🚀 Funcionalidades Implementadas

### ✅ Core do Sistema

- **Autenticação & Autorização**
  - Sistema de login/registro com NextAuth v5
  - Autenticação por credenciais (email/senha)
  - Proteção de rotas com middleware otimizado
  - Sessões JWT

- **Multi-tenancy**
  - Isolamento completo de dados por tenant
  - Cada locadora tem seu próprio espaço
  - Middleware para controle de acesso

### ✅ Módulos Principais

#### 1. Dashboard
- **Arquivo**: `src/app/(admin)/dashboard/page.tsx`
- **API**: `src/app/api/dashboard/stats/route.ts`
- **Features**:
  - Cards com métricas principais (Equipamentos, Clientes, Reservas Ativas, Receita Mensal)
  - Lista de reservas recentes com status
  - Lista de equipamentos mais alugados
  - Gráfico de receita dos últimos 6 meses
  - Dados reais do banco de dados

#### 2. Gestão de Equipamentos
- **Arquivos**:
  - Lista: `src/app/(admin)/equipamentos/page.tsx`
  - Criar: `src/app/(admin)/equipamentos/novo/page.tsx`
  - Editar: `src/app/(admin)/equipamentos/[id]/page.tsx`
- **API**: `src/app/api/equipments/`
- **Features**:
  - CRUD completo de equipamentos
  - Campos: Nome, Categoria, Descrição, Preço/hora, Preço/dia, Quantidade, Status, Imagens
  - Status: Disponível, Alugado, Manutenção, Inativo
  - Validação com Zod
  - Interface responsiva com shadcn/ui

#### 3. Gestão de Clientes
- **Arquivos**:
  - Lista: `src/app/(admin)/clientes/page.tsx`
  - Criar: `src/app/(admin)/clientes/novo/page.tsx`
  - Editar: `src/app/(admin)/clientes/[id]/page.tsx`
- **API**: `src/app/api/customers/`
- **Features**:
  - CRUD completo de clientes
  - Campos: Nome, Email (opcional), Telefone, CPF/CNPJ, Endereço completo, Observações
  - Validação com Zod
  - Interface responsiva

#### 4. Gestão de Reservas
- **Arquivos**:
  - Lista: `src/app/(admin)/reservas/page.tsx`
  - Criar: `src/app/(admin)/reservas/novo/page.tsx`
  - Editar: `src/app/(admin)/reservas/[id]/page.tsx`
  - Calendário: `src/app/(admin)/reservas/calendario/page.tsx`
- **API**: `src/app/api/bookings/`
- **Features**:
  - CRUD completo de reservas
  - Campos: Cliente, Equipamento, Data início/fim, Preço total, Status, Observações
  - Status: Pendente, Confirmado, Concluído, Cancelado
  - Verificação automática de conflitos de datas
  - Validação de disponibilidade de equipamentos
  - View de calendário com react-big-calendar
  - Validação com Zod

#### 5. Landing Page
- **Arquivo**: `src/app/page.tsx`
- **Features**:
  - Design moderno e profissional
  - Hero section com gradientes
  - Preview do dashboard
  - Seção de estatísticas (500+ locadoras, 99.9% uptime)
  - Grid de 6 funcionalidades principais
  - 3 planos de preços (Starter R$97, Professional R$197, Enterprise R$397)
  - Seção de depoimentos
  - Footer completo
  - **Otimizado**: Contraste de cores melhorado (text-gray-700/900 em fundos claros)

### ✅ Autenticação

#### Login & Registro
- **Login**: `src/app/(auth)/login/page.tsx`
- **Registro**: `src/app/(auth)/cadastro/page.tsx`
- **Features**:
  - Formulários com validação (React Hook Form + Zod)
  - Feedback de erros
  - Redirecionamento automático após login
  - Criação de tenant no registro
  - Suporte a Suspense (Next.js 15+)

## 🛠 Stack Tecnológico

- **Framework**: Next.js 16.0.1 (App Router + Turbopack)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS + shadcn/ui
- **Banco de Dados**: PostgreSQL
- **ORM**: Prisma
- **Autenticação**: NextAuth v5 (beta)
- **Validação**: Zod
- **Formulários**: React Hook Form
- **UI Components**: shadcn/ui (Radix UI)
- **Ícones**: Lucide React
- **Calendário**: react-big-calendar
- **Gráficos**: Recharts

## 📁 Estrutura do Banco de Dados

```prisma
Tenant (Locadora)
├── id, name, slug, domain, email, phone, active, createdAt, updatedAt
├── Users[]
├── Customers[]
├── Equipment[]
└── Bookings[]

User (Usuário do Sistema)
├── id, name, email, passwordHash, role, tenantId
└── tenant (relation)

Customer (Cliente)
├── id, name, email, phone, document, address, city, state, zipCode, notes, tenantId
├── tenant (relation)
└── bookings[]

Equipment (Equipamento)
├── id, name, description, category, images[], pricePerHour, pricePerDay
├── quantity, status, tenantId, createdAt, updatedAt
├── tenant (relation)
└── bookings[]

Booking (Reserva)
├── id, customerId, equipmentId, startDate, endDate, totalPrice
├── status, notes, tenantId, createdAt, updatedAt
├── tenant (relation)
├── customer (relation)
└── equipment (relation)
```

## 🚦 Como Rodar o Projeto

### Pré-requisitos

- Node.js 18+
- PostgreSQL (via Docker)
- npm ou yarn

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Banco de Dados

```bash
# Subir PostgreSQL com Docker
docker-compose up -d

# Aplicar schema do Prisma
npx prisma db push

# Gerar Prisma Client
npx prisma generate
```

### 3. Configurar Variáveis de Ambiente

Criar `.env.local`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/saas_locacao"
AUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Popular Banco com Dados de Teste

```bash
node seed-test-data.js
```

**Credenciais de teste**:
- Email: `admin@teste.com`
- Senha: `123456`

### 5. Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

### 6. Build para Produção

```bash
npm run build
npm start
```

## 📊 Status de Implementação

### ✅ Pronto (100% funcional)

1. **Autenticação completa** - Login, registro, proteção de rotas
2. **Multi-tenancy** - Isolamento de dados por locadora
3. **Dashboard** - Com estatísticas e gráficos reais
4. **CRUD Equipamentos** - Criar, listar, editar, deletar
5. **CRUD Clientes** - Criar, listar, editar, deletar
6. **CRUD Reservas** - Criar, listar, editar, deletar com validação de conflitos
7. **Calendário de Reservas** - Visualização em calendário
8. **Landing Page** - Página inicial moderna e profissional
9. **API REST completa** - Todos os endpoints funcionando
10. **Validação de dados** - Formulários e APIs com Zod
11. **Middleware otimizado** - Leve e rápido (~5s de inicialização)

### 🔨 Próximas Funcionalidades Sugeridas

1. **Pagamentos**
   - Integração com Stripe/Mercado Pago
   - Histórico de pagamentos
   - Geração de faturas

2. **Relatórios Avançados**
   - Relatório de ocupação por equipamento
   - Análise de receita por período
   - Exportação para PDF/Excel

3. **Notificações**
   - Email para confirmação de reservas
   - Lembretes de devolução
   - Alertas de equipamentos em manutenção

4. **Gestão de Contratos**
   - Geração automática de contratos
   - Assinatura digital
   - Histórico de contratos

5. **Multi-usuários**
   - Convites para equipe
   - Permissões por usuário (Admin, Operador, Visualizador)

6. **Área do Cliente**
   - Portal para clientes fazerem reservas online
   - Histórico de locações
   - Pagamento online

7. **Manutenção de Equipamentos**
   - Agenda de manutenções preventivas
   - Histórico de manutenções
   - Custos de manutenção

8. **WhatsApp Integration**
   - Notificações via WhatsApp
   - Confirmação de reservas

9. **Upload de Imagens**
   - Integração com Cloudinary/AWS S3
   - Upload de fotos dos equipamentos
   - Fotos de danos/manutenção

10. **Configurações do Sistema**
    - Personalização de cores/logo
    - Configuração de emails
    - Termos de uso customizados

## 🔧 Otimizações Realizadas

1. **Middleware leve** - Mudança de `auth()` para `getToken()` reduziu bundle
2. **Suspense boundaries** - Adicionado para `useSearchParams()`
3. **ZodError fix** - Correção de `error.errors` → `error.issues`
4. **Contraste de cores** - Landing page otimizada para legibilidade
5. **Build otimizado** - Passa sem erros, pronto para produção

## 📝 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Prisma Studio (visualizar banco)
npx prisma studio

# Reset do banco (CUIDADO!)
npx prisma migrate reset

# Gerar tipos do Prisma
npx prisma generate

# Formatar código
npx prettier --write .

# Lint
npm run lint
```

## 🤝 Contribuindo

Este é um projeto privado da ODuo Assessoria.

## 📄 Licença

Propriedade de ODuo Assessoria © 2025
#   s a a s - o d u o  
 