import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://oduoloc.com.br"

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/api/",
          "/super-admin",
          "/_next/",
          "/admin/",
          "/configuracoes/",
          "/checkout/",
          "/auth/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/dashboard",
          "/api/",
          "/super-admin",
          "/configuracoes/",
          "/checkout/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
