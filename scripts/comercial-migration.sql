-- =====================================================
-- MÓDULO COMERCIAL (CRM) - Script de Migração
-- Execute no SQL Editor do Supabase
-- =====================================================

-- Enums para o módulo comercial
DO $$ BEGIN
    CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "LeadSource" AS ENUM ('DIRECT', 'REFERRAL', 'WEBSITE', 'COLD_CALL', 'SOCIAL_MEDIA', 'EVENT', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ContactType" AS ENUM ('PRESENCIAL', 'ONLINE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ActivityType" AS ENUM ('VISIT', 'CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'PROPOSAL', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela de Leads (Prospectos)
CREATE TABLE IF NOT EXISTS "Lead" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- Tabela de Atividades do Lead
CREATE TABLE IF NOT EXISTS "LeadActivity" (
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

-- Tabela de Interesse em Equipamentos
CREATE TABLE IF NOT EXISTS "LeadEquipmentInterest" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,

    CONSTRAINT "LeadEquipmentInterest_pkey" PRIMARY KEY ("id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "Lead_tenantId_status_idx" ON "Lead"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "Lead_tenantId_createdAt_idx" ON "Lead"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "LeadActivity_leadId_idx" ON "LeadActivity"("leadId");
CREATE INDEX IF NOT EXISTS "LeadActivity_tenantId_createdAt_idx" ON "LeadActivity"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "LeadEquipmentInterest_equipmentId_idx" ON "LeadEquipmentInterest"("equipmentId");

-- Unique constraints
DO $$ BEGIN
    ALTER TABLE "LeadEquipmentInterest" ADD CONSTRAINT "LeadEquipmentInterest_leadId_equipmentId_key" UNIQUE ("leadId", "equipmentId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Foreign Keys
DO $$ BEGIN
    ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "LeadEquipmentInterest" ADD CONSTRAINT "LeadEquipmentInterest_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "LeadEquipmentInterest" ADD CONSTRAINT "LeadEquipmentInterest_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- SCRIPT EXECUTADO COM SUCESSO!
-- Tabelas criadas: Lead, LeadActivity, LeadEquipmentInterest
-- =====================================================
