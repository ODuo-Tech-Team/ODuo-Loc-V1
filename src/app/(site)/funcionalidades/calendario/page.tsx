import { Metadata } from "next"
import { CalendarDays } from "lucide-react"
import { FeaturePageTemplate } from "@/components/site"

export const metadata: Metadata = {
  title: "Calendário Integrado | ODuoLoc",
  description: "Visualize todas as reservas em um calendário intuitivo com diferentes visualizações e filtros avançados.",
  openGraph: {
    title: "Calendário Integrado | ODuoLoc",
    description: "Tenha visão completa da agenda da sua locadora.",
  },
}

export default function CalendarioPage() {
  return (
    <FeaturePageTemplate
      icon={CalendarDays}
      title="Calendário Integrado"
      subtitle="Visão completa da sua agenda"
      description="Visualize todas as reservas em um calendário intuitivo. Com diferentes modos de visualização, filtros por equipamento ou cliente, e funcionalidade de arrastar e soltar para reagendar."
      screenshotPlaceholder="Tela do calendário de reservas"
      features={[
        {
          title: "Visualização Diária",
          description: "Veja todas as reservas do dia com horários detalhados de início e fim."
        },
        {
          title: "Visualização Semanal",
          description: "Planeje a semana com visão de todos os dias e suas respectivas reservas."
        },
        {
          title: "Visualização Mensal",
          description: "Tenha uma visão geral do mês com indicadores de ocupação por dia."
        },
        {
          title: "Filtros Avançados",
          description: "Filtre por equipamento, cliente, status ou categoria para encontrar rapidamente o que precisa."
        },
        {
          title: "Cores por Status",
          description: "Identifique rapidamente o status de cada reserva através de cores diferenciadas."
        },
        {
          title: "Drag and Drop",
          description: "Arraste e solte reservas para reagendar rapidamente quando necessário."
        }
      ]}
      benefits={[
        "Visão clara de toda a agenda",
        "Identificação rápida de conflitos",
        "Otimização da ocupação",
        "Reagendamento fácil e rápido",
        "Planejamento de manutenções",
        "Melhor atendimento ao cliente"
      ]}
      availableIn={["starter", "professional", "enterprise"]}
      faqs={[
        {
          question: "Posso exportar o calendário?",
          answer: "Sim, você pode exportar a agenda em formato iCal para sincronizar com Google Calendar, Outlook ou outros aplicativos."
        },
        {
          question: "O calendário mostra manutenções programadas?",
          answer: "Sim, você pode visualizar reservas, manutenções e outros eventos no mesmo calendário."
        },
        {
          question: "É possível ver apenas os equipamentos de uma categoria?",
          answer: "Sim, os filtros permitem visualizar apenas equipamentos de categorias específicas."
        },
        {
          question: "O calendário atualiza em tempo real?",
          answer: "Sim, qualquer alteração feita por outro usuário é refletida automaticamente no calendário."
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
          description: "Catálogo de equipamentos disponíveis"
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
