import { Metadata } from "next"
import { Target } from "lucide-react"
import { FeaturePageTemplate } from "@/components/site"

export const metadata: Metadata = {
  title: "CRM e Comercial | ODuoLoc",
  description: "Gestão de leads e oportunidades com funil de vendas, pipeline comercial e acompanhamento de conversões.",
  openGraph: {
    title: "CRM e Comercial | ODuoLoc",
    description: "Gerencie suas oportunidades de venda e converta mais clientes.",
  },
}

export default function ComercialPage() {
  return (
    <FeaturePageTemplate
      icon={Target}
      title="CRM e Comercial"
      subtitle="Converta leads em clientes"
      description="Gestão completa de leads e oportunidades comerciais. Com funil de vendas visual, pipeline comercial, histórico de interações e acompanhamento de conversões."
      screenshotPlaceholder="Tela do módulo CRM"
      features={[
        {
          title: "Cadastro de Leads",
          description: "Registre potenciais clientes com informações de contato, interesse e origem."
        },
        {
          title: "Funil de Vendas Visual",
          description: "Acompanhe visualmente cada lead através das etapas do seu processo comercial."
        },
        {
          title: "Pipeline Comercial",
          description: "Gerencie oportunidades em diferentes estágios: prospecção, qualificação, proposta, negociação, fechamento."
        },
        {
          title: "Histórico de Interações",
          description: "Registre todas as interações com cada lead: ligações, emails, reuniões, mensagens."
        },
        {
          title: "Interesse em Equipamentos",
          description: "Vincule leads aos equipamentos de interesse para abordagens mais direcionadas."
        },
        {
          title: "Conversão para Cliente",
          description: "Converta leads em clientes com um clique, mantendo todo o histórico."
        }
      ]}
      benefits={[
        "Visão clara do pipeline comercial",
        "Aumento na taxa de conversão",
        "Nenhum lead esquecido",
        "Histórico completo de interações",
        "Abordagem comercial direcionada",
        "Relatórios de desempenho comercial"
      ]}
      availableIn={["professional", "enterprise"]}
      faqs={[
        {
          question: "Posso customizar as etapas do funil?",
          answer: "Sim, você pode criar e personalizar as etapas do funil de acordo com o processo comercial da sua empresa."
        },
        {
          question: "Como capturar leads automaticamente?",
          answer: "Você pode integrar formulários do seu site ou receber leads via API para cadastro automático."
        },
        {
          question: "O sistema envia lembretes de follow-up?",
          answer: "Sim, você pode configurar tarefas e lembretes para cada lead para não perder oportunidades."
        },
        {
          question: "Consigo ver métricas de conversão?",
          answer: "Sim, o módulo de relatórios mostra taxa de conversão por etapa, tempo médio no funil e outras métricas."
        }
      ]}
      relatedModules={[
        {
          title: "Clientes",
          href: "/funcionalidades/clientes",
          description: "Destino dos leads convertidos"
        },
        {
          title: "Reservas",
          href: "/funcionalidades/reservas",
          description: "Crie reservas para leads qualificados"
        },
        {
          title: "Relatórios",
          href: "/funcionalidades/relatorios",
          description: "Análise de performance comercial"
        }
      ]}
    />
  )
}
