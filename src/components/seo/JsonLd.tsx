import Script from "next/script"

const baseUrl = "https://oduoloc.com.br"

// Schema para a Organização
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ODuoLoc",
    alternateName: "ODuo Assessoria",
    url: baseUrl,
    logo: `${baseUrl}/logo.svg`,
    description:
      "Sistema de gestão para locadoras de equipamentos. Plataforma completa para gerenciar reservas, clientes, estoque e financeiro.",
    foundingDate: "2024",
    address: {
      "@type": "PostalAddress",
      addressCountry: "BR",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "contato@oduoloc.com.br",
      availableLanguage: ["Portuguese"],
    },
    sameAs: [
      "https://www.instagram.com/oduoloc",
      "https://www.linkedin.com/company/oduoloc",
      "https://www.facebook.com/oduoloc",
    ],
  }

  return (
    <Script
      id="organization-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Schema para Software/SaaS
export function SoftwareSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ODuoLoc",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web Browser",
    description:
      "Sistema completo para gestão de locadoras de equipamentos. Gerencie reservas, clientes, estoque, financeiro e muito mais em uma única plataforma.",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "BRL",
      lowPrice: "997",
      highPrice: "2997",
      offerCount: 3,
      offers: [
        {
          "@type": "Offer",
          name: "Plano Starter",
          price: "997",
          priceCurrency: "BRL",
          priceValidUntil: "2025-12-31",
          availability: "https://schema.org/InStock",
        },
        {
          "@type": "Offer",
          name: "Plano Professional",
          price: "1497",
          priceCurrency: "BRL",
          priceValidUntil: "2025-12-31",
          availability: "https://schema.org/InStock",
        },
        {
          "@type": "Offer",
          name: "Plano Enterprise",
          price: "2997",
          priceCurrency: "BRL",
          priceValidUntil: "2025-12-31",
          availability: "https://schema.org/InStock",
        },
      ],
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "127",
      bestRating: "5",
      worstRating: "1",
    },
    featureList: [
      "Gestão de reservas",
      "Controle de estoque",
      "Cadastro de clientes",
      "Módulo financeiro",
      "Relatórios avançados",
      "Calendário integrado",
      "Notificações automáticas",
      "API REST completa",
      "Multi-tenant",
      "Responsivo",
    ],
    screenshot: `${baseUrl}/screenshots/dashboard.png`,
    softwareHelp: {
      "@type": "WebPage",
      url: `${baseUrl}/ajuda`,
    },
    author: {
      "@type": "Organization",
      name: "ODuo Assessoria",
    },
  }

  return (
    <Script
      id="software-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Schema para FAQ
export function FAQSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "O que é o ODuoLoc?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "ODuoLoc é um sistema de gestão completo para locadoras de equipamentos. Com ele você pode gerenciar reservas, controlar estoque, cadastrar clientes, emitir notas fiscais e acompanhar o financeiro da sua empresa em uma única plataforma.",
        },
      },
      {
        "@type": "Question",
        name: "Quanto custa o sistema para locadora ODuoLoc?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "O ODuoLoc oferece 3 planos: Starter (R$ 997/mês) para quem está começando, Professional (R$ 1.497/mês) para empresas em crescimento e Enterprise (R$ 2.997/mês) para grandes operações. Todos incluem 14 dias de teste grátis.",
        },
      },
      {
        "@type": "Question",
        name: "O sistema funciona para qualquer tipo de locadora?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sim! O ODuoLoc é flexível e atende diversos tipos de locadoras: equipamentos para construção, ferramentas, andaimes, geradores, containers, equipamentos audiovisuais, para eventos e muito mais.",
        },
      },
      {
        "@type": "Question",
        name: "Como funciona o controle de estoque?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "O sistema controla automaticamente a disponibilidade dos equipamentos. Você cadastra a quantidade total e o sistema atualiza em tempo real: disponível, reservado, em manutenção e danificado. Alertas automáticos avisam quando o estoque está baixo.",
        },
      },
      {
        "@type": "Question",
        name: "Posso emitir nota fiscal pelo sistema?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sim! O ODuoLoc possui integração completa para emissão de NFS-e (Nota Fiscal de Serviço Eletrônica) diretamente pelo sistema, com suporte às principais prefeituras do Brasil.",
        },
      },
      {
        "@type": "Question",
        name: "O sistema tem API para integração?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sim! Oferecemos uma API REST completa e webhooks em tempo real para integração com outros sistemas como ERPs, contabilidade, e-commerce e mais.",
        },
      },
      {
        "@type": "Question",
        name: "Preciso instalar algum programa?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Não! O ODuoLoc é 100% online (cloud). Você acessa pelo navegador de qualquer dispositivo - computador, tablet ou celular. Não precisa instalar nada.",
        },
      },
      {
        "@type": "Question",
        name: "Meus dados ficam seguros?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Absolutamente! Utilizamos criptografia de ponta a ponta, servidores seguros com backups automáticos diários e seguimos todas as diretrizes da LGPD para proteção dos seus dados.",
        },
      },
    ],
  }

  return (
    <Script
      id="faq-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Schema para Breadcrumb
export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; url: string }[]
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <Script
      id="breadcrumb-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Schema para WebSite (ajuda no sitelinks do Google)
export function WebSiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ODuoLoc",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/busca?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }

  return (
    <Script
      id="website-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Componente que agrupa todos os schemas para a landing page
export function LandingPageSchemas() {
  return (
    <>
      <OrganizationSchema />
      <SoftwareSchema />
      <FAQSchema />
      <WebSiteSchema />
    </>
  )
}
