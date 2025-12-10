import { Metadata } from "next"
import { CreditCard } from "lucide-react"
import { FeaturePageTemplate } from "@/components/site"

export const metadata: Metadata = {
  title: "Módulo Financeiro | ODuoLoc",
  description: "Controle financeiro completo com contas a pagar e receber, fluxo de caixa, categorias e relatórios.",
  openGraph: {
    title: "Módulo Financeiro | ODuoLoc",
    description: "Tenha controle total das finanças da sua locadora.",
  },
}

export default function FinanceiroPage() {
  return (
    <FeaturePageTemplate
      icon={CreditCard}
      title="Módulo Financeiro"
      subtitle="Finanças sob controle"
      description="Controle financeiro completo para sua locadora. Gerencie contas a pagar e receber, acompanhe o fluxo de caixa, categorize transações e tenha relatórios detalhados para tomada de decisão."
      screenshotPlaceholder="Tela do módulo financeiro"
      features={[
        {
          title: "Contas a Receber",
          description: "Acompanhe todos os recebimentos previstos, vencidos e pagos. Vinculados automaticamente às reservas."
        },
        {
          title: "Contas a Pagar",
          description: "Gerencie despesas fixas e variáveis, fornecedores, impostos e outras obrigações."
        },
        {
          title: "Fluxo de Caixa",
          description: "Visualize a projeção de entradas e saídas. Antecipe problemas de caixa."
        },
        {
          title: "Categorias de Transações",
          description: "Organize receitas e despesas em categorias para análise detalhada."
        },
        {
          title: "Conciliação Bancária",
          description: "Compare os lançamentos do sistema com o extrato bancário."
        },
        {
          title: "Relatórios Financeiros",
          description: "DRE, balanço, fluxo de caixa e outros relatórios para gestão financeira."
        }
      ]}
      benefits={[
        "Visão clara das finanças",
        "Previsibilidade de caixa",
        "Redução de inadimplência",
        "Controle de despesas",
        "Relatórios para tomada de decisão",
        "Integração com reservas"
      ]}
      availableIn={["professional", "enterprise"]}
      faqs={[
        {
          question: "As reservas geram lançamentos automáticos?",
          answer: "Sim, ao confirmar uma reserva, o sistema cria automaticamente o lançamento de conta a receber."
        },
        {
          question: "Posso registrar despesas recorrentes?",
          answer: "Sim, você pode cadastrar despesas que se repetem mensalmente como aluguel, salários, etc."
        },
        {
          question: "O sistema integra com bancos?",
          answer: "No momento, a conciliação é manual através de importação de extrato. Integrações bancárias estão no roadmap."
        },
        {
          question: "Consigo emitir boletos pelo sistema?",
          answer: "A emissão de boletos depende de integração com seu banco ou gateway de pagamento, que pode ser configurada."
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
          description: "Emissão de NFS-e para recebimentos"
        },
        {
          title: "Relatórios",
          href: "/funcionalidades/relatorios",
          description: "Análises financeiras avançadas"
        }
      ]}
    />
  )
}
