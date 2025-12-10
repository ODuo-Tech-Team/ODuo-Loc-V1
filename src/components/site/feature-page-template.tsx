import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Check, ChevronDown, LucideIcon } from "lucide-react"

interface FeatureDetail {
  title: string
  description: string
}

interface FAQ {
  question: string
  answer: string
}

interface FeaturePageTemplateProps {
  icon: LucideIcon
  title: string
  subtitle: string
  description: string
  screenshotPlaceholder?: string
  features: FeatureDetail[]
  benefits: string[]
  availableIn: ("starter" | "professional" | "enterprise")[]
  faqs: FAQ[]
  relatedModules?: {
    title: string
    href: string
    description: string
  }[]
}

const planInfo = {
  starter: {
    name: "Starter",
    price: "R$ 997/mês",
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/30"
  },
  professional: {
    name: "Professional",
    price: "R$ 1.497/mês",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30"
  },
  enterprise: {
    name: "Enterprise",
    price: "R$ 2.997/mês",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30"
  }
}

export function FeaturePageTemplate({
  icon: Icon,
  title,
  subtitle,
  description,
  screenshotPlaceholder,
  features,
  benefits,
  availableIn,
  faqs,
  relatedModules
}: FeaturePageTemplateProps) {
  return (
    <>
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                <Icon className="h-7 w-7 text-blue-400" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                {title}
              </h1>
              <p className="text-xl text-blue-400 mb-4">{subtitle}</p>
              <p className="text-lg text-gray-400 leading-relaxed mb-8">
                {description}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/planos">
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white">
                    Começar Agora <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/contato">
                  <Button variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 text-white">
                    Solicitar Demo
                  </Button>
                </Link>
              </div>
            </div>

            {/* Screenshot placeholder */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center overflow-hidden">
                <div className="text-center p-8">
                  <div className="w-20 h-20 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-10 w-10 text-blue-400" />
                  </div>
                  <p className="text-gray-500 text-sm">
                    {screenshotPlaceholder || "Área reservada para screenshot do módulo"}
                  </p>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Recursos Detalhados</h2>
            <p className="text-gray-400">Tudo o que você precisa para {title.toLowerCase()}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl border border-white/10 bg-white/5"
              >
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Benefícios</h2>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Available in plans */}
            <div className="p-8 rounded-2xl border border-white/10 bg-white/5">
              <h3 className="text-xl font-semibold mb-6">Disponível nos planos:</h3>
              <div className="space-y-4">
                {(["starter", "professional", "enterprise"] as const).map((plan) => {
                  const included = availableIn.includes(plan)
                  const info = planInfo[plan]
                  return (
                    <div
                      key={plan}
                      className={`p-4 rounded-xl border ${
                        included
                          ? `${info.bgColor} ${info.borderColor}`
                          : "bg-white/5 border-white/5 opacity-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className={`font-semibold ${included ? info.color : "text-gray-500"}`}>
                            {info.name}
                          </span>
                          <span className="text-gray-500 text-sm ml-2">
                            {info.price}
                          </span>
                        </div>
                        {included ? (
                          <Check className={`h-5 w-5 ${info.color}`} />
                        ) : (
                          <span className="text-xs text-gray-500">Não incluso</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-6">
                <Link href="/planos">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white">
                    Ver todos os planos
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Perguntas Frequentes</h2>
            <p className="text-gray-400">Dúvidas comuns sobre {title.toLowerCase()}</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="group p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <h3 className="text-lg font-semibold text-white pr-4">{faq.question}</h3>
                  <ChevronDown className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="mt-4 text-gray-400 leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Related Modules */}
      {relatedModules && relatedModules.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Módulos Relacionados</h2>
              <p className="text-gray-400">Funcionalidades que complementam {title.toLowerCase()}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {relatedModules.map((module, index) => (
                <Link
                  key={index}
                  href={module.href}
                  className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all group"
                >
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{module.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center p-12 rounded-3xl border border-white/10 bg-gradient-to-b from-blue-900/20 to-cyan-900/20">
          <h2 className="text-3xl font-bold mb-4">Pronto para usar {title}?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Veja como o ODuoLoc pode transformar sua locadora.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/planos">
              <Button size="lg" className="bg-white text-black hover:bg-gray-200">
                Começar Agora <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/funcionalidades">
              <Button size="lg" variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 text-white">
                Ver Todas Funcionalidades
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
