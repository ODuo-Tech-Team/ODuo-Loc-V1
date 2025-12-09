"use client"

import { useState } from "react"
import { Copy, Check, Code, Lock, Database, Users, Package, Calendar } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface CodeExample {
  language: string
  code: string
}

interface Endpoint {
  method: string
  path: string
  description: string
  authRequired: boolean
  roles?: string[]
  requestExample?: CodeExample[]
  responseExample?: string
}

export default function ApiDocumentationPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const endpoints: Record<string, Endpoint[]> = {
    equipments: [
      {
        method: "GET",
        path: "/api/equipments",
        description: "Lista todos os equipamentos disponíveis",
        authRequired: true,
        requestExample: [
          {
            language: "javascript",
            code: `fetch('/api/equipments', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include'
})
  .then(res => res.json())
  .then(data => console.log(data))`
          },
          {
            language: "python",
            code: `import requests

response = requests.get(
    'https://seu-dominio.com/api/equipments',
    headers={'Content-Type': 'application/json'}
)
data = response.json()`
          }
        ],
        responseExample: `{
  "equipments": [
    {
      "id": "clx123...",
      "name": "Escavadeira Hidráulica",
      "category": "Construção",
      "pricePerDay": 350.00,
      "quantity": 5,
      "available": 3,
      "status": "AVAILABLE",
      "logo": ["https://..."],
      "description": "..."
    }
  ]
}`
      },
      {
        method: "GET",
        path: "/api/equipments/[id]",
        description: "Retorna detalhes de um equipamento específico",
        authRequired: true,
        requestExample: [
          {
            language: "javascript",
            code: `fetch('/api/equipments/clx123...', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include'
})
  .then(res => res.json())
  .then(data => console.log(data))`
          }
        ],
        responseExample: `{
  "id": "clx123...",
  "name": "Escavadeira Hidráulica",
  "category": "Construção",
  "pricePerDay": 350.00,
  "quantity": 5,
  "available": 3,
  "status": "AVAILABLE",
  "logo": ["https://..."],
  "description": "...",
  "createdAt": "2024-01-15T10:00:00Z"
}`
      },
      {
        method: "POST",
        path: "/api/equipments",
        description: "Cria um novo equipamento",
        authRequired: true,
        roles: ["ADMIN", "MANAGER"],
        requestExample: [
          {
            language: "javascript",
            code: `fetch('/api/equipments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    name: "Betoneira 400L",
    category: "Construção",
    pricePerDay: 80.00,
    quantity: 10,
    description: "Betoneira profissional",
    logo: []
  })
})
  .then(res => res.json())
  .then(data => console.log(data))`
          }
        ],
        responseExample: `{
  "id": "clx456...",
  "name": "Betoneira 400L",
  "category": "Construção",
  "pricePerDay": 80.00,
  "quantity": 10,
  "status": "AVAILABLE",
  "createdAt": "2024-01-15T10:00:00Z"
}`
      }
    ],
    customers: [
      {
        method: "GET",
        path: "/api/customers",
        description: "Lista todos os clientes",
        authRequired: true,
        requestExample: [
          {
            language: "javascript",
            code: `fetch('/api/customers', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include'
})
  .then(res => res.json())
  .then(data => console.log(data))`
          }
        ],
        responseExample: `{
  "customers": [
    {
      "id": "clx789...",
      "name": "João Silva",
      "email": "joao@empresa.com",
      "phone": "(11) 98765-4321",
      "cpf": "123.456.789-00",
      "address": "Rua A, 123",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}`
      },
      {
        method: "POST",
        path: "/api/customers",
        description: "Cadastra um novo cliente",
        authRequired: true,
        requestExample: [
          {
            language: "javascript",
            code: `fetch('/api/customers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    name: "Maria Santos",
    email: "maria@empresa.com",
    phone: "(11) 91234-5678",
    cpf: "987.654.321-00",
    address: "Av. B, 456"
  })
})
  .then(res => res.json())
  .then(data => console.log(data))`
          }
        ],
        responseExample: `{
  "id": "clx999...",
  "name": "Maria Santos",
  "email": "maria@empresa.com",
  "phone": "(11) 91234-5678",
  "cpf": "987.654.321-00",
  "createdAt": "2024-01-15T10:00:00Z"
}`
      }
    ],
    bookings: [
      {
        method: "GET",
        path: "/api/bookings",
        description: "Lista todas as reservas",
        authRequired: true,
        requestExample: [
          {
            language: "javascript",
            code: `fetch('/api/bookings', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include'
})
  .then(res => res.json())
  .then(data => console.log(data))`
          }
        ],
        responseExample: `{
  "bookings": [
    {
      "id": "clx111...",
      "startDate": "2024-02-01",
      "endDate": "2024-02-05",
      "totalPrice": 1400.00,
      "status": "CONFIRMED",
      "customer": {
        "name": "João Silva",
        "email": "joao@empresa.com"
      },
      "equipment": {
        "name": "Escavadeira Hidráulica",
        "pricePerDay": 350.00
      }
    }
  ]
}`
      },
      {
        method: "POST",
        path: "/api/bookings",
        description: "Cria uma nova reserva",
        authRequired: true,
        requestExample: [
          {
            language: "javascript",
            code: `fetch('/api/bookings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    customerId: "clx789...",
    equipmentId: "clx123...",
    startDate: "2024-02-10",
    endDate: "2024-02-15",
    quantity: 1
  })
})
  .then(res => res.json())
  .then(data => console.log(data))`
          }
        ],
        responseExample: `{
  "id": "clx222...",
  "startDate": "2024-02-10",
  "endDate": "2024-02-15",
  "totalPrice": 1750.00,
  "status": "PENDING",
  "createdAt": "2024-01-15T10:00:00Z"
}`
      }
    ],
    users: [
      {
        method: "GET",
        path: "/api/users",
        description: "Lista todos os usuários do sistema",
        authRequired: true,
        roles: ["ADMIN", "SUPER_ADMIN"],
        requestExample: [
          {
            language: "javascript",
            code: `fetch('/api/users', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include'
})
  .then(res => res.json())
  .then(data => console.log(data))`
          }
        ],
        responseExample: `{
  "users": [
    {
      "id": "clx333...",
      "name": "Admin User",
      "email": "admin@empresa.com",
      "role": "ADMIN",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}`
      }
    ]
  }

  const errorCodes = [
    { code: 200, description: "Requisição bem-sucedida" },
    { code: 201, description: "Recurso criado com sucesso" },
    { code: 400, description: "Dados inválidos ou requisição mal formatada" },
    { code: 401, description: "Não autenticado - faça login primeiro" },
    { code: 403, description: "Sem permissão para acessar este recurso" },
    { code: 404, description: "Recurso não encontrado" },
    { code: 500, description: "Erro interno do servidor" },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Code className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-headline tracking-wide">Documentação da API</h1>
        <p className="text-muted-foreground text-lg">
          Integre seu sistema com nossa API RESTful
        </p>
      </div>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <CardTitle className="font-headline tracking-wide">Autenticação</CardTitle>
          </div>
          <CardDescription>
            Como autenticar suas requisições
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            A API utiliza autenticação baseada em sessão. Você deve estar logado no sistema
            para fazer requisições. As requisições devem incluir cookies de sessão.
          </p>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-mono">
              credentials: 'include' // JavaScript Fetch
            </p>
          </div>
          <div className="flex items-start gap-2 p-4 bg-primary/10 dark:bg-primary/20 rounded-lg">
            <Lock className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">
                Importante
              </p>
              <p className="text-muted-foreground">
                Todas as requisições devem ser feitas de domínios autorizados.
                Requisições de origens não autorizadas serão bloqueadas por CORS.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline tracking-wide">Endpoints Disponíveis</CardTitle>
          <CardDescription>
            Explore os endpoints organizados por recurso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="equipments" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="equipments">
                <Package className="h-4 w-4 mr-2" />
                Equipamentos
              </TabsTrigger>
              <TabsTrigger value="customers">
                <Users className="h-4 w-4 mr-2" />
                Clientes
              </TabsTrigger>
              <TabsTrigger value="bookings">
                <Calendar className="h-4 w-4 mr-2" />
                Reservas
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                Usuários
              </TabsTrigger>
            </TabsList>

            {Object.entries(endpoints).map(([category, categoryEndpoints]) => (
              <TabsContent key={category} value={category} className="space-y-6">
                {categoryEndpoints.map((endpoint, index) => (
                  <div key={index} className="border rounded-lg p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              endpoint.method === "GET"
                                ? "default"
                                : endpoint.method === "POST"
                                ? "default"
                                : "destructive"
                            }
                            className={
                              endpoint.method === "GET"
                                ? "bg-green-600"
                                : endpoint.method === "POST"
                                ? "bg-primary"
                                : ""
                            }
                          >
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {endpoint.path}
                          </code>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {endpoint.description}
                        </p>
                        {endpoint.roles && (
                          <div className="flex items-center gap-2">
                            <Lock className="h-3 w-3 text-orange-600" />
                            <span className="text-xs text-orange-600">
                              Requer papel: {endpoint.roles.join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                      {endpoint.authRequired && (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    {endpoint.requestExample && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Exemplo de Requisição:</h4>
                        <Tabs defaultValue={endpoint.requestExample[0].language}>
                          <TabsList>
                            {endpoint.requestExample.map((example) => (
                              <TabsTrigger key={example.language} value={example.language}>
                                {example.language === "javascript" ? "JavaScript" : "Python"}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          {endpoint.requestExample.map((example) => (
                            <TabsContent key={example.language} value={example.language}>
                              <div className="relative">
                                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                  <code>{example.code}</code>
                                </pre>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="absolute top-2 right-2"
                                  onClick={() =>
                                    copyToClipboard(
                                      example.code,
                                      `${endpoint.path}-${example.language}`
                                    )
                                  }
                                >
                                  {copiedCode === `${endpoint.path}-${example.language}` ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TabsContent>
                          ))}
                        </Tabs>
                      </div>
                    )}

                    {endpoint.responseExample && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Exemplo de Resposta:</h4>
                        <div className="relative">
                          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                            <code>{endpoint.responseExample}</code>
                          </pre>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2"
                            onClick={() =>
                              copyToClipboard(
                                endpoint.responseExample!,
                                `${endpoint.path}-response`
                              )
                            }
                          >
                            {copiedCode === `${endpoint.path}-response` ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Error Codes */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline tracking-wide">Códigos de Status HTTP</CardTitle>
          <CardDescription>
            Códigos de resposta que a API pode retornar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {errorCodes.map((error) => (
              <div
                key={error.code}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      error.code >= 200 && error.code < 300
                        ? "default"
                        : error.code >= 400 && error.code < 500
                        ? "secondary"
                        : "destructive"
                    }
                    className={
                      error.code >= 200 && error.code < 300
                        ? "bg-green-600"
                        : error.code >= 400 && error.code < 500
                        ? "bg-accent"
                        : ""
                    }
                  >
                    {error.code}
                  </Badge>
                  <span className="text-sm">{error.description}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline tracking-wide">Boas Práticas</CardTitle>
          <CardDescription>
            Recomendações para usar a API de forma eficiente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <div>
                <strong>Sempre verifique o status HTTP</strong> antes de processar a resposta
              </div>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <div>
                <strong>Implemente retry logic</strong> para requisições que falharem por erro temporário
              </div>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <div>
                <strong>Use cache</strong> para dados que não mudam frequentemente
              </div>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <div>
                <strong>Valide os dados</strong> no cliente antes de enviar para a API
              </div>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <div>
                <strong>Trate erros adequadamente</strong> e forneça feedback claro ao usuário
              </div>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <div>
                <strong>Não exponha credenciais</strong> no código do cliente
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Rate Limiting */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-headline tracking-wide">Limites de Taxa</CardTitle>
          <CardDescription>
            Informações sobre limites de requisições
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Atualmente não há limites de taxa implementados, mas recomendamos fazer no máximo
            100 requisições por minuto para garantir a estabilidade do sistema. Limites mais
            rigorosos podem ser implementados no futuro.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
