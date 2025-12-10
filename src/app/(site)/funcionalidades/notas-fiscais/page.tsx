import { Metadata } from "next"
import { Receipt } from "lucide-react"
import { FeaturePageTemplate } from "@/components/site"

export const metadata: Metadata = {
  title: "Notas Fiscais NFS-e | ODuoLoc",
  description: "Emissao de Nota Fiscal de Servico Eletronica integrada diretamente ao sistema de reservas.",
  openGraph: {
    title: "Notas Fiscais NFS-e | ODuoLoc",
    description: "Emita notas fiscais de servico diretamente pelo sistema.",
  },
}

export default function NotasFiscaisPage() {
  return (
    <FeaturePageTemplate
      icon={Receipt}
      title="Notas Fiscais (NFS-e)"
      subtitle="Fiscalidade simplificada"
      description="Emissao de Nota Fiscal de Servico Eletronica (NFS-e) integrada diretamente ao sistema de reservas. Configure seus impostos uma vez e emita notas com poucos cliques."
      screenshotPlaceholder="Tela de emissao de NFS-e"
      features={[
        {
          title: "Emissao de NFS-e",
          description: "Emita notas fiscais de servico eletronica diretamente pelo sistema, integrado com sua reserva."
        },
        {
          title: "Integracao com Prefeituras",
          description: "Integrado com o sistema de diversas prefeituras brasileiras atraves de API certificada."
        },
        {
          title: "Configuracao de Impostos",
          description: "Configure CNAE, ISS, regime tributario e outros parametros fiscais uma unica vez."
        },
        {
          title: "Cancelamento de Notas",
          description: "Cancele notas fiscais quando necessario, seguindo as regras de cada municipio."
        },
        {
          title: "Envio Automatico",
          description: "Envie a nota fiscal automaticamente por email para o cliente apos a emissao."
        },
        {
          title: "Relatorios Fiscais",
          description: "Exporte relatorios de notas emitidas por periodo para contabilidade."
        }
      ]}
      benefits={[
        "Emissao rapida e simplificada",
        "Conformidade fiscal garantida",
        "Menos retrabalho e erros",
        "Relatorios para contabilidade",
        "Envio automatico ao cliente",
        "Historico completo de notas"
      ]}
      availableIn={["professional", "enterprise"]}
      faqs={[
        {
          question: "Quais municipios sao suportados?",
          answer: "Temos integracao com diversas prefeituras atraves do Focus NFe. Consulte-nos sobre sua cidade especifica."
        },
        {
          question: "Preciso de certificado digital?",
          answer: "Depende do municipio. Alguns exigem certificado A1, outros permitem emissao com usuario e senha."
        },
        {
          question: "Posso emitir nota antes de receber o pagamento?",
          answer: "Sim, voce controla quando emitir a nota. Pode ser na confirmacao da reserva, na entrega ou no pagamento."
        },
        {
          question: "O sistema calcula os impostos automaticamente?",
          answer: "Sim, apos configurar seus parametros fiscais, o sistema calcula ISS e outros impostos automaticamente."
        }
      ]}
      relatedModules={[
        {
          title: "Reservas",
          href: "/funcionalidades/reservas",
          description: "Origem dos servicos faturados"
        },
        {
          title: "Financeiro",
          href: "/funcionalidades/financeiro",
          description: "Controle de recebimentos"
        },
        {
          title: "Relatorios",
          href: "/funcionalidades/relatorios",
          description: "Relatorios fiscais detalhados"
        }
      ]}
    />
  )
}
