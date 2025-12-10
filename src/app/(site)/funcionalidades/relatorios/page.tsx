import { Metadata } from "next"
import { BarChart3 } from "lucide-react"
import { FeaturePageTemplate } from "@/components/site"

export const metadata: Metadata = {
  title: "Relatorios Avancados | ODuoLoc",
  description: "Analises profundas com graficos interativos, KPIs de desempenho, exportacao de dados e insights.",
  openGraph: {
    title: "Relatorios Avancados | ODuoLoc",
    description: "Tome decisoes baseadas em dados com relatorios completos.",
  },
}

export default function RelatoriosPage() {
  return (
    <FeaturePageTemplate
      icon={BarChart3}
      title="Relatorios Avancados"
      subtitle="Dados para decisoes inteligentes"
      description="Analises profundas com graficos interativos, KPIs de desempenho, comparativos de periodo e exportacao de dados. Tome decisoes estrategicas baseadas em dados reais do seu negocio."
      screenshotPlaceholder="Tela de relatorios e graficos"
      features={[
        {
          title: "Dashboard com KPIs",
          description: "Visao geral com os principais indicadores: faturamento, ocupacao, ticket medio, clientes ativos."
        },
        {
          title: "Graficos Interativos",
          description: "Graficos de linha, barra, pizza e area com filtros dinamicos e drill-down."
        },
        {
          title: "Relatorios Personalizados",
          description: "Crie relatorios customizados com os campos e filtros que voce precisa."
        },
        {
          title: "Comparativo de Periodos",
          description: "Compare o desempenho entre periodos: mes atual vs anterior, ano vs ano, etc."
        },
        {
          title: "Exportacao em Excel/PDF",
          description: "Exporte qualquer relatorio em Excel para analise ou PDF para apresentacoes."
        },
        {
          title: "Relatorios por Equipamento",
          description: "Analise o desempenho individual de cada equipamento: receita, ocupacao, custo."
        }
      ]}
      benefits={[
        "Decisoes baseadas em dados",
        "Identificacao de tendencias",
        "Otimizacao da operacao",
        "Visao de rentabilidade",
        "Exportacao para contabilidade",
        "Acompanhamento de metas"
      ]}
      availableIn={["professional", "enterprise"]}
      faqs={[
        {
          question: "Quais KPIs estao disponiveis?",
          answer: "Faturamento, ticket medio, taxa de ocupacao, equipamentos mais locados, clientes mais ativos, e muitos outros."
        },
        {
          question: "Posso criar meus proprios relatorios?",
          answer: "Sim, o sistema permite criar relatorios personalizados selecionando campos, filtros e agrupamentos."
        },
        {
          question: "Os relatorios atualizam em tempo real?",
          answer: "Sim, os dados sao atualizados automaticamente conforme novas reservas e transacoes sao registradas."
        },
        {
          question: "Posso agendar envio de relatorios?",
          answer: "Sim, voce pode configurar o envio automatico de relatorios por email em frequencia definida."
        }
      ]}
      relatedModules={[
        {
          title: "Financeiro",
          href: "/funcionalidades/financeiro",
          description: "Dados financeiros para analise"
        },
        {
          title: "Reservas",
          href: "/funcionalidades/reservas",
          description: "Dados de reservas e ocupacao"
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
