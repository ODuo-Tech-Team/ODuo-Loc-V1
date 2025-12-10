"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  Send,
  Loader2
} from "lucide-react"

const contactSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  company: z.string().optional(),
  subject: z.string().min(1, "Selecione um assunto"),
  message: z.string().min(10, "Mensagem deve ter pelo menos 10 caracteres"),
})

type ContactFormData = z.infer<typeof contactSchema>

const subjects = [
  { value: "demo", label: "Solicitar demonstração" },
  { value: "pricing", label: "Dúvidas sobre preços" },
  { value: "support", label: "Suporte técnico" },
  { value: "partnership", label: "Parcerias" },
  { value: "other", label: "Outro assunto" },
]

const faqs = [
  {
    question: "Como funciona a contratação?",
    answer: "Escolha o plano que mais se encaixa na sua operação e nossa equipe entra em contato para agendar a implementação."
  },
  {
    question: "Quanto tempo leva a implementação?",
    answer: "A implementação padrão leva de 3 a 5 dias úteis. Nossa equipe auxilia em todo o processo de configuração."
  },
  {
    question: "Posso migrar meus dados de outro sistema?",
    answer: "Sim! Nossa equipe pode ajudar na migração de dados do seu sistema atual para o ODuoLoc."
  },
]

export default function ContatoPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Erro ao enviar mensagem")
      }

      toast.success("Mensagem enviada com sucesso! Entraremos em contato em breve.")
      reset()
    } catch {
      toast.error("Erro ao enviar mensagem. Tente novamente ou entre em contato por telefone.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Entre em{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
              Contato
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Estamos prontos para ajudar. Tire suas dúvidas, solicite uma demonstração
            ou fale com nosso time de especialistas.
          </p>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Info Cards */}
            <div className="lg:col-span-1 space-y-6">
              {/* Email */}
              <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Email</h3>
                <a
                  href="mailto:contato@oduoloc.com.br"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  contato@oduoloc.com.br
                </a>
              </div>

              {/* WhatsApp */}
              <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">WhatsApp</h3>
                <a
                  href="https://wa.me/5511999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  (11) 99999-9999
                </a>
              </div>

              {/* Telefone */}
              <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
                  <Phone className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Telefone</h3>
                <a
                  href="tel:+551199999999"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  (11) 99999-9999
                </a>
              </div>

              {/* Horario */}
              <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Horário de Atendimento</h3>
                <p className="text-gray-400 text-sm">
                  Segunda a Sexta<br />
                  9h às 18h (Horário de Brasília)
                </p>
              </div>

              {/* Endereco */}
              <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Localização</h3>
                <p className="text-gray-400 text-sm">
                  São Paulo - SP<br />
                  Brasil
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="p-8 rounded-2xl border border-white/10 bg-white/5">
                <h2 className="text-2xl font-bold mb-6">Envie sua mensagem</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    {/* Nome */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-300">
                        Nome *
                      </Label>
                      <Input
                        id="name"
                        placeholder="Seu nome"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                        {...register("name")}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-400">{errors.name.message}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-300">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                        {...register("email")}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-400">{errors.email.message}</p>
                      )}
                    </div>

                    {/* Telefone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-300">
                        Telefone
                      </Label>
                      <Input
                        id="phone"
                        placeholder="(11) 99999-9999"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                        {...register("phone")}
                      />
                    </div>

                    {/* Empresa */}
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-gray-300">
                        Empresa
                      </Label>
                      <Input
                        id="company"
                        placeholder="Nome da sua empresa"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                        {...register("company")}
                      />
                    </div>
                  </div>

                  {/* Assunto */}
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-gray-300">
                      Assunto *
                    </Label>
                    <Select onValueChange={(value) => setValue("subject", value)}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Selecione um assunto" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.value} value={subject.value}>
                            {subject.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.subject && (
                      <p className="text-sm text-red-400">{errors.subject.message}</p>
                    )}
                  </div>

                  {/* Mensagem */}
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-gray-300">
                      Mensagem *
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Como podemos ajudar?"
                      rows={5}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none"
                      {...register("message")}
                    />
                    {errors.message && (
                      <p className="text-sm text-red-400">{errors.message.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar Mensagem
                      </>
                    )}
                  </Button>
                </form>
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
            <p className="text-gray-400">Respostas rápidas para dúvidas comuns</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-white/10 bg-white/5"
              >
                <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                <p className="text-gray-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
