import { Metadata } from "next"
import { Calendar } from "lucide-react"
import { FeaturePageTemplate } from "@/components/site"

export const metadata: Metadata = {
  title: "Reservas e Orçamentos | ODuoLoc",
  description: "Sistema completo de reservas com calendário integrado, orçamentos automáticos, contratos digitais e controle de devolução.",
  openGraph: {
    title: "Reservas e Orçamentos | ODuoLoc",
    description: "Gerencie todas as reservas da sua locadora em um único lugar.",
  },
}

export default function ReservasPage() {
  return (
    <FeaturePageTemplate
      icon={Calendar}
      title="Reservas e Orçamentos"
      subtitle="Gestão completa do ciclo de locação"
      description="Do orçamento à devolução, gerencie todo o ciclo de vida das suas reservas. Com calendário integrado, contratos automáticos, checklists e controle de status em tempo real."
      screenshotPlaceholder="Tela de gestão de reservas"
      features={[
        {
          title: "Orçamentos Automáticos",
          description: "Crie orçamentos em segundos com cálculo automático de valores, descontos e taxas. Envie por email ou WhatsApp."
        },
        {
          title: "Calendário Visual",
          description: "Visualize todas as reservas em um calendário intuitivo. Identifique conflitos e disponibilidade rapidamente."
        },
        {
          title: "Contratos Digitais",
          description: "Gere contratos personalizados automaticamente. Templates editáveis com variáveis dinâmicas."
        },
        {
          title: "Checklists de Entrega/Devolução",
          description: "Registre o estado do equipamento na entrega e devolução com fotos e observações."
        },
        {
          title: "Status em Tempo Real",
          description: "Acompanhe o status de cada reserva: orçamento, confirmada, em andamento, finalizada."
        },
        {
          title: "Múltiplos Equipamentos",
          description: "Adicione vários equipamentos em uma única reserva. Cálculos e contratos unificados."
        }
      ]}
      benefits={[
        "Redução de 80% no tempo de criação de orçamentos",
        "Contratos gerados automaticamente",
        "Menos erros e conflitos de agenda",
        "Histórico completo de cada reserva",
        "Comunicação centralizada com clientes",
        "Controle de entregas e devoluções"
      ]}
      availableIn={["starter", "professional", "enterprise"]}
      faqs={[
        {
          question: "Posso personalizar os modelos de contrato?",
          answer: "Sim! Você pode criar e editar templates de contrato com variáveis dinâmicas que são preenchidas automaticamente com os dados da reserva."
        },
        {
          question: "Como funciona o checklist de entrega?",
          answer: "Você pode criar templates de checklist com itens a verificar. Na entrega e devolução, o operador marca cada item e pode adicionar fotos e observações."
        },
        {
          question: "É possível enviar orçamento por WhatsApp?",
          answer: "Sim, o sistema gera um link ou PDF do orçamento que pode ser enviado diretamente pelo WhatsApp."
        },
        {
          question: "Quantas reservas posso fazer por mês?",
          answer: "Starter: 200/mês, Professional: 1.000/mês, Enterprise: ilimitado."
        }
      ]}
      relatedModules={[
        {
          title: "Calendário",
          href: "/funcionalidades/calendario",
          description: "Visualização completa da agenda de reservas"
        },
        {
          title: "Clientes",
          href: "/funcionalidades/clientes",
          description: "Cadastro e histórico dos seus clientes"
        },
        {
          title: "Financeiro",
          href: "/funcionalidades/financeiro",
          description: "Controle de pagamentos e recebimentos"
        }
      ]}
    />
  )
}
