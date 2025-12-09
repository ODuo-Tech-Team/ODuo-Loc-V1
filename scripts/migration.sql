-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "SystemModule" AS ENUM ('DASHBOARD', 'EQUIPAMENTOS', 'CLIENTES', 'RESERVAS', 'FINANCEIRO', 'RELATORIOS', 'USUARIOS', 'CONFIGURACOES', 'INTEGRACOES', 'MANUTENCAO', 'COMERCIAL');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "FreightType" AS ENUM ('FREE', 'FIXED', 'BY_REGION');

-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('CANCELLATION', 'LATE_RETURN');

-- CreateEnum
CREATE TYPE "CostType" AS ENUM ('PURCHASE', 'MAINTENANCE', 'INSURANCE', 'FUEL', 'REPAIR', 'DEPRECIATION', 'OTHER');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('MANUAL', 'WARRANTY', 'CERTIFICATE', 'INVOICE', 'OTHER');

-- CreateEnum
CREATE TYPE "BookingDocType" AS ENUM ('CONTRACT', 'RECEIPT', 'INVOICE');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('PURCHASE', 'RENTAL_OUT', 'RENTAL_RETURN', 'ADJUSTMENT', 'DAMAGE', 'LOSS', 'MAINTENANCE_OUT', 'MAINTENANCE_IN');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'OVERDUE', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'DAMAGED', 'RETIRED');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'INSPECTION');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RecurrenceStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('DIRECT', 'REFERRAL', 'WEBSITE', 'COLD_CALL', 'SOCIAL_MEDIA', 'EVENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('PRESENCIAL', 'ONLINE');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('VISIT', 'CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'PROPOSAL', 'OTHER');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#000000',
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "whatsappToken" TEXT,
    "whatsappPhone" TEXT,
    "googleCalendarId" TEXT,
    "stripeAccountId" TEXT,
    "cnpj" TEXT,
    "inscricaoEstadual" TEXT,
    "inscricaoMunicipal" TEXT,
    "regimeTributario" TEXT,
    "codigoMunicipio" TEXT,
    "nfseEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stockEnabled" BOOLEAN NOT NULL DEFAULT true,
    "financialEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reportsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "apiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "webhooksEnabled" BOOLEAN NOT NULL DEFAULT false,
    "multiUserEnabled" BOOLEAN NOT NULL DEFAULT true,
    "customDomainsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "asaasCustomerId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contractTemplate" TEXT,
    "receiptTemplate" TEXT,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoLoginToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutoLoginToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserModulePermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "module" "SystemModule" NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserModulePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "images" TEXT[],
    "pricePerHour" DOUBLE PRECISION,
    "pricePerDay" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'AVAILABLE',
    "totalStock" INTEGER NOT NULL DEFAULT 1,
    "availableStock" INTEGER NOT NULL DEFAULT 1,
    "reservedStock" INTEGER NOT NULL DEFAULT 0,
    "maintenanceStock" INTEGER NOT NULL DEFAULT 0,
    "damagedStock" INTEGER NOT NULL DEFAULT 0,
    "minStockLevel" INTEGER NOT NULL DEFAULT 1,
    "unitCost" DOUBLE PRECISION,
    "purchasePrice" DOUBLE PRECISION,
    "purchaseDate" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalPeriod" (
    "id" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "label" TEXT,
    "equipmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnavailableDate" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "equipmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnavailableDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "personType" TEXT NOT NULL DEFAULT 'PJ',
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "cpfCnpj" TEXT,
    "inscricaoEstadual" TEXT,
    "inscricaoMunicipal" TEXT,
    "isIsentoIE" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT,
    "phone" TEXT,
    "phoneSecondary" TEXT,
    "whatsapp" TEXT,
    "contactName" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "ibgeCode" TEXT,
    "address_legacy" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSite" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "ibgeCode" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "bookingNumber" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "subtotal" DOUBLE PRECISION,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "discountType" "DiscountType",
    "discountValue" DOUBLE PRECISION,
    "discountReason" TEXT,
    "validUntil" TIMESTAMP(3),
    "validityNotificationSent" BOOLEAN NOT NULL DEFAULT false,
    "freightType" "FreightType",
    "freightValue" DOUBLE PRECISION,
    "freightRegionId" TEXT,
    "cancellationFeePercent" DOUBLE PRECISION,
    "lateFeePercent" DOUBLE PRECISION,
    "actualReturnDate" TIMESTAMP(3),
    "equipmentId" TEXT,
    "customerId" TEXT NOT NULL,
    "customerSiteId" TEXT,
    "tenantId" TEXT NOT NULL,
    "paymentIntentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "contractUrl" TEXT,
    "notes" TEXT,
    "confirmationSent" BOOLEAN NOT NULL DEFAULT false,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "googleEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreightRegion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cities" TEXT[],
    "price" DOUBLE PRECISION NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreightRegion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingFee" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" "FeeType" NOT NULL,
    "percent" DOUBLE PRECISION NOT NULL,
    "baseValue" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "daysLate" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "permissions" JSONB,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[],
    "secret" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentCost" (
    "id" TEXT NOT NULL,
    "type" "CostType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "equipmentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentDocument" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DocType" NOT NULL,
    "url" TEXT NOT NULL,
    "fileSize" INTEGER,
    "equipmentId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingDocument" (
    "id" TEXT NOT NULL,
    "type" "BookingDocType" NOT NULL,
    "url" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "sentTo" TEXT,
    "bookingId" TEXT NOT NULL,

    CONSTRAINT "BookingDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingItem" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "deliveredQty" INTEGER NOT NULL DEFAULT 0,
    "returnedQty" INTEGER NOT NULL DEFAULT 0,
    "damagedQty" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previousStock" INTEGER NOT NULL,
    "newStock" INTEGER NOT NULL,
    "reason" TEXT,
    "equipmentId" TEXT NOT NULL,
    "bookingId" TEXT,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantFiscalConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "focusNfeToken" TEXT,
    "focusNfeEnvironment" TEXT NOT NULL DEFAULT 'HOMOLOGACAO',
    "nfseSerie" TEXT NOT NULL DEFAULT '1',
    "nfseProximoNumero" INTEGER NOT NULL DEFAULT 1,
    "codigoServico" TEXT,
    "aliquotaIss" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "issRetido" BOOLEAN NOT NULL DEFAULT false,
    "descricaoTemplate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantFiscalConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "internalRef" TEXT NOT NULL,
    "numero" TEXT,
    "serie" TEXT,
    "codigoVerificacao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "focusNfeStatus" TEXT,
    "xmlUrl" TEXT,
    "pdfUrl" TEXT,
    "valorServicos" DOUBLE PRECISION NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "aliquotaIss" DOUBLE PRECISION,
    "valorIss" DOUBLE PRECISION,
    "issRetido" BOOLEAN NOT NULL DEFAULT false,
    "descricaoServico" TEXT NOT NULL,
    "codigoServico" TEXT,
    "tomadorNome" TEXT NOT NULL,
    "tomadorCpfCnpj" TEXT,
    "tomadorEmail" TEXT,
    "tomadorEndereco" JSONB,
    "bookingId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "emittedAt" TIMESTAMP(3),
    "sentToCustomerAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPrice" DOUBLE PRECISION NOT NULL,
    "annualPrice" DOUBLE PRECISION,
    "maxUsers" INTEGER NOT NULL DEFAULT 1,
    "maxEquipments" INTEGER NOT NULL DEFAULT 10,
    "maxBookingsPerMonth" INTEGER NOT NULL DEFAULT 50,
    "storageGb" INTEGER NOT NULL DEFAULT 1,
    "nfseEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stockEnabled" BOOLEAN NOT NULL DEFAULT true,
    "financialEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reportsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "apiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "webhooksEnabled" BOOLEAN NOT NULL DEFAULT false,
    "multiUserEnabled" BOOLEAN NOT NULL DEFAULT false,
    "customDomainsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "canceledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "nextBillingDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "asaasPaymentId" TEXT,
    "asaasInvoiceUrl" TEXT,
    "asaasBankSlipUrl" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "billingType" TEXT NOT NULL DEFAULT 'BOLETO',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "attemptedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "webhookReceivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentUnit" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "internalCode" TEXT,
    "status" "UnitStatus" NOT NULL DEFAULT 'AVAILABLE',
    "acquisitionDate" TIMESTAMP(3),
    "acquisitionCost" DOUBLE PRECISION,
    "warrantyExpiry" TIMESTAMP(3),
    "notes" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitDocument" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DocType" NOT NULL,
    "url" TEXT NOT NULL,
    "fileSize" INTEGER,
    "unitId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnitDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingItemUnit" (
    "id" TEXT NOT NULL,
    "bookingItemId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "condition" TEXT,

    CONSTRAINT "BookingItemUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitMaintenance" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "type" "MaintenanceType" NOT NULL,
    "description" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "cost" DOUBLE PRECISION,
    "vendor" TEXT,
    "notes" TEXT,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceSchedule" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "intervalDays" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialTransaction" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "categoryId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceId" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringTransaction" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "categoryId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "intervalDays" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "nextDueDate" TIMESTAMP(3) NOT NULL,
    "status" "RecurrenceStatus" NOT NULL DEFAULT 'ACTIVE',
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "source" "LeadSource" NOT NULL DEFAULT 'DIRECT',
    "contactType" "ContactType" NOT NULL DEFAULT 'PRESENCIAL',
    "expectedValue" DOUBLE PRECISION,
    "interestNotes" TEXT,
    "nextAction" TEXT,
    "nextActionDate" TIMESTAMP(3),
    "lostReason" TEXT,
    "wonAt" TIMESTAMP(3),
    "lostAt" TIMESTAMP(3),
    "convertedCustomerId" TEXT,
    "tenantId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadActivity" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "photos" TEXT[],
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "leadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadEquipmentInterest" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,

    CONSTRAINT "LeadEquipmentInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_domain_key" ON "Tenant"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_asaasCustomerId_key" ON "Tenant"("asaasCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AutoLoginToken_token_key" ON "AutoLoginToken"("token");

-- CreateIndex
CREATE INDEX "AutoLoginToken_token_used_expiresAt_idx" ON "AutoLoginToken"("token", "used", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE INDEX "VerificationToken_token_type_used_expiresAt_idx" ON "VerificationToken"("token", "type", "used", "expiresAt");

-- CreateIndex
CREATE INDEX "VerificationToken_userId_type_idx" ON "VerificationToken"("userId", "type");

-- CreateIndex
CREATE INDEX "UserModulePermission_userId_idx" ON "UserModulePermission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserModulePermission_userId_module_key" ON "UserModulePermission"("userId", "module");

-- CreateIndex
CREATE INDEX "Equipment_tenantId_status_idx" ON "Equipment"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Equipment_tenantId_status_category_idx" ON "Equipment"("tenantId", "status", "category");

-- CreateIndex
CREATE INDEX "Equipment_tenantId_availableStock_idx" ON "Equipment"("tenantId", "availableStock");

-- CreateIndex
CREATE INDEX "RentalPeriod_equipmentId_idx" ON "RentalPeriod"("equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "RentalPeriod_equipmentId_days_key" ON "RentalPeriod"("equipmentId", "days");

-- CreateIndex
CREATE INDEX "Customer_tenantId_idx" ON "Customer"("tenantId");

-- CreateIndex
CREATE INDEX "Customer_cpfCnpj_idx" ON "Customer"("cpfCnpj");

-- CreateIndex
CREATE INDEX "Customer_tenantId_isActive_idx" ON "Customer"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "CustomerSite_customerId_idx" ON "CustomerSite"("customerId");

-- CreateIndex
CREATE INDEX "CustomerSite_customerId_isActive_idx" ON "CustomerSite"("customerId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingNumber_key" ON "Booking"("bookingNumber");

-- CreateIndex
CREATE INDEX "Booking_tenantId_status_idx" ON "Booking"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Booking_tenantId_status_startDate_idx" ON "Booking"("tenantId", "status", "startDate");

-- CreateIndex
CREATE INDEX "Booking_equipmentId_startDate_endDate_idx" ON "Booking"("equipmentId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "Booking_validUntil_idx" ON "Booking"("validUntil");

-- CreateIndex
CREATE INDEX "FreightRegion_tenantId_idx" ON "FreightRegion"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "FreightRegion_tenantId_name_key" ON "FreightRegion"("tenantId", "name");

-- CreateIndex
CREATE INDEX "BookingFee_bookingId_idx" ON "BookingFee"("bookingId");

-- CreateIndex
CREATE INDEX "ActivityLog_tenantId_createdAt_idx" ON "ActivityLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_createdAt_idx" ON "ActivityLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_entity_entityId_idx" ON "ActivityLog"("entity", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "ApiKey_tenantId_active_idx" ON "ApiKey"("tenantId", "active");

-- CreateIndex
CREATE INDEX "ApiKey_key_idx" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "Webhook_tenantId_active_idx" ON "Webhook"("tenantId", "active");

-- CreateIndex
CREATE INDEX "EquipmentCost_equipmentId_date_idx" ON "EquipmentCost"("equipmentId", "date");

-- CreateIndex
CREATE INDEX "EquipmentCost_tenantId_type_idx" ON "EquipmentCost"("tenantId", "type");

-- CreateIndex
CREATE INDEX "EquipmentDocument_equipmentId_idx" ON "EquipmentDocument"("equipmentId");

-- CreateIndex
CREATE INDEX "BookingDocument_bookingId_idx" ON "BookingDocument"("bookingId");

-- CreateIndex
CREATE INDEX "BookingItem_equipmentId_idx" ON "BookingItem"("equipmentId");

-- CreateIndex
CREATE INDEX "BookingItem_bookingId_idx" ON "BookingItem"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingItem_bookingId_equipmentId_key" ON "BookingItem"("bookingId", "equipmentId");

-- CreateIndex
CREATE INDEX "StockMovement_equipmentId_createdAt_idx" ON "StockMovement"("equipmentId", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_tenantId_createdAt_idx" ON "StockMovement"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_bookingId_idx" ON "StockMovement"("bookingId");

-- CreateIndex
CREATE INDEX "StockMovement_type_idx" ON "StockMovement"("type");

-- CreateIndex
CREATE UNIQUE INDEX "TenantFiscalConfig_tenantId_key" ON "TenantFiscalConfig"("tenantId");

-- CreateIndex
CREATE INDEX "TenantFiscalConfig_tenantId_idx" ON "TenantFiscalConfig"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_internalRef_key" ON "Invoice"("internalRef");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_status_idx" ON "Invoice"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Invoice_bookingId_idx" ON "Invoice"("bookingId");

-- CreateIndex
CREATE INDEX "Invoice_internalRef_idx" ON "Invoice"("internalRef");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_createdAt_idx" ON "Invoice"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_slug_key" ON "Plan"("slug");

-- CreateIndex
CREATE INDEX "Plan_active_sortOrder_idx" ON "Plan"("active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_tenantId_key" ON "Subscription"("tenantId");

-- CreateIndex
CREATE INDEX "Subscription_tenantId_idx" ON "Subscription"("tenantId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_nextBillingDate_idx" ON "Subscription"("nextBillingDate");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPayment_asaasPaymentId_key" ON "SubscriptionPayment"("asaasPaymentId");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_subscriptionId_idx" ON "SubscriptionPayment"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_status_idx" ON "SubscriptionPayment"("status");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_dueDate_idx" ON "SubscriptionPayment"("dueDate");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_asaasPaymentId_idx" ON "SubscriptionPayment"("asaasPaymentId");

-- CreateIndex
CREATE INDEX "EquipmentUnit_equipmentId_idx" ON "EquipmentUnit"("equipmentId");

-- CreateIndex
CREATE INDEX "EquipmentUnit_tenantId_status_idx" ON "EquipmentUnit"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentUnit_tenantId_serialNumber_key" ON "EquipmentUnit"("tenantId", "serialNumber");

-- CreateIndex
CREATE INDEX "UnitDocument_unitId_idx" ON "UnitDocument"("unitId");

-- CreateIndex
CREATE INDEX "BookingItemUnit_unitId_idx" ON "BookingItemUnit"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingItemUnit_bookingItemId_unitId_key" ON "BookingItemUnit"("bookingItemId", "unitId");

-- CreateIndex
CREATE INDEX "UnitMaintenance_unitId_idx" ON "UnitMaintenance"("unitId");

-- CreateIndex
CREATE INDEX "UnitMaintenance_scheduledDate_idx" ON "UnitMaintenance"("scheduledDate");

-- CreateIndex
CREATE INDEX "UnitMaintenance_status_idx" ON "UnitMaintenance"("status");

-- CreateIndex
CREATE INDEX "UnitMaintenance_tenantId_status_idx" ON "UnitMaintenance"("tenantId", "status");

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_tenantId_idx" ON "MaintenanceSchedule"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceSchedule_equipmentId_intervalDays_key" ON "MaintenanceSchedule"("equipmentId", "intervalDays");

-- CreateIndex
CREATE INDEX "TransactionCategory_tenantId_type_idx" ON "TransactionCategory"("tenantId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionCategory_tenantId_name_type_key" ON "TransactionCategory"("tenantId", "name", "type");

-- CreateIndex
CREATE INDEX "FinancialTransaction_tenantId_date_idx" ON "FinancialTransaction"("tenantId", "date");

-- CreateIndex
CREATE INDEX "FinancialTransaction_tenantId_status_idx" ON "FinancialTransaction"("tenantId", "status");

-- CreateIndex
CREATE INDEX "FinancialTransaction_tenantId_type_idx" ON "FinancialTransaction"("tenantId", "type");

-- CreateIndex
CREATE INDEX "FinancialTransaction_categoryId_idx" ON "FinancialTransaction"("categoryId");

-- CreateIndex
CREATE INDEX "FinancialTransaction_recurrenceId_idx" ON "FinancialTransaction"("recurrenceId");

-- CreateIndex
CREATE INDEX "RecurringTransaction_tenantId_status_idx" ON "RecurringTransaction"("tenantId", "status");

-- CreateIndex
CREATE INDEX "RecurringTransaction_tenantId_nextDueDate_idx" ON "RecurringTransaction"("tenantId", "nextDueDate");

-- CreateIndex
CREATE INDEX "Lead_tenantId_status_idx" ON "Lead"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Lead_tenantId_createdAt_idx" ON "Lead"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadActivity_leadId_idx" ON "LeadActivity"("leadId");

-- CreateIndex
CREATE INDEX "LeadActivity_tenantId_createdAt_idx" ON "LeadActivity"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadEquipmentInterest_equipmentId_idx" ON "LeadEquipmentInterest"("equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadEquipmentInterest_leadId_equipmentId_key" ON "LeadEquipmentInterest"("leadId", "equipmentId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoLoginToken" ADD CONSTRAINT "AutoLoginToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserModulePermission" ADD CONSTRAINT "UserModulePermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalPeriod" ADD CONSTRAINT "RentalPeriod_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnavailableDate" ADD CONSTRAINT "UnavailableDate_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSite" ADD CONSTRAINT "CustomerSite_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_freightRegionId_fkey" FOREIGN KEY ("freightRegionId") REFERENCES "FreightRegion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerSiteId_fkey" FOREIGN KEY ("customerSiteId") REFERENCES "CustomerSite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingFee" ADD CONSTRAINT "BookingFee_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentCost" ADD CONSTRAINT "EquipmentCost_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentCost" ADD CONSTRAINT "EquipmentCost_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentDocument" ADD CONSTRAINT "EquipmentDocument_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingDocument" ADD CONSTRAINT "BookingDocument_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingItem" ADD CONSTRAINT "BookingItem_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingItem" ADD CONSTRAINT "BookingItem_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantFiscalConfig" ADD CONSTRAINT "TenantFiscalConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentUnit" ADD CONSTRAINT "EquipmentUnit_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitDocument" ADD CONSTRAINT "UnitDocument_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "EquipmentUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingItemUnit" ADD CONSTRAINT "BookingItemUnit_bookingItemId_fkey" FOREIGN KEY ("bookingItemId") REFERENCES "BookingItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingItemUnit" ADD CONSTRAINT "BookingItemUnit_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "EquipmentUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitMaintenance" ADD CONSTRAINT "UnitMaintenance_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "EquipmentUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceSchedule" ADD CONSTRAINT "MaintenanceSchedule_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionCategory" ADD CONSTRAINT "TransactionCategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TransactionCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_recurrenceId_fkey" FOREIGN KEY ("recurrenceId") REFERENCES "RecurringTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTransaction" ADD CONSTRAINT "RecurringTransaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TransactionCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTransaction" ADD CONSTRAINT "RecurringTransaction_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTransaction" ADD CONSTRAINT "RecurringTransaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadEquipmentInterest" ADD CONSTRAINT "LeadEquipmentInterest_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadEquipmentInterest" ADD CONSTRAINT "LeadEquipmentInterest_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

