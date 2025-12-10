import { Metadata } from "next"
import { CalendarDays } from "lucide-react"
import { FeaturePageTemplate } from "@/components/site"

export const metadata: Metadata = {
  title: "Calendario Integrado | ODuoLoc",
  description: "Visualize todas as reservas em um calendario intuitivo com diferentes visualizacoes e filtros avancados.",
  openGraph: {
    title: "Calendario Integrado | ODuoLoc",
    description: "Tenha visao completa da agenda da sua locadora.",
  },
}

export default function CalendarioPage() {
  return (
    <FeaturePageTemplate
      icon={CalendarDays}
      title="Calendario Integrado"
      subtitle="Visao completa da sua agenda"
      description="Visualize todas as reservas em um calendario intuitivo. Com diferentes modos de visualizacao, filtros por equipamento ou cliente, e funcionalidade de arrastar e soltar para reagendar."
      screenshotPlaceholder="Tela do calendario de reservas"
      features={[
        {
          title: "Visualizacao Diaria",
          description: "Veja todas as reservas do dia com horarios detalhados de inicio e fim."
        },
        {
          title: "Visualizacao Semanal",
          description: "Planeje a semana com visao de todos os dias e suas respectivas reservas."
        },
        {
          title: "Visualizacao Mensal",
          description: "Tenha uma visao geral do mes com indicadores de ocupacao por dia."
        },
        {
          title: "Filtros Avancados",
          description: "Filtre por equipamento, cliente, status ou categoria para encontrar rapidamente o que precisa."
        },
        {
          title: "Cores por Status",
          description: "Identifique rapidamente o status de cada reserva atraves de cores diferenciadas."
        },
        {
          title: "Drag and Drop",
          description: "Arraste e solte reservas para reagendar rapidamente quando necessario."
        }
      ]}
      benefits={[
        "Visao clara de toda a agenda",
        "Identificacao rapida de conflitos",
        "Otimizacao da ocupacao",
        "Reagendamento facil e rapido",
        "Planejamento de manutencoes",
        "Melhor atendimento ao cliente"
      ]}
      availableIn={["starter", "professional", "enterprise"]}
      faqs={[
        {
          question: "Posso exportar o calendario?",
          answer: "Sim, voce pode exportar a agenda em formato iCal para sincronizar com Google Calendar, Outlook ou outros aplicativos."
        },
        {
          question: "O calendario mostra manutencoes programadas?",
          answer: "Sim, voce pode visualizar reservas, manutencoes e outros eventos no mesmo calendario."
        },
        {
          question: "E possivel ver apenas os equipamentos de uma categoria?",
          answer: "Sim, os filtros permitem visualizar apenas equipamentos de categorias especificas."
        },
        {
          question: "O calendario atualiza em tempo real?",
          answer: "Sim, qualquer alteracao feita por outro usuario e refletida automaticamente no calendario."
        }
      ]}
      relatedModules={[
        {
          title: "Reservas",
          href: "/funcionalidades/reservas",
          description: "Crie e gerencie suas reservas"
        },
        {
          title: "Equipamentos",
          href: "/funcionalidades/equipamentos",
          description: "Catalogo de equipamentos disponiveis"
        },
        {
          title: "Estoque",
          href: "/funcionalidades/estoque",
          description: "Controle de disponibilidade"
        }
      ]}
    />
  )
}
