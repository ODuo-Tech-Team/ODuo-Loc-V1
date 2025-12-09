"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react"

interface Endpoint {
  method: "GET" | "POST" | "PUT" | "DELETE"
  path: string
  description: string
  auth: boolean
  params?: { name: string; type: string; required: boolean; description: string }[]
  body?: { name: string; type: string; required: boolean; description: string }[]
  response?: string
}

interface ApiSection {
  title: string
  description: string
  endpoints: Endpoint[]
}

const apiDocs: ApiSection[] = [
  {
    title: "Equipamentos",
    description: "Gerenciamento de equipamentos para locação",
    endpoints: [
      {
        method: "GET",
        path: "/api/equipments",
        description: "Lista todos os equipamentos do tenant",
        auth: true,
        params: [
          { name: "search", type: "string", required: false, description: "Busca por nome ou categoria" },
          { name: "status", type: "string", required: false, description: "Filtrar por status (AVAILABLE, RENTED, MAINTENANCE, INACTIVE)" },
          { name: "category", type: "string", required: false, description: "Filtrar por categoria" },
        ],
        response: `[
  {
    "id": "string",
    "name": "string",
    "description": "string | null",
    "category": "string",
    "images": ["string"],
    "pricePerDay": 150.00,
    "pricePerHour": 20.00,
    "quantity": 1,
    "status": "AVAILABLE",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]`,
      },
      {
        method: "POST",
        path: "/api/equipments",
        description: "Cria um novo equipamento",
        auth: true,
        body: [
          { name: "name", type: "string", required: true, description: "Nome do equipamento" },
          { name: "description", type: "string", required: false, description: "Descrição detalhada" },
          { name: "category", type: "string", required: true, description: "Categoria do equipamento" },
          { name: "pricePerDay", type: "number", required: true, description: "Preço por dia de locação" },
          { name: "pricePerHour", type: "number", required: false, description: "Preço por hora de locação" },
          { name: "quantity", type: "number", required: true, description: "Quantidade disponível" },
          { name: "images", type: "string[]", required: false, description: "URLs das imagens" },
        ],
        response: `{
  "id": "string",
  "name": "string",
  ...
}`,
      },
      {
        method: "GET",
        path: "/api/equipments/:id",
        description: "Busca um equipamento específico",
        auth: true,
        response: `{
  "id": "string",
  "name": "string",
  "description": "string | null",
  "category": "string",
  "images": ["string"],
  "pricePerDay": 150.00,
  "pricePerHour": 20.00,
  "quantity": 1,
  "status": "AVAILABLE"
}`,
      },
      {
        method: "PUT",
        path: "/api/equipments/:id",
        description: "Atualiza um equipamento",
        auth: true,
        body: [
          { name: "name", type: "string", required: false, description: "Nome do equipamento" },
          { name: "description", type: "string", required: false, description: "Descrição" },
          { name: "category", type: "string", required: false, description: "Categoria" },
          { name: "pricePerDay", type: "number", required: false, description: "Preço por dia" },
          { name: "status", type: "string", required: false, description: "Status do equipamento" },
        ],
        response: `{ "success": true }`,
      },
      {
        method: "DELETE",
        path: "/api/equipments/:id",
        description: "Remove um equipamento",
        auth: true,
        response: `{ "success": true }`,
      },
    ],
  },
  {
    title: "Clientes",
    description: "Gerenciamento de clientes",
    endpoints: [
      {
        method: "GET",
        path: "/api/customers",
        description: "Lista todos os clientes do tenant",
        auth: true,
        params: [
          { name: "search", type: "string", required: false, description: "Busca por nome, email, telefone ou CPF/CNPJ" },
        ],
        response: `[
  {
    "id": "string",
    "name": "string",
    "email": "string | null",
    "phone": "string",
    "cpfCnpj": "string | null",
    "address": "string | null",
    "city": "string | null",
    "state": "string | null",
    "_count": { "bookings": 5 }
  }
]`,
      },
      {
        method: "POST",
        path: "/api/customers",
        description: "Cria um novo cliente",
        auth: true,
        body: [
          { name: "name", type: "string", required: true, description: "Nome completo" },
          { name: "phone", type: "string", required: true, description: "Telefone" },
          { name: "email", type: "string", required: false, description: "Email" },
          { name: "cpfCnpj", type: "string", required: false, description: "CPF ou CNPJ" },
          { name: "address", type: "string", required: false, description: "Endereço" },
          { name: "city", type: "string", required: false, description: "Cidade" },
          { name: "state", type: "string", required: false, description: "Estado (UF)" },
          { name: "zipCode", type: "string", required: false, description: "CEP" },
          { name: "notes", type: "string", required: false, description: "Observações" },
        ],
        response: `{ "customer": { ... } }`,
      },
    ],
  },
  {
    title: "Reservas",
    description: "Gerenciamento de reservas/locações",
    endpoints: [
      {
        method: "GET",
        path: "/api/bookings",
        description: "Lista todas as reservas do tenant",
        auth: true,
        params: [
          { name: "status", type: "string", required: false, description: "Filtrar por status (PENDING, CONFIRMED, ACTIVE, COMPLETED, CANCELLED)" },
          { name: "startDate", type: "string", required: false, description: "Data inicial (ISO 8601)" },
          { name: "endDate", type: "string", required: false, description: "Data final (ISO 8601)" },
        ],
        response: `[
  {
    "id": "string",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-05T00:00:00.000Z",
    "totalPrice": 600.00,
    "status": "CONFIRMED",
    "customer": { "id": "string", "name": "string" },
    "equipment": { "id": "string", "name": "string" }
  }
]`,
      },
      {
        method: "POST",
        path: "/api/bookings",
        description: "Cria uma nova reserva",
        auth: true,
        body: [
          { name: "customerId", type: "string", required: true, description: "ID do cliente" },
          { name: "equipmentId", type: "string", required: true, description: "ID do equipamento" },
          { name: "startDate", type: "string", required: true, description: "Data de início (ISO 8601)" },
          { name: "endDate", type: "string", required: true, description: "Data de término (ISO 8601)" },
          { name: "notes", type: "string", required: false, description: "Observações" },
        ],
        response: `{ "booking": { ... } }`,
      },
    ],
  },
  {
    title: "Documentos",
    description: "Geração de contratos e recibos",
    endpoints: [
      {
        method: "GET",
        path: "/api/bookings/:id/documents",
        description: "Lista documentos gerados para uma reserva",
        auth: true,
        response: `[
  {
    "id": "string",
    "type": "CONTRACT | RECEIPT | INVOICE",
    "url": "string",
    "generatedAt": "2024-01-01T00:00:00.000Z"
  }
]`,
      },
      {
        method: "POST",
        path: "/api/bookings/:id/documents",
        description: "Gera um novo documento (contrato ou recibo)",
        auth: true,
        body: [
          { name: "type", type: "string", required: true, description: "Tipo: CONTRACT, RECEIPT ou INVOICE" },
        ],
        response: `{
  "document": { "id": "string", "type": "CONTRACT", ... },
  "html": "<html>...</html>",
  "message": "Documento gerado com sucesso"
}`,
      },
    ],
  },
  {
    title: "Email",
    description: "Envio de emails para clientes",
    endpoints: [
      {
        method: "POST",
        path: "/api/email/send",
        description: "Envia email para cliente",
        auth: true,
        body: [
          { name: "type", type: "string", required: true, description: "Tipo: confirmation, reminder, receipt, cancelled" },
          { name: "bookingId", type: "string", required: true, description: "ID da reserva" },
        ],
        response: `{ "success": true, "message": "Email enviado com sucesso" }`,
      },
    ],
  },
  {
    title: "Financeiro",
    description: "Relatórios e análises financeiras",
    endpoints: [
      {
        method: "GET",
        path: "/api/financial/overview",
        description: "Visão geral financeira do período",
        auth: true,
        params: [
          { name: "startDate", type: "string", required: false, description: "Data inicial" },
          { name: "endDate", type: "string", required: false, description: "Data final" },
        ],
        response: `{
  "totalRevenue": 15000.00,
  "totalCosts": 3000.00,
  "netProfit": 12000.00,
  "totalBookings": 25,
  "averageTicket": 600.00,
  "revenueByMonth": [...]
}`,
      },
      {
        method: "GET",
        path: "/api/financial/equipment/:id",
        description: "Análise financeira de um equipamento específico",
        auth: true,
        response: `{
  "equipment": { "id": "string", "name": "string" },
  "totalRevenue": 5000.00,
  "totalCosts": 1000.00,
  "netProfit": 4000.00,
  "bookingsCount": 10,
  "revenueByMonth": [...]
}`,
      },
      {
        method: "GET",
        path: "/api/financial/profitability",
        description: "Ranking de lucratividade dos equipamentos",
        auth: true,
        response: `[
  {
    "equipment": { "id": "string", "name": "string" },
    "revenue": 5000.00,
    "costs": 1000.00,
    "profit": 4000.00,
    "margin": 80.0
  }
]`,
      },
    ],
  },
]

const methodColors: Record<string, string> = {
  GET: "bg-green-500/20 text-green-400 border-green-500/30",
  POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PUT: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-zinc-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-zinc-500" />
        )}
        <Badge variant="outline" className={methodColors[endpoint.method]}>
          {endpoint.method}
        </Badge>
        <code className="text-sm font-mono text-zinc-300">{endpoint.path}</code>
        <span className="text-sm text-zinc-500 ml-auto">{endpoint.description}</span>
        {endpoint.auth && (
          <Badge variant="outline" className="text-xs">Auth</Badge>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 bg-black/20">
          {endpoint.params && endpoint.params.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-300 mb-2">Query Parameters</h4>
              <div className="space-y-2">
                {endpoint.params.map((param) => (
                  <div key={param.name} className="flex items-start gap-2 text-sm">
                    <code className="text-blue-400">{param.name}</code>
                    <span className="text-zinc-500">{param.type}</span>
                    {param.required && <Badge variant="destructive" className="text-xs">required</Badge>}
                    <span className="text-zinc-400">{param.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {endpoint.body && endpoint.body.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-300 mb-2">Request Body</h4>
              <div className="space-y-2">
                {endpoint.body.map((field) => (
                  <div key={field.name} className="flex items-start gap-2 text-sm">
                    <code className="text-blue-400">{field.name}</code>
                    <span className="text-zinc-500">{field.type}</span>
                    {field.required && <Badge variant="destructive" className="text-xs">required</Badge>}
                    <span className="text-zinc-400">{field.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {endpoint.response && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-zinc-300">Response</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(endpoint.response || "")}
                  className="h-6 px-2"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <pre className="bg-black/40 rounded-lg p-3 text-sm overflow-x-auto">
                <code className="text-zinc-300">{endpoint.response}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ApiDocsPage() {
  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground font-headline tracking-wide">
          Documentacao da API
        </h1>
        <p className="text-muted-foreground mt-1">
          Referencia completa dos endpoints disponiveis
        </p>
      </div>

      {/* Base URL */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline tracking-wide">Base URL</CardTitle>
          <CardDescription>
            Todos os endpoints utilizam esta URL base
          </CardDescription>
        </CardHeader>
        <CardContent>
          <code className="bg-black/40 px-3 py-2 rounded-lg text-sm text-zinc-300">
            https://seu-dominio.com/api
          </code>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline tracking-wide">Autenticacao</CardTitle>
          <CardDescription>
            Todos os endpoints marcados com Auth requerem sessao autenticada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-400">
          <p>
            A autenticacao e feita via NextAuth.js com sessoes JWT. O usuario deve
            estar logado para acessar os endpoints protegidos.
          </p>
          <p>
            Cada requisicao e automaticamente associada ao tenant do usuario autenticado,
            garantindo isolamento dos dados.
          </p>
        </CardContent>
      </Card>

      {/* API Sections */}
      {apiDocs.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle className="font-headline tracking-wide">{section.title}</CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {section.endpoints.map((endpoint, index) => (
              <EndpointCard key={index} endpoint={endpoint} />
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Error Codes */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline tracking-wide">Codigos de Erro</CardTitle>
          <CardDescription>
            Respostas de erro comuns da API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-red-500/20 text-red-400">400</Badge>
              <span className="text-sm text-zinc-400">Bad Request - Dados invalidos ou faltando</span>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-red-500/20 text-red-400">401</Badge>
              <span className="text-sm text-zinc-400">Unauthorized - Usuario nao autenticado</span>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-red-500/20 text-red-400">403</Badge>
              <span className="text-sm text-zinc-400">Forbidden - Sem permissao para este recurso</span>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-red-500/20 text-red-400">404</Badge>
              <span className="text-sm text-zinc-400">Not Found - Recurso nao encontrado</span>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-red-500/20 text-red-400">500</Badge>
              <span className="text-sm text-zinc-400">Internal Server Error - Erro interno do servidor</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
