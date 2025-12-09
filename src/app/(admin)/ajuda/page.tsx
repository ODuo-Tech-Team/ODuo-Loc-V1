"use client"

import { useState } from "react"
import { Search, Book, Code, HelpCircle, ChevronDown, ChevronUp } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

interface FAQItem {
  question: string
  answer: string
  category: string
}

const faqs: FAQItem[] = [
  {
    category: "Geral",
    question: "Como criar um novo equipamento?",
    answer: "Acesse o menu 'Equipamentos' e clique no botão 'Novo Equipamento'. Preencha os dados obrigatórios como nome, categoria, preço por dia e quantidade. Você também pode adicionar imagens e descrição detalhada."
  },
  {
    category: "Geral",
    question: "Como fazer uma reserva?",
    answer: "1. Acesse o menu 'Reservas' e clique em 'Nova Reserva'. 2. Selecione o cliente e o equipamento desejado. 3. Escolha as datas de início e fim. 4. O sistema calculará automaticamente o valor total. 5. Clique em 'Criar Reserva' para confirmar."
  },
  {
    category: "Geral",
    question: "Como cadastrar um cliente?",
    answer: "Vá para o menu 'Clientes' e clique em 'Novo Cliente'. Preencha os dados como nome, email, telefone e CPF/CNPJ. O email é opcional mas recomendado para envio de confirmações de reserva."
  },
  {
    category: "Equipamentos",
    question: "Posso adicionar múltiplas imagens em um equipamento?",
    answer: "Sim! Você pode adicionar até 5 imagens por equipamento. A primeira imagem será usada como imagem principal nas listagens."
  },
  {
    category: "Equipamentos",
    question: "Como marcar um equipamento em manutenção?",
    answer: "Ao editar o equipamento, altere o status para 'Manutenção'. Equipamentos em manutenção não aparecerão disponíveis para novas reservas."
  },
  {
    category: "Reservas",
    question: "Como cancelar uma reserva?",
    answer: "Acesse a lista de reservas, clique na reserva desejada e altere o status para 'Cancelada'. Isso liberará o equipamento para outras reservas."
  },
  {
    category: "Reservas",
    question: "O cliente recebe email de confirmação?",
    answer: "Sim, se o cliente tiver um email cadastrado e você configurou o serviço de email (Resend), o cliente receberá automaticamente um email de confirmação com todos os detalhes da reserva."
  },
  {
    category: "Usuários",
    question: "Quais são os tipos de usuário?",
    answer: "Existem 5 níveis: SUPER_ADMIN (acesso total), ADMIN (gerenciar tudo exceto outros admins), MANAGER (gerenciar equipamentos e reservas), OPERATOR (criar e editar reservas) e VIEWER (apenas visualizar)."
  },
  {
    category: "Usuários",
    question: "Como adicionar um novo usuário?",
    answer: "Apenas usuários com perfil ADMIN ou SUPER_ADMIN podem adicionar usuários. Acesse 'Usuários' > 'Novo Usuário', preencha os dados e escolha o nível de acesso apropriado."
  },
  {
    category: "Configurações",
    question: "Como alterar a logo da empresa?",
    answer: "Acesse 'Configurações' no menu, faça upload da nova logo na seção 'Logo da Empresa' e clique em 'Salvar Configurações'. Recomendamos usar imagem de 400x400px em formato PNG."
  },
  {
    category: "Configurações",
    question: "Posso personalizar as cores do sistema?",
    answer: "Sim! Em 'Configurações', você pode escolher a cor principal que será aplicada nos botões e elementos de destaque do sistema."
  },
]

export default function AjudaPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const categories = Array.from(new Set(faqs.map(f => f.category)))

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold font-headline tracking-wide">Central de Ajuda</h1>
        <p className="text-muted-foreground text-lg">
          Encontre respostas para suas dúvidas sobre o sistema
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por palavra-chave..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <Book className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Guia de Início</CardTitle>
            <CardDescription>
              Primeiros passos para começar a usar o sistema
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <Code className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>
              <a href="/ajuda/api" className="hover:underline">
                Documentação da API
              </a>
            </CardTitle>
            <CardDescription>
              Integre seu sistema com nossa API
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <HelpCircle className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Perguntas Frequentes</CardTitle>
            <CardDescription>
              Respostas para as dúvidas mais comuns
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* FAQ by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline tracking-wide">Perguntas Frequentes</CardTitle>
          <CardDescription>
            Navegue pelas categorias ou use a busca acima
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="Todos" className="space-y-4">
            <TabsList>
              <TabsTrigger value="Todos">Todos</TabsTrigger>
              {categories.map(category => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="Todos" className="space-y-2">
              {filteredFAQs.map((faq, index) => (
                <div key={index} className="border rounded-lg">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                    className="w-full p-4 text-left flex justify-between items-center hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <span className="text-xs text-primary font-medium">{faq.category}</span>
                      <h3 className="font-medium">{faq.question}</h3>
                    </div>
                    {expandedFAQ === index ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  {expandedFAQ === index && (
                    <div className="p-4 pt-0 text-muted-foreground">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>

            {categories.map(category => (
              <TabsContent key={category} value={category} className="space-y-2">
                {filteredFAQs
                  .filter(faq => faq.category === category)
                  .map((faq, index) => (
                    <div key={index} className="border rounded-lg">
                      <button
                        onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                        className="w-full p-4 text-left flex justify-between items-center hover:bg-muted/50 transition-colors"
                      >
                        <h3 className="font-medium">{faq.question}</h3>
                        {expandedFAQ === index ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                      {expandedFAQ === index && (
                        <div className="p-4 pt-0 text-muted-foreground">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card className="bg-muted">
        <CardHeader className="text-center">
          <CardTitle className="font-headline tracking-wide">Ainda precisa de ajuda?</CardTitle>
          <CardDescription>
            Entre em contato com nossa equipe de suporte
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button size="lg">
            Falar com Suporte
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
