import { Metadata } from "next"
import { CreditCard } from "lucide-react"
import { FeaturePageTemplate } from "@/components/site"

export const metadata: Metadata = {
  title: "Modulo Financeiro | ODuoLoc",
  description: "Controle financeiro completo com contas a pagar e receber, fluxo de caixa, categorias e relatorios.",
  openGraph: {
    title: "Modulo Financeiro | ODuoLoc",
    description: "Tenha controle total das financas da sua locadora.",
  },
}

export default function FinanceiroPage() {
  return (
    <FeaturePageTemplate
      icon={CreditCard}
      title="Modulo Financeiro"
      subtitle="Financas sob controle"
      description="Controle financeiro completo para sua locadora. Gerencie contas a pagar e receber, acompanhe o fluxo de caixa, categorize transacoes e tenha relatorios detalhados para tomada de decisao."
      screenshotPlaceholder="Tela do modulo financeiro"
      features={[
        {
          title: "Contas a Receber",
          description: "Acompanhe todos os recebimentos previstos, vencidos e pagos. Vinculados automaticamente as reservas."
        },
        {
          title: "Contas a Pagar",
          description: "Gerencie despesas fixas e variaveis, fornecedores, impostos e outras obrigacoes."
        },
        {
          title: "Fluxo de Caixa",
          description: "Visualize a projecao de entradas e saidas. Antecipe problemas de caixa."
        },
        {
          title: "Categorias de Transacoes",
          description: "Organize receitas e despesas em categorias para analise detalhada."
        },
        {
          title: "Conciliacao Bancaria",
          description: "Compare os lancamentos do sistema com o extrato bancario."
        },
        {
          title: "Relatorios Financeiros",
          description: "DRE, balanco, fluxo de caixa e outros relatorios para gestao financeira."
        }
      ]}
      benefits={[
        "Visao clara das financas",
        "Previsibilidade de caixa",
        "Reducao de inadimplencia",
        "Controle de despesas",
        "Relatorios para tomada de decisao",
        "Integracao com reservas"
      ]}
      availableIn={["professional", "enterprise"]}
      faqs={[
        {
          question: "As reservas geram lancamentos automaticos?",
          answer: "Sim, ao confirmar uma reserva, o sistema cria automaticamente o lancamento de conta a receber."
        },
        {
          question: "Posso registrar despesas recorrentes?",
          answer: "Sim, voce pode cadastrar despesas que se repetem mensalmente como aluguel, salarios, etc."
        },
        {
          question: "O sistema integra com bancos?",
          answer: "No momento, a conciliacao e manual atraves de importacao de extrato. Integracoes bancarias estao no roadmap."
        },
        {
          question: "Consigo emitir boletos pelo sistema?",
          answer: "A emissao de boletos depende de integracao com seu banco ou gateway de pagamento, que pode ser configurada."
        }
      ]}
      relatedModules={[
        {
          title: "Reservas",
          href: "/funcionalidades/reservas",
          description: "Origem dos recebimentos"
        },
        {
          title: "Notas Fiscais",
          href: "/funcionalidades/notas-fiscais",
          description: "Emissao de NFS-e para recebimentos"
        },
        {
          title: "Relatorios",
          href: "/funcionalidades/relatorios",
          description: "Analises financeiras avancadas"
        }
      ]}
    />
  )
}
