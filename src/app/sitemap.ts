import { MetadataRoute } from "next"

const baseUrl = "https://oduoloc.com.br"

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date().toISOString()

  // Páginas públicas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/cadastro`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/planos`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/recuperar-senha`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ]

  // Landing pages por segmento (SEO local/nicho)
  const segmentPages: MetadataRoute.Sitemap = [
    "locadora-de-equipamentos",
    "locadora-de-ferramentas",
    "locadora-de-maquinas",
    "locadora-de-andaimes",
    "locadora-de-geradores",
    "locadora-de-containers",
    "locadora-de-equipamentos-para-construcao",
    "locadora-de-equipamentos-para-eventos",
    "locadora-de-equipamentos-audiovisuais",
    "locadora-de-equipamentos-industriais",
  ].map((segment) => ({
    url: `${baseUrl}/${segment}`,
    lastModified: currentDate,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }))

  // Landing pages por cidade (SEO GEO)
  const cityPages: MetadataRoute.Sitemap = [
    "sao-paulo",
    "rio-de-janeiro",
    "belo-horizonte",
    "brasilia",
    "curitiba",
    "porto-alegre",
    "salvador",
    "fortaleza",
    "recife",
    "goiania",
    "campinas",
    "manaus",
    "santos",
    "florianopolis",
    "vitoria",
  ].map((city) => ({
    url: `${baseUrl}/locadora-de-equipamentos-${city}`,
    lastModified: currentDate,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  return [...staticPages, ...segmentPages, ...cityPages]
}
