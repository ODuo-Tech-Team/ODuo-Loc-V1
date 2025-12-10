import { Metadata } from "next"
import { BarChart3 } from "lucide-react"
import { FeaturePageTemplate } from "@/components/site"

export const metadata: Metadata = {
  title: "Relatórios Avançados | ODuoLoc",
  description: "Análises profundas com gráficos interativos, KPIs de desempenho, exportação de dados e insights.",
  openGraph: {
    title: "Relatórios Avançados | ODuoLoc",
    description: "Tome decisões baseadas em dados com relatórios completos.",
  },
}

export default function RelatoriosPage() {
  return (
    <FeaturePageTemplate
      icon={BarChart3}
      title="Relatórios Avançados"
      subtitle="Dados para decisões inteligentes"
      description="Análises profundas com gráficos interativos, KPIs de desempenho, comparativos de período e exportação de dados. Tome decisões estratégicas baseadas em dados reais do seu negócio."
      screenshotPlaceholder="Tela de relatórios e gráficos"
      features={[
        {
          title: "Dashboard com KPIs",
          description: "Visão geral com os principais indicadores: faturamento, ocupação, ticket médio, clientes ativos."
        },
        {
          title: "Gráficos Interativos",
          description: "Gráficos de linha, barra, pizza e área com filtros dinâmicos e drill-down."
        },
        {
          title: "Relatórios Personalizados",
          description: "Crie relatórios customizados com os campos e filtros que você precisa."
        },
        {
          title: "Comparativo de Períodos",
          description: "Compare o desempenho entre períodos: mês atual vs anterior, ano vs ano, etc."
        },
        {
          title: "Exportação em Excel/PDF",
          description: "Exporte qualquer relatório em Excel para análise ou PDF para apresentações."
        },
        {
          title: "Relatórios por Equipamento",
          description: "Analise o desempenho individual de cada equipamento: receita, ocupação, custo."
        }
      ]}
      benefits={[
        "Decisões baseadas em dados",
        "Identificação de tendências",
        "Otimização da operação",
        "Visão de rentabilidade",
        "Exportação para contabilidade",
        "Acompanhamento de metas"
      ]}
      availableIn={["professional", "enterprise"]}
      faqs={[
        {
          question: "Quais KPIs estão disponíveis?",
          answer: "Faturamento, ticket médio, taxa de ocupação, equipamentos mais locados, clientes mais ativos, e muitos outros."
        },
        {
          question: "Posso criar meus próprios relatórios?",
          answer: "Sim, o sistema permite criar relatórios personalizados selecionando campos, filtros e agrupamentos."
        },
        {
          question: "Os relatórios atualizam em tempo real?",
          answer: "Sim, os dados são atualizados automaticamente conforme novas reservas e transações são registradas."
        },
        {
          question: "Posso agendar envio de relatórios?",
          answer: "Sim, você pode configurar o envio automático de relatórios por email em frequência definida."
        }
      ]}
      relatedModules={[
        {
          title: "Financeiro",
          href: "/funcionalidades/financeiro",
          description: "Dados financeiros para análise"
        },
        {
          title: "Reservas",
          href: "/funcionalidades/reservas",
          description: "Dados de reservas e ocupação"
        },
        {
          title: "Equipamentos",
          href: "/funcionalidades/equipamentos",
          description: "Performance por equipamento"
        }
      ]}
    />
  )
}
