# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ODuo Locação is a multi-tenant SaaS platform for equipment rental management (locadoras de equipamentos). Built with Next.js 16 App Router, TypeScript, Prisma ORM, and NextAuth v5.

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
│   ├── auth.ts     # NextAuth v5 configuration
│   ├── prisma.ts   # Prisma singleton client
│   ├── email.ts    # Resend email service
│   ├── plan-limits.ts    # Plan feature/usage limits
│   ├── permissions.ts    # Role-based permissions
│   └── validations/      # Zod schemas
└── hooks/          # React hooks (usePlanLimits, etc.)
```

### Database Schema Highlights
- **Tenant**: Multi-tenant isolation, feature flags, fiscal config
- **User**: Roles (SUPER_ADMIN, ADMIN, MANAGER, OPERATOR, VIEWER)
- **Equipment**: Stock tracking (serialized or quantity), rental periods, costs
- **Booking**: Reservations with items, discounts, freight, fees
- **Customer**: PF/PJ with multiple delivery sites (CustomerSite)
- **Financial**: TransactionCategory, FinancialTransaction, RecurringTransaction
- **CRM**: Lead, LeadActivity, LeadEquipmentInterest (módulo comercial)

### User Roles & Permissions
```typescript
SUPER_ADMIN  // ODuo system admin - full access to all tenants
ADMIN        // Tenant owner - full control
MANAGER      // Can create/edit (no delete)
OPERATOR     // Create bookings, view data
VIEWER       // Read-only access
```

### External Integrations
- **Stripe**: Subscription payments
- **Resend**: Transactional emails
- **Cloudinary**: Image uploads
- **Sentry**: Error monitoring
- **Upstash**: Rate limiting (Redis)
- **Asaas**: Brazilian payment gateway (billing)

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
The middleware (`src/middleware.ts`) checks for session cookies and protects routes starting with: `/dashboard`, `/equipamentos`, `/clientes`, `/reservas`, `/usuarios`, `/financeiro`, `/configuracoes`, `/integracoes`, `/marketing`, `/logs`, `/ajuda`, `/relatorios`, `/calendario`, `/super-admin`

### Component Library
Using shadcn/ui components in `src/components/ui/`. Components are Radix-based with Tailwind styling. Use the `cn()` utility from `@/lib/utils` for className merging.

## Environment Variables

Required in `.env.local`:
```
DATABASE_URL=postgresql://...
AUTH_SECRET=...
NEXT_PUBLIC_ROOT_DOMAIN=oduoloc.com.br
```

Optional integrations:
```
STRIPE_SECRET_KEY, RESEND_API_KEY, CLOUDINARY_*, SENTRY_DSN, UPSTASH_*
```

## Language

This is a Brazilian Portuguese application. UI text, error messages, and documentation should be in Portuguese (pt-BR). Code (variables, functions, comments) uses English.
