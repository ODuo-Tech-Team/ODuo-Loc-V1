# ODuoLoc - Documentação de Entregáveis

## Sistema de Gestão de Locação de Equipamentos

**Versão:** 1.0
**Data:** Novembro 2024
**Status:** Produção

---

## Índice

1. [Dashboard & Visão Geral](#1-dashboard--visão-geral)
2. [Gestão de Equipamentos](#2-gestão-de-equipamentos)
3. [Gestão de Clientes](#3-gestão-de-clientes)
4. [Gestão de Orçamentos/Reservas](#4-gestão-de-orçamentosreservas)
5. [Módulo de Estoque](#5-módulo-de-estoque)
6. [Módulo Financeiro](#6-módulo-financeiro)
7. [Notas Fiscais (NFSe)](#7-notas-fiscais-nfse)
8. [Configurações](#8-configurações)
9. [Gestão de Usuários](#9-gestão-de-usuários)
10. [Notificações](#10-notificações)
11. [Busca Global](#11-busca-global)
12. [Integrações](#12-integrações)
13. [Área do Super Admin](#13-área-do-super-admin)
14. [Autenticação & Segurança](#14-autenticação--segurança)
15. [Landing Page](#15-landing-page)
16. [Tecnologias Utilizadas](#16-tecnologias-utilizadas)
17. [Resumo Quantitativo](#17-resumo-quantitativo)

---

## 1. Dashboard & Visão Geral

| Funcionalidade | Descrição |
|----------------|-----------|
| Cards de métricas | Equipamentos, Clientes, Reservas Ativas, Receita Mensal |
| Reservas recentes | Lista com status em tempo real |
| Ações rápidas | Nova Reserva, Novo Cliente, Novo Equipamento |
| Resumo de disponibilidade | Visão geral do estoque |

**Arquivos principais:**
- `src/app/(admin)/dashboard/page.tsx`
- `src/app/api/dashboard/stats/route.ts`

---

## 2. Gestão de Equipamentos

| Funcionalidade | Descrição |
|----------------|-----------|
| CRUD completo | Criar, editar, visualizar e excluir |
| Campos | Nome, Categoria, Descrição, Preço/Hora, Preço/Dia, Quantidade, Imagens |
| Status | Disponível, Alugado, Manutenção, Inativo |
| Upload de imagens | Integração com Cloudinary |
| Documentos | Upload de manuais, garantias, certificados, notas fiscais |
| Financeiro por equipamento | Custos, depreciação, rentabilidade |
| Períodos personalizados | Hora, dia, semana, mês |
| Controle de estoque | Total, disponível, reservado, manutenção, danificado |

**Arquivos principais:**
- `src/app/(admin)/equipamentos/page.tsx` - Listagem
- `src/app/(admin)/equipamentos/novo/page.tsx` - Criação
- `src/app/(admin)/equipamentos/[id]/page.tsx` - Edição
- `src/app/(admin)/equipamentos/[id]/documentos/page.tsx` - Documentos
- `src/app/(admin)/equipamentos/[id]/financeiro/page.tsx` - Financeiro
- `src/app/api/equipments/` - APIs

---

## 3. Gestão de Clientes

| Funcionalidade | Descrição |
|----------------|-----------|
| CRUD completo | Criar, editar, visualizar e excluir |
| Campos | Nome, Email, Telefone, CPF/CNPJ, Endereço completo, Observações |
| Locais de obra | Múltiplos endereços por cliente |
| Busca por CEP | Auto-preenchimento de endereço |
| Busca por CNPJ | Auto-preenchimento de dados da empresa |
| Histórico | Visualização de orçamentos anteriores |
| Proteção | Não permite excluir clientes com reservas ativas |

**Arquivos principais:**
- `src/app/(admin)/clientes/page.tsx` - Listagem
- `src/app/(admin)/clientes/novo/page.tsx` - Criação
- `src/app/(admin)/clientes/[id]/page.tsx` - Edição
- `src/app/api/customers/` - APIs
- `src/components/customers/customer-sites-list.tsx` - Locais de obra

---

## 4. Gestão de Orçamentos/Reservas

| Funcionalidade | Descrição |
|----------------|-----------|
| CRUD completo | Criar, editar, visualizar e cancelar |
| Status | Pendente, Confirmado, Concluído, Cancelado |
| Múltiplos itens | Vários equipamentos por orçamento |
| Verificação automática | Conflito de datas e disponibilidade |
| Calendário visual | Integração FullCalendar |
| Geração de documentos | Contrato, recibo |
| Devolução | Processamento com status (devolvido, danificado, perdido) |

**Arquivos principais:**
- `src/app/(admin)/reservas/page.tsx` - Listagem
- `src/app/(admin)/reservas/novo/page.tsx` - Criação
- `src/app/(admin)/reservas/[id]/page.tsx` - Edição
- `src/app/(admin)/calendario/page.tsx` - Calendário
- `src/app/api/bookings/` - APIs

---

## 5. Módulo de Estoque

| Funcionalidade | Descrição |
|----------------|-----------|
| Visão em tempo real | Quantidade por status |
| Movimentações | Histórico completo de entradas/saídas |
| Motivos | Locação, Devolução, Dano, Manutenção, Ajuste |
| Alertas | Notificação de estoque baixo |
| Ajustes | Correções manuais com justificativa |

**Arquivos principais:**
- `src/app/(admin)/estoque/page.tsx` - Visão geral
- `src/app/(admin)/estoque/[id]/page.tsx` - Detalhes
- `src/app/api/stock/` - APIs
- `src/components/stock/` - Componentes

---

## 6. Módulo Financeiro

| Funcionalidade | Descrição |
|----------------|-----------|
| Receitas e Despesas | Registro completo |
| Categorias | Personalizáveis por tipo |
| Status | Pago, Pendente, Vencido |
| Transações recorrentes | Configuração automática |
| Pausar/Retomar | Controle de recorrências |
| DRE | Demonstrativo de resultado |
| Rentabilidade | Análise por equipamento |
| Métodos de pagamento | Registro por transação |

**Arquivos principais:**
- `src/app/(admin)/financeiro/page.tsx`
- `src/app/api/financial/` - APIs
- `src/components/financial/` - Componentes

---

## 7. Notas Fiscais (NFSe)

| Funcionalidade | Descrição |
|----------------|-----------|
| Emissão integrada | Um clique após orçamento |
| NFSe Nacional | Padrão federal |
| Status | Acompanhamento em tempo real |
| Reenvio | Email automático ao cliente |
| Configuração fiscal | CNPJ, IE, IM, Regime tributário |
| Certificado digital | Suporte A1 (.pfx) |

**Arquivos principais:**
- `src/app/(admin)/notas-fiscais/page.tsx`
- `src/app/(admin)/configuracoes/fiscal/page.tsx`
- `src/app/api/fiscal/` - APIs
- `src/lib/fiscal/` - Serviços

**Documentação adicional:**
- [DEPLOY_FINAL_NFSE.md](./DEPLOY_FINAL_NFSE.md)
- [GUIA_ATUALIZAR_CODIGO.md](./GUIA_ATUALIZAR_CODIGO.md)

---

## 8. Configurações

| Funcionalidade | Descrição |
|----------------|-----------|
| Dados da empresa | Nome, Email, Telefone, Endereço |
| Logo | Upload e personalização |
| Cor primária | Customização visual |
| Configurações fiscais | CNPJ, IE, IM, Código município |
| Regime tributário | Simples, Lucro Presumido, Lucro Real, MEI |
| Templates | Editor WYSIWYG para contratos e recibos |
| Variáveis dinâmicas | Substituição automática de dados |

**Arquivos principais:**
- `src/app/(admin)/configuracoes/page.tsx` - Geral
- `src/app/(admin)/configuracoes/fiscal/page.tsx` - Fiscal
- `src/app/(admin)/configuracoes/templates/page.tsx` - Templates
- `src/app/(admin)/configuracoes/integracoes/page.tsx` - Integrações
- `src/components/templates/` - Editor de templates

---

## 9. Gestão de Usuários

| Funcionalidade | Descrição |
|----------------|-----------|
| Multi-usuário | Vários usuários por conta |
| Perfis | Admin, Gerente, Operador, Visualizador |
| Ativação/Desativação | Controle de acesso |
| Verificação de email | Segurança adicional |

**Arquivos principais:**
- `src/app/(admin)/usuarios/page.tsx` - Listagem
- `src/app/(admin)/usuarios/novo/page.tsx` - Criação
- `src/app/(admin)/usuarios/[id]/page.tsx` - Edição

---

## 10. Notificações

| Funcionalidade | Descrição |
|----------------|-----------|
| Central de notificações | Painel lateral |
| Filtros | Todas / Somente não lidas |
| Ações | Marcar como lida, Marcar todas, Excluir |
| Indicadores visuais | Badge com contagem |
| Scroll customizado | Mesma estética do sidebar |

**Arquivos principais:**
- `src/components/admin/header.tsx` - Painel de notificações
- `src/app/api/notifications/` - APIs

---

## 11. Busca Global

| Funcionalidade | Descrição |
|----------------|-----------|
| Busca unificada | Equipamentos, Clientes, Orçamentos |
| Atalho | Ctrl+K |
| Resultados categorizados | Com ícones e status |

**Arquivos principais:**
- `src/components/admin/header.tsx` - Barra de busca
- `src/app/api/search/route.ts` - API de busca

---

## 12. Integrações

| Integração | Funcionalidade |
|------------|----------------|
| **Asaas** | Pagamentos PIX, boleto, cartão |
| **Cloudinary** | Armazenamento de imagens e documentos |
| **Focus NFe** | Emissão de NFSe |
| **ViaCEP** | Busca de endereço por CEP |
| **Resend** | Envio de emails transacionais |
| **API Keys** | Geração de chaves para integração externa |
| **Webhooks** | Notificações para sistemas externos |

**Arquivos principais:**
- `src/lib/asaas/` - Cliente Asaas
- `src/lib/fiscal/` - Focus NFe
- `src/lib/cep-service.ts` - ViaCEP
- `src/lib/email.ts` - Resend
- `src/app/api/integrations/` - APIs

---

## 13. Área do Super Admin

| Funcionalidade | Descrição |
|----------------|-----------|
| Dashboard geral | Métricas de todos os tenants |
| Gestão de tenants | Criar, editar, ativar/desativar |
| Módulos por tenant | Habilitar/desabilitar funcionalidades |
| Assinaturas | Controle de planos e vencimentos |
| Usuários globais | Visão de todos os usuários |
| Logs de atividade | Auditoria completa |

**Arquivos principais:**
- `src/app/super-admin/page.tsx` - Dashboard
- `src/app/super-admin/tenants/` - Gestão de tenants
- `src/app/super-admin/users/` - Gestão de usuários
- `src/app/api/super-admin/` - APIs

---

## 14. Autenticação & Segurança

| Funcionalidade | Descrição |
|----------------|-----------|
| Login seguro | Email + senha com hash bcrypt |
| Recuperação de senha | Via email |
| Verificação de email | Token de confirmação |
| Sessões | NextAuth v5 com JWT |
| Multi-tenancy | Isolamento completo de dados |

**Arquivos principais:**
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/cadastro/page.tsx`
- `src/app/(auth)/recuperar-senha/page.tsx`
- `src/app/(auth)/redefinir-senha/page.tsx`
- `src/lib/auth.ts` - Configuração NextAuth

---

## 15. Landing Page

| Funcionalidade | Descrição |
|----------------|-----------|
| Hero section | Design moderno com gradientes |
| Seção de features | 6 funcionalidades principais |
| Planos e preços | 3 opções (Starter, Professional, Enterprise) |
| Depoimentos | Social proof |
| Responsivo | Mobile e desktop |

**Arquivos principais:**
- `src/app/page.tsx`

---

## 16. Tecnologias Utilizadas

### Frontend

| Tecnologia | Uso |
|------------|-----|
| Next.js 16 | Framework React |
| TypeScript | Tipagem estática |
| Tailwind CSS 4 | Estilização |
| shadcn/ui | Componentes UI |
| Radix UI | Componentes acessíveis |
| Lucide Icons | Ícones |
| React Hook Form | Formulários |
| Zod | Validação |
| FullCalendar | Calendário |
| TipTap | Editor WYSIWYG |
| Recharts | Gráficos |
| Sonner | Notificações toast |

### Backend

| Tecnologia | Uso |
|------------|-----|
| Next.js API Routes | Endpoints REST |
| Prisma ORM | Banco de dados |
| PostgreSQL | Database |
| NextAuth v5 | Autenticação |
| Upstash Redis | Cache |

### Serviços Externos

| Serviço | Uso |
|---------|-----|
| Asaas | Gateway de pagamento |
| Cloudinary | CDN de imagens |
| Focus NFe | Emissão fiscal |
| Resend | Envio de emails |
| Sentry | Monitoramento de erros |

---

## 17. Resumo Quantitativo

| Métrica | Quantidade |
|---------|------------|
| Páginas Admin | 35+ |
| Endpoints API | 89 |
| Componentes UI | 30+ |
| Modelos de dados | 15+ |
| Integrações | 7 |
| Perfis de usuário | 5 |

---

## Módulos Disponíveis por Plano

Cada tenant pode ter os seguintes módulos habilitados/desabilitados:

| Módulo | Descrição |
|--------|-----------|
| `stockEnabled` | Gestão de estoque |
| `financialEnabled` | Módulo financeiro |
| `nfseEnabled` | Emissão de NFSe |
| `reportsEnabled` | Relatórios avançados |
| `apiEnabled` | Acesso à API externa |
| `webhooksEnabled` | Webhooks de integração |
| `multiUserEnabled` | Múltiplos usuários |
| `customDomainsEnabled` | Domínio personalizado |

---

## Status

**Sistema completo, testado e pronto para uso em produção.**

---

*Última atualização: Novembro 2024*
