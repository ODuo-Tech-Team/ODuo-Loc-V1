import { Metadata } from "next"
import { Calendar } from "lucide-react"
import { FeaturePageTemplate } from "@/components/site"

export const metadata: Metadata = {
  title: "Reservas e Orcamentos | ODuoLoc",
  description: "Sistema completo de reservas com calendario integrado, orcamentos automaticos, contratos digitais e controle de devolucao.",
  openGraph: {
    title: "Reservas e Orcamentos | ODuoLoc",
    description: "Gerencie todas as reservas da sua locadora em um unico lugar.",
  },
}

export default function ReservasPage() {
  return (
    <FeaturePageTemplate
      icon={Calendar}
      title="Reservas e Orcamentos"
      subtitle="Gestao completa do ciclo de locacao"
      description="Do orcamento a devolucao, gerencie todo o ciclo de vida das suas reservas. Com calendario integrado, contratos automaticos, checklists e controle de status em tempo real."
      screenshotPlaceholder="Tela de gestao de reservas"
      features={[
        {
          title: "Orcamentos Automaticos",
          description: "Crie orcamentos em segundos com calculo automatico de valores, descontos e taxas. Envie por email ou WhatsApp."
        },
        {
          title: "Calendario Visual",
          description: "Visualize todas as reservas em um calendario intuitivo. Identifique conflitos e disponibilidade rapidamente."
        },
        {
          title: "Contratos Digitais",
          description: "Gere contratos personalizados automaticamente. Templates editaveis com variaveis dinamicas."
        },
        {
          title: "Checklists de Entrega/Devolucao",
          description: "Registre o estado do equipamento na entrega e devolucao com fotos e observacoes."
        },
        {
          title: "Status em Tempo Real",
          description: "Acompanhe o status de cada reserva: orcamento, confirmada, em andamento, finalizada."
        },
        {
          title: "Multiplos Equipamentos",
          description: "Adicione varios equipamentos em uma unica reserva. Calculos e contratos unificados."
        }
      ]}
      benefits={[
        "Reducao de 80% no tempo de criacao de orcamentos",
        "Contratos gerados automaticamente",
        "Menos erros e conflitos de agenda",
        "Historico completo de cada reserva",
        "Comunicacao centralizada com clientes",
        "Controle de entregas e devolucoes"
      ]}
      availableIn={["starter", "professional", "enterprise"]}
      faqs={[
        {
          question: "Posso personalizar os modelos de contrato?",
          answer: "Sim! Voce pode criar e editar templates de contrato com variaveis dinamicas que sao preenchidas automaticamente com os dados da reserva."
        },
        {
          question: "Como funciona o checklist de entrega?",
          answer: "Voce pode criar templates de checklist com itens a verificar. Na entrega e devolucao, o operador marca cada item e pode adicionar fotos e observacoes."
        },
        {
          question: "E possivel enviar orcamento por WhatsApp?",
          answer: "Sim, o sistema gera um link ou PDF do orcamento que pode ser enviado diretamente pelo WhatsApp."
        },
        {
          question: "Quantas reservas posso fazer por mes?",
          answer: "Starter: 200/mes, Professional: 1.000/mes, Enterprise: ilimitado."
        }
      ]}
      relatedModules={[
        {
          title: "Calendario",
          href: "/funcionalidades/calendario",
          description: "Visualizacao completa da agenda de reservas"
        },
        {
          title: "Clientes",
          href: "/funcionalidades/clientes",
          description: "Cadastro e historico dos seus clientes"
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
