import { Metadata } from "next"
import { Target } from "lucide-react"
import { FeaturePageTemplate } from "@/components/site"

export const metadata: Metadata = {
  title: "CRM e Comercial | ODuoLoc",
  description: "Gestao de leads e oportunidades com funil de vendas, pipeline comercial e acompanhamento de conversoes.",
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
      description="Gestao completa de leads e oportunidades comerciais. Com funil de vendas visual, pipeline comercial, historico de interacoes e acompanhamento de conversoes."
      screenshotPlaceholder="Tela do modulo CRM"
      features={[
        {
          title: "Cadastro de Leads",
          description: "Registre potenciais clientes com informacoes de contato, interesse e origem."
        },
        {
          title: "Funil de Vendas Visual",
          description: "Acompanhe visualmente cada lead atraves das etapas do seu processo comercial."
        },
        {
          title: "Pipeline Comercial",
          description: "Gerencie oportunidades em diferentes estagios: prospeccao, qualificacao, proposta, negociacao, fechamento."
        },
        {
          title: "Historico de Interacoes",
          description: "Registre todas as interacoes com cada lead: ligacoes, emails, reunioes, mensagens."
        },
        {
          title: "Interesse em Equipamentos",
          description: "Vincule leads aos equipamentos de interesse para abordagens mais direcionadas."
        },
        {
          title: "Conversao para Cliente",
          description: "Converta leads em clientes com um clique, mantendo todo o historico."
        }
      ]}
      benefits={[
        "Visao clara do pipeline comercial",
        "Aumento na taxa de conversao",
        "Nenhum lead esquecido",
        "Historico completo de interacoes",
        "Abordagem comercial direcionada",
        "Relatorios de desempenho comercial"
      ]}
      availableIn={["professional", "enterprise"]}
      faqs={[
        {
          question: "Posso customizar as etapas do funil?",
          answer: "Sim, voce pode criar e personalizar as etapas do funil de acordo com o processo comercial da sua empresa."
        },
        {
          question: "Como capturar leads automaticamente?",
          answer: "Voce pode integrar formularios do seu site ou receber leads via API para cadastro automatico."
        },
        {
          question: "O sistema envia lembretes de follow-up?",
          answer: "Sim, voce pode configurar tarefas e lembretes para cada lead para nao perder oportunidades."
        },
        {
          question: "Consigo ver metricas de conversao?",
          answer: "Sim, o modulo de relatorios mostra taxa de conversao por etapa, tempo medio no funil e outras metricas."
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
          title: "Relatorios",
          href: "/funcionalidades/relatorios",
          description: "Analise de performance comercial"
        }
      ]}
    />
  )
}
