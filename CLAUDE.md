# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ODuo Locação is a multi-tenant SaaS platform for equipment rental management (locadoras de equipamentos). Built with Next.js 16 App Router, TypeScript, Prisma ORM, and NextAuth v5.

**Tech Stack**: Next.js 16, React 19, TypeScript, Prisma, PostgreSQL, NextAuth v5, Tailwind CSS 4, shadcn/ui, TanStack Query, Zod, React Hook Form, Recharts, react-big-calendar, @react-pdf/renderer, Tiptap (rich text editor), driver.js (tours)

## Commands

```bash
# Development
npm run dev          # Start dev server with Turbopack

# Build & Production
npm run build        # prisma generate && next build
npm start            # Start production server

# Database
npx prisma generate  # Generate Prisma client (runs on postinstall)
npx prisma db push   # Push schema changes to database
npx prisma studio    # Visual database browser

# Testing
npm test             # Run Jest tests
npm run test:watch   # Watch mode
npm run test:coverage

# Lint
npm run lint         # ESLint
```

## Architecture

### Multi-Tenancy Model
- Each tenant (locadora) has isolated data via `tenantId` on all models
- Authentication stores `tenantId`, `tenantSlug`, and `role` in JWT session
- All API routes must filter queries by `session.user.tenantId`
- Subdomain-based access: `{tenant-slug}.oduoloc.com.br`

### Route Groups (App Router)
```
src/app/
├── (admin)/        # Protected admin routes (dashboard, equipamentos, clientes, reservas, etc.)
├── (auth)/         # Authentication routes (login, cadastro, planos)
├── (storefront)/   # Public tenant storefronts ([tenant]/)
├── super-admin/    # System-wide admin (SUPER_ADMIN role only)
└── api/            # API routes
```

### Key Source Directories
```
src/
├── components/
│   ├── admin/      # Admin layout, sidebar, header
│   ├── ui/         # shadcn/ui components (Radix-based)
│   ├── equipment/  # Equipment-related components
│   ├── stock/      # Stock management components
│   └── comercial/  # CRM/leads components
├── lib/
│   ├── auth.ts               # NextAuth v5 configuration
│   ├── prisma.ts             # Prisma singleton client
│   ├── email.ts              # Resend email service
│   ├── plan-limits.ts        # Plan feature/usage limits
│   ├── permissions.ts        # Role-based permissions
│   ├── pdf-generator.ts      # PDF generation with @react-pdf/renderer
│   ├── pdf-templates.ts      # PDF templates for contracts/invoices
│   ├── pricing.ts            # Plan pricing definitions
│   ├── tenant.ts             # Tenant utilities
│   ├── validations/          # Zod schemas
│   ├── fiscal/               # NFS-e integration (Focus NFe API)
│   ├── asaas/                # Asaas payment gateway client
│   ├── services/             # External services (CEP, CNPJ lookup)
│   ├── subscription/         # Subscription management
│   ├── cache/                # Cache and revalidation utilities
│   └── tours/                # Onboarding tour steps (driver.js)
└── hooks/                    # React hooks (usePlanLimits, etc.)
```

### Database Schema Highlights
- **Tenant**: Multi-tenant isolation, feature flags (nfseEnabled, stockEnabled, financialEnabled, etc.), fiscal config (CNPJ, regime tributário), integrations (WhatsApp, Stripe, Asaas), custom templates
- **User**: Roles (SUPER_ADMIN, ADMIN, MANAGER, OPERATOR, VIEWER), module permissions
- **Equipment**: Stock tracking (serialized or quantity), rental periods, costs, categories, images
- **EquipmentCategory**: Hierarchical equipment categorization
- **Booking**: Reservations with items, discounts, freight, fees, status workflow
- **BookingChecklist**: Pre/post-rental checklists per booking
- **ChecklistTemplate**: Reusable checklist templates
- **Customer**: PF/PJ with multiple delivery sites (CustomerSite)
- **Financial**: TransactionCategory, FinancialTransaction, RecurringTransaction
- **Subscription**: Tenant billing/plans (Asaas integration)
- **Invoice**: NFS-e invoices (Focus NFe integration)
- **TenantFiscalConfig**: Tax/fiscal settings per tenant
- **CRM**: Lead, LeadActivity, LeadEquipmentInterest (módulo comercial)
- **Stock**: StockMovement, EquipmentCost tracking
- **System**: ActivityLog, ApiKey, Webhook, UserModulePermission

### User Roles & Permissions
```typescript
SUPER_ADMIN  // ODuo system admin - full access to all tenants
ADMIN        // Tenant owner - full control
MANAGER      // Can create/edit (no delete)
OPERATOR     // Create bookings, view data
VIEWER       // Read-only access
```

### External Integrations
- **Asaas**: Brazilian payment gateway for subscription billing
- **Focus NFe**: Brazilian fiscal invoice (NFS-e) issuance API
- **Stripe**: Subscription payments (alternative to Asaas)
- **Resend**: Transactional emails
- **Cloudinary**: Image uploads
- **Sentry**: Error monitoring
- **Upstash**: Rate limiting (Redis)
- **BrasilAPI/ReceitaWS**: CNPJ lookup services
- **ViaCEP**: Brazilian postal code (CEP) lookup

## Code Patterns

### API Route Pattern
```typescript
// src/app/api/example/route.ts
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const data = await prisma.model.findMany({
    where: { tenantId: session.user.tenantId }
  })

  return NextResponse.json(data)
}
```

### Dynamic Route Params (Next.js 15+)
```typescript
// src/app/api/example/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // params is now a Promise
) {
  const { id } = await params  // Must await params
  // ...
}
```

### Tenant Feature Flags
Modules are enabled per tenant via boolean flags in the Tenant model:
- `nfseEnabled`: Notas Fiscais (NFS-e)
- `stockEnabled`: Gestão de Estoque
- `financialEnabled`: Módulo Financeiro
- `reportsEnabled`: Relatórios Avançados
- `apiEnabled`: API de Integração
- `webhooksEnabled`: Webhooks
- `multiUserEnabled`: Múltiplos Usuários

Check via `/api/tenant/modules` or session data.

### User Module Permissions
Granular permissions per module stored in `UserModulePermission`:
```typescript
// SystemModule enum: DASHBOARD, EQUIPAMENTOS, CLIENTES, RESERVAS, FINANCEIRO, etc.
// Each user can have: canView, canCreate, canEdit, canDelete per module
// ADMIN role bypasses all module permissions (full access)
```

### Middleware Authentication
The middleware ([src/middleware.ts](src/middleware.ts)) checks for session cookies and protects routes starting with:
- `/super-admin` - System admin panel
- `/dashboard` - Main dashboard
- `/equipamentos` - Equipment management
- `/clientes` - Customer management
- `/reservas` - Booking management
- `/calendario` - Calendar view
- `/usuarios` - User management
- `/financeiro` - Financial module
- `/comercial` - CRM/leads module
- `/estoque` - Stock management
- `/notas-fiscais` - Fiscal invoices (NFS-e)
- `/configuracoes` - Settings
- `/integracoes` - Integrations
- `/marketing` - Marketing tools
- `/relatorios` - Reports
- `/logs` - Activity logs
- `/ajuda` - Help/support
- `/renovar` - Subscription renewal
- `/api-docs` - API documentation
- `/guia-inicio` - Onboarding guide

Also extracts tenant slug from subdomain and injects it via `x-tenant-slug` header for API/page consumption.

### Component Library
Using shadcn/ui components in [src/components/ui/](src/components/ui/). Components are Radix-based with Tailwind styling. Use the `cn()` utility from `@/lib/utils` for className merging.

### PDF Generation
PDFs (contracts, invoices) are generated server-side using `@react-pdf/renderer`:
- Templates in [src/lib/pdf-templates.ts](src/lib/pdf-templates.ts)
- Generator in [src/lib/pdf-generator.ts](src/lib/pdf-generator.ts)
- Variable substitution via [src/lib/template-variables.ts](src/lib/template-variables.ts)
- Default templates in [src/lib/default-templates.ts](src/lib/default-templates.ts)

### External Service Integrations
- **CEP Lookup**: [src/lib/services/cep-service.ts](src/lib/services/cep-service.ts) - ViaCEP API
- **CNPJ Lookup**: [src/lib/services/cnpj-service.ts](src/lib/services/cnpj-service.ts) - BrasilAPI with ReceitaWS fallback
- **NFS-e**: [src/lib/fiscal/nfse-service.ts](src/lib/fiscal/nfse-service.ts) - Focus NFe client
- **Payments**: [src/lib/asaas/client.ts](src/lib/asaas/client.ts) - Asaas payment gateway

### Onboarding System
Interactive product tours using `driver.js`:
- Tour definitions in [src/lib/tours/tour-steps.ts](src/lib/tours/tour-steps.ts)
- Tracks completion state per user per module

### Rich Text Editor
Using Tiptap for contract/template editing:
- Extensions: Tables, Text Align, Underline, Placeholder
- Based on ProseMirror
- Used for contract templates and document editing

### Data Fetching
Using TanStack Query (React Query) for server state:
- Query client configured in [src/lib/query-client.ts](src/lib/query-client.ts)
- Preferred for data fetching in client components
- Provides caching, refetching, and optimistic updates

## Environment Variables

Required in `.env.local`:
```bash
DATABASE_URL=postgresql://...      # Prisma database connection
DIRECT_URL=postgresql://...        # Direct connection for migrations (Prisma Accelerate)
AUTH_SECRET=...                    # NextAuth secret key
NEXT_PUBLIC_ROOT_DOMAIN=oduoloc.com.br  # Root domain for multi-tenancy
```

Optional integrations:
```bash
# Payments & Billing
ASAAS_API_KEY=...                 # Asaas payment gateway
ASAAS_WEBHOOK_SECRET=...          # Asaas webhook verification
STRIPE_SECRET_KEY=...             # Stripe (alternative)

# Fiscal/NFS-e
FOCUS_NFE_API_KEY=...             # Focus NFe for NFS-e issuance
FOCUS_NFE_ENVIRONMENT=...         # homologacao or production

# Email
RESEND_API_KEY=...                # Transactional emails

# Storage
CLOUDINARY_CLOUD_NAME=...         # Image uploads
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Monitoring
SENTRY_DSN=...                    # Error tracking
SENTRY_AUTH_TOKEN=...

# Rate Limiting
UPSTASH_REDIS_REST_URL=...        # Upstash Redis for rate limiting
UPSTASH_REDIS_REST_TOKEN=...
```

## Important Development Notes

### Multi-Tenancy Security
- **CRITICAL**: Every database query MUST filter by `tenantId` from the session
- Never trust client-provided tenant information - always use `session.user.tenantId`
- API routes must validate session before processing requests
- Example:
  ```typescript
  const session = await auth()
  if (!session?.user?.tenantId) return unauthorized()
  const data = await prisma.model.findMany({
    where: { tenantId: session.user.tenantId } // REQUIRED
  })
  ```

### Feature Flags
- Check tenant feature flags before showing/allowing access to modules
- Feature flags are stored in the Tenant model (nfseEnabled, stockEnabled, etc.)
- Use `/api/tenant/modules` endpoint or session data to check flags
- Modules can be enabled/disabled per tenant (SaaS plan-based)

### Testing
- Jest configured for unit/integration tests
- Run tests with: `npm test` (watch: `npm run test:watch`)
- Coverage reports: `npm run test:coverage`
- Test files should be co-located with source files or in `__tests__` directories

## Language

This is a Brazilian Portuguese application. UI text, error messages, and documentation should be in Portuguese (pt-BR). Code (variables, functions, comments) uses English.
