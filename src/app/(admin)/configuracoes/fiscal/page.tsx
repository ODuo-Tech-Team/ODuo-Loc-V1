"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Save,
  TestTube,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  RotateCcw,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { ConfigTabs } from "@/components/config"

interface FiscalConfig {
  // Dados do tenant
  cnpj: string
  inscricaoEstadual: string
  inscricaoMunicipal: string
  regimeTributario: string
  codigoMunicipio: string
  nfseEnabled: boolean

  // Focus NFe
  focusNfeConfigured: boolean
  focusNfeEnvironment: string

  // NFS-e
  nfseSerie: string
  nfseProximoNumero: number
  codigoServico: string
  aliquotaIss: number
  issRetido: boolean

  // Template
  descricaoTemplate: string
}

const DEFAULT_TEMPLATE = `Locação de equipamentos conforme reserva #{bookingNumber}.
Período: {startDate} a {endDate} ({totalDays} dias).

Itens:
{itemsList}

Valor total: R$ {totalPrice}`

const TEMPLATE_VARIABLES = [
  { key: "{bookingNumber}", label: "Número da Reserva" },
  { key: "{startDate}", label: "Data de Início" },
  { key: "{endDate}", label: "Data de Fim" },
  { key: "{totalDays}", label: "Total de Dias" },
  { key: "{customerName}", label: "Nome do Cliente" },
  { key: "{itemsList}", label: "Lista de Itens" },
  { key: "{totalPrice}", label: "Valor Total" },
]

export default function ConfiguracaoFiscalPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<
    "unknown" | "success" | "error"
  >("unknown")

  const [config, setConfig] = useState<FiscalConfig>({
    cnpj: "",
    inscricaoEstadual: "",
    inscricaoMunicipal: "",
    regimeTributario: "",
    codigoMunicipio: "",
    nfseEnabled: false,
    focusNfeConfigured: false,
    focusNfeEnvironment: "HOMOLOGACAO",
    nfseSerie: "1",
    nfseProximoNumero: 1,
    codigoServico: "",
    aliquotaIss: 0,
    issRetido: false,
    descricaoTemplate: DEFAULT_TEMPLATE,
  })

  const [newToken, setNewToken] = useState("")
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/fiscal/config")
      if (response.ok) {
        const data = await response.json()
        setConfig({
          cnpj: data.cnpj || "",
          inscricaoEstadual: data.inscricaoEstadual || "",
          inscricaoMunicipal: data.inscricaoMunicipal || "",
          regimeTributario: data.regimeTributario || "",
          codigoMunicipio: data.codigoMunicipio || "",
          nfseEnabled: data.nfseEnabled || false,
          focusNfeConfigured: data.focusNfeConfigured || false,
          focusNfeEnvironment: data.focusNfeEnvironment || "HOMOLOGACAO",
          nfseSerie: data.nfseSerie || "1",
          nfseProximoNumero: data.nfseProximoNumero || 1,
          codigoServico: data.codigoServico || "",
          aliquotaIss: data.aliquotaIss || 0,
          issRetido: data.issRetido || false,
          descricaoTemplate: data.descricaoTemplate || DEFAULT_TEMPLATE,
        })
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error)
      toast.error("Erro ao carregar configuração fiscal")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        cnpj: config.cnpj,
        inscricaoEstadual: config.inscricaoEstadual,
        inscricaoMunicipal: config.inscricaoMunicipal,
        regimeTributario: config.regimeTributario,
        codigoMunicipio: config.codigoMunicipio,
        focusNfeEnvironment: config.focusNfeEnvironment,
        nfseSerie: config.nfseSerie,
        codigoServico: config.codigoServico,
        aliquotaIss: config.aliquotaIss,
        issRetido: config.issRetido,
        descricaoTemplate: config.descricaoTemplate,
      }

      // Se tem novo token, incluir
      if (newToken) {
        payload.focusNfeToken = newToken
      }

      const response = await fetch("/api/fiscal/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success("Configuração salva com sucesso!")
        setNewToken("")
        fetchConfig()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao salvar")
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      toast.error("Erro ao salvar configuração")
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setConnectionStatus("unknown")

    try {
      const response = await fetch("/api/fiscal/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: newToken || undefined,
          environment: config.focusNfeEnvironment,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setConnectionStatus("success")
        toast.success("Conexão estabelecida com sucesso!")
      } else {
        setConnectionStatus("error")
        toast.error(data.error || "Falha na conexão")
      }
    } catch (error) {
      console.error("Erro ao testar conexão:", error)
      setConnectionStatus("error")
      toast.error("Erro ao testar conexão")
    } finally {
      setTesting(false)
    }
  }

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    return numbers
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18)
  }

  const getPreviewText = () => {
    let preview = config.descricaoTemplate
    preview = preview.replace("{bookingNumber}", "RES-001")
    preview = preview.replace("{startDate}", "01/12/2025")
    preview = preview.replace("{endDate}", "05/12/2025")
    preview = preview.replace("{totalDays}", "5")
    preview = preview.replace("{customerName}", "João da Silva")
    preview = preview.replace(
      "{itemsList}",
      "- Gerador 50kVA (2x) - R$ 500,00\n- Compressor (1x) - R$ 200,00"
    )
    preview = preview.replace("{totalPrice}", "1.200,00")
    return preview
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold font-headline tracking-wide">
            Configurações Fiscais
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure a emissão de NFS-e via Focus NFe
          </p>
        </div>
        <div className="flex items-center gap-4">
          {!config.nfseEnabled && (
            <Badge variant="outline" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              NFS-e Desabilitada
            </Badge>
          )}
          <Link href="/notas-fiscais">
            <Button variant="outline">Ver Notas Fiscais</Button>
          </Link>
        </div>
      </div>

      {/* Config Tabs */}
      <ConfigTabs activeTab="fiscal" />

      <Tabs defaultValue="empresa" className="space-y-6">
        <TabsList>
          <TabsTrigger value="empresa">Dados da Empresa</TabsTrigger>
          <TabsTrigger value="focusnfe">Focus NFe</TabsTrigger>
          <TabsTrigger value="nfse">Configuração NFS-e</TabsTrigger>
          <TabsTrigger value="template">Template de Descrição</TabsTrigger>
        </TabsList>

        {/* Dados da Empresa */}
        <TabsContent value="empresa">
          <Card>
            <CardHeader>
              <CardTitle>Dados Fiscais da Empresa</CardTitle>
              <CardDescription>
                Informações necessárias para emissão de NFS-e
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={config.cnpj}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        cnpj: formatCNPJ(e.target.value),
                      })
                    }
                    maxLength={18}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inscricaoMunicipal">
                    Inscrição Municipal *
                  </Label>
                  <Input
                    id="inscricaoMunicipal"
                    placeholder="Número da IM"
                    value={config.inscricaoMunicipal}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        inscricaoMunicipal: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inscricaoEstadual">
                    Inscrição Estadual (opcional)
                  </Label>
                  <Input
                    id="inscricaoEstadual"
                    placeholder="Número da IE"
                    value={config.inscricaoEstadual}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        inscricaoEstadual: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigoMunicipio">
                    Código do Município (IBGE) *
                  </Label>
                  <Input
                    id="codigoMunicipio"
                    placeholder="Ex: 3550308 (São Paulo)"
                    value={config.codigoMunicipio}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        codigoMunicipio: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    maxLength={7}
                  />
                  <p className="text-xs text-muted-foreground">
                    Consulte o código IBGE do seu município
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="regimeTributario">Regime Tributário</Label>
                  <Select
                    value={config.regimeTributario}
                    onValueChange={(value) =>
                      setConfig({ ...config, regimeTributario: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o regime" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SIMPLES_NACIONAL">
                        Simples Nacional
                      </SelectItem>
                      <SelectItem value="SIMPLES_NACIONAL_EXCESSO">
                        Simples Nacional - Excesso de sublimite
                      </SelectItem>
                      <SelectItem value="LUCRO_PRESUMIDO">
                        Lucro Presumido
                      </SelectItem>
                      <SelectItem value="LUCRO_REAL">Lucro Real</SelectItem>
                      <SelectItem value="MEI">MEI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Focus NFe */}
        <TabsContent value="focusnfe">
          <Card>
            <CardHeader>
              <CardTitle>Credenciais Focus NFe</CardTitle>
              <CardDescription>
                Configure sua conta do Focus NFe para emissão de NFS-e
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <p className="font-medium">Status da Conexão</p>
                  <p className="text-sm text-muted-foreground">
                    {config.focusNfeConfigured
                      ? "Token configurado"
                      : "Token não configurado"}
                  </p>
                </div>
                {connectionStatus === "success" && (
                  <Badge className="gap-1 bg-green-500">
                    <CheckCircle className="h-3 w-3" />
                    Conectado
                  </Badge>
                )}
                {connectionStatus === "error" && (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Erro
                  </Badge>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="focusNfeEnvironment">Ambiente</Label>
                  <Select
                    value={config.focusNfeEnvironment}
                    onValueChange={(value) =>
                      setConfig({ ...config, focusNfeEnvironment: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HOMOLOGACAO">
                        Homologação (Testes)
                      </SelectItem>
                      <SelectItem value="PRODUCAO">Produção</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Use Homologação para testes antes de ir para Produção
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="focusNfeToken">
                    Token da API{" "}
                    {config.focusNfeConfigured && "(deixe vazio para manter)"}
                  </Label>
                  <Input
                    id="focusNfeToken"
                    type="password"
                    autoComplete="new-password"
                    placeholder={
                      config.focusNfeConfigured
                        ? "••••••••••••••••"
                        : "Cole seu token aqui"
                    }
                    value={newToken}
                    onChange={(e) => setNewToken(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testing || (!newToken && !config.focusNfeConfigured)}
                >
                  {testing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Testar Conexão
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuração NFS-e */}
        <TabsContent value="nfse">
          <Card>
            <CardHeader>
              <CardTitle>Configuração da NFS-e</CardTitle>
              <CardDescription>
                Defina os valores padrão para emissão de notas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nfseSerie">Série</Label>
                  <Input
                    id="nfseSerie"
                    value={config.nfseSerie}
                    onChange={(e) =>
                      setConfig({ ...config, nfseSerie: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigoServico">
                    Código do Serviço (LC 116)
                  </Label>
                  <Input
                    id="codigoServico"
                    placeholder="Ex: 17.05"
                    value={config.codigoServico}
                    onChange={(e) =>
                      setConfig({ ...config, codigoServico: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Código da lista de serviços anexa à LC 116/2003
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aliquotaIss">Alíquota ISS (%)</Label>
                  <Input
                    id="aliquotaIss"
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={config.aliquotaIss}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        aliquotaIss: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <Label htmlFor="issRetido">ISS Retido</Label>
                    <p className="text-sm text-muted-foreground">
                      Marque se o ISS é retido pelo tomador
                    </p>
                  </div>
                  <Switch
                    id="issRetido"
                    checked={config.issRetido}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, issRetido: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Template de Descrição */}
        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle>Template de Descrição do Serviço</CardTitle>
              <CardDescription>
                Configure como a descrição do serviço aparecerá na NFS-e
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="descricaoTemplate">Template</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {showPreview ? "Esconder" : "Preview"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setConfig({
                          ...config,
                          descricaoTemplate: DEFAULT_TEMPLATE,
                        })
                      }
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Restaurar Padrão
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="descricaoTemplate"
                  rows={8}
                  value={config.descricaoTemplate}
                  onChange={(e) =>
                    setConfig({ ...config, descricaoTemplate: e.target.value })
                  }
                  className="font-mono text-sm"
                />
              </div>

              {/* Variáveis disponíveis */}
              <div className="space-y-2">
                <Label>Variáveis Disponíveis</Label>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATE_VARIABLES.map((variable) => (
                    <Badge
                      key={variable.key}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() =>
                        setConfig({
                          ...config,
                          descricaoTemplate:
                            config.descricaoTemplate + variable.key,
                        })
                      }
                    >
                      {variable.key} - {variable.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {showPreview && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="p-4 rounded-lg bg-muted/50 whitespace-pre-wrap font-mono text-sm">
                    {getPreviewText()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar Configurações
        </Button>
      </div>
    </div>
  )
}
