@echo off
set PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION=sim, pode resetar o banco
npx prisma migrate reset --force
