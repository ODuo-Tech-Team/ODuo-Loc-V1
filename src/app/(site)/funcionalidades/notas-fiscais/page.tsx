import { Metadata } from "next"
import { Receipt } from "lucide-react"
import { FeaturePageTemplate } from "@/components/site"

export const metadata: Metadata = {
  title: "Notas Fiscais NFS-e | ODuoLoc",
  description: "Emissão de Nota Fiscal de Serviço Eletrônica integrada diretamente ao sistema de reservas.",
  openGraph: {
    title: "Notas Fiscais NFS-e | ODuoLoc",
    description: "Emita notas fiscais de serviço diretamente pelo sistema.",
  },
}

export default function NotasFiscaisPage() {
  return (
    <FeaturePageTemplate
      icon={Receipt}
      title="Notas Fiscais (NFS-e)"
      subtitle="Fiscalidade simplificada"
      description="Emissão de Nota Fiscal de Serviço Eletrônica (NFS-e) integrada diretamente ao sistema de reservas. Configure seus impostos uma vez e emita notas com poucos cliques."
      screenshotPlaceholder="Tela de emissão de NFS-e"
      features={[
        {
          title: "Emissão de NFS-e",
          description: "Emita notas fiscais de serviço eletrônica diretamente pelo sistema, integrado com sua reserva."
        },
        {
          title: "Integração com Prefeituras",
          description: "Integrado com o sistema de diversas prefeituras brasileiras através de API certificada."
        },
        {
          title: "Configuração de Impostos",
          description: "Configure CNAE, ISS, regime tributário e outros parâmetros fiscais uma única vez."
        },
        {
          title: "Cancelamento de Notas",
          description: "Cancele notas fiscais quando necessário, seguindo as regras de cada município."
        },
        {
          title: "Envio Automático",
          description: "Envie a nota fiscal automaticamente por email para o cliente após a emissão."
        },
        {
          title: "Relatórios Fiscais",
          description: "Exporte relatórios de notas emitidas por período para contabilidade."
        }
      ]}
      benefits={[
        "Emissão rápida e simplificada",
        "Conformidade fiscal garantida",
        "Menos retrabalho e erros",
        "Relatórios para contabilidade",
        "Envio automático ao cliente",
        "Histórico completo de notas"
      ]}
      availableIn={["professional", "enterprise"]}
      faqs={[
        {
          question: "Quais municípios são suportados?",
          answer: "Temos integração com diversas prefeituras através do Focus NFe. Consulte-nos sobre sua cidade específica."
        },
        {
          question: "Preciso de certificado digital?",
          answer: "Depende do município. Alguns exigem certificado A1, outros permitem emissão com usuário e senha."
        },
        {
          question: "Posso emitir nota antes de receber o pagamento?",
          answer: "Sim, você controla quando emitir a nota. Pode ser na confirmação da reserva, na entrega ou no pagamento."
        },
        {
          question: "O sistema calcula os impostos automaticamente?",
          answer: "Sim, após configurar seus parâmetros fiscais, o sistema calcula ISS e outros impostos automaticamente."
        }
      ]}
      relatedModules={[
        {
          title: "Reservas",
          href: "/funcionalidades/reservas",
          description: "Origem dos serviços faturados"
        },
        {
          title: "Financeiro",
          href: "/funcionalidades/financeiro",
          description: "Controle de recebimentos"
        },
        {
          title: "Relatórios",
          href: "/funcionalidades/relatorios",
          description: "Relatórios fiscais detalhados"
        }
      ]}
    />
  )
}
