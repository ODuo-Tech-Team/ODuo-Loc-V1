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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TemplateEditor } from "@/components/templates/template-editor"
import { DEFAULT_CONTRACT_TEMPLATE, DEFAULT_RECEIPT_TEMPLATE } from "@/lib/default-templates"
import { Save, Loader2, FileText, Receipt } from "lucide-react"
import { toast } from "sonner"
import { ConfigTabs } from "@/components/config"

interface TemplatesState {
  contractTemplate: string
  receiptTemplate: string
  isContractCustom: boolean
  isReceiptCustom: boolean
}

export default function ConfiguracaoTemplatesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("contrato")

  const [templates, setTemplates] = useState<TemplatesState>({
    contractTemplate: DEFAULT_CONTRACT_TEMPLATE,
    receiptTemplate: DEFAULT_RECEIPT_TEMPLATE,
    isContractCustom: false,
    isReceiptCustom: false,
  })

  const [hasChanges, setHasChanges] = useState({
    contract: false,
    receipt: false,
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/templates")
      if (response.ok) {
        const data = await response.json()
        setTemplates({
          contractTemplate: data.contractTemplate || DEFAULT_CONTRACT_TEMPLATE,
          receiptTemplate: data.receiptTemplate || DEFAULT_RECEIPT_TEMPLATE,
          isContractCustom: data.isContractCustom || false,
          isReceiptCustom: data.isReceiptCustom || false,
        })
      }
    } catch (error) {
      console.error("Erro ao carregar templates:", error)
      toast.error("Erro ao carregar templates")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: Record<string, string | boolean> = {}

      if (hasChanges.contract) {
        payload.contractTemplate = templates.contractTemplate
      }
      if (hasChanges.receipt) {
        payload.receiptTemplate = templates.receiptTemplate
      }

      const response = await fetch("/api/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao salvar")
      }

      toast.success("Templates salvos com sucesso!")
      setHasChanges({ contract: false, receipt: false })

      // Recarregar para atualizar status de customizado
      await fetchTemplates()
    } catch (error) {
      console.error("Erro ao salvar templates:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao salvar templates")
    } finally {
      setSaving(false)
    }
  }

  const handleResetContract = async () => {
    try {
      const response = await fetch("/api/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetContract: true }),
      })

      if (!response.ok) {
        throw new Error("Erro ao restaurar template")
      }

      setTemplates((prev) => ({
        ...prev,
        contractTemplate: DEFAULT_CONTRACT_TEMPLATE,
        isContractCustom: false,
      }))
      setHasChanges((prev) => ({ ...prev, contract: false }))
      toast.success("Template de contrato restaurado para o padrão")
    } catch (error) {
      toast.error("Erro ao restaurar template")
    }
  }

  const handleResetReceipt = async () => {
    try {
      const response = await fetch("/api/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetReceipt: true }),
      })

      if (!response.ok) {
        throw new Error("Erro ao restaurar template")
      }

      setTemplates((prev) => ({
        ...prev,
        receiptTemplate: DEFAULT_RECEIPT_TEMPLATE,
        isReceiptCustom: false,
      }))
      setHasChanges((prev) => ({ ...prev, receipt: false }))
      toast.success("Template de recibo restaurado para o padrão")
    } catch (error) {
      toast.error("Erro ao restaurar template")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold font-headline tracking-wide flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Templates de Documentos
          </h1>
          <p className="text-muted-foreground">
            Personalize os templates de contrato e recibo da sua empresa
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || (!hasChanges.contract && !hasChanges.receipt)}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </div>

      {/* Config Tabs */}
      <ConfigTabs activeTab="templates" />

      {/* Document Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="contrato" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Contrato
            {hasChanges.contract && (
              <span className="h-2 w-2 rounded-full bg-orange-500" />
            )}
          </TabsTrigger>
          <TabsTrigger value="recibo" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Recibo
            {hasChanges.receipt && (
              <span className="h-2 w-2 rounded-full bg-orange-500" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contrato" className="mt-4">
          <TemplateEditor
            value={templates.contractTemplate}
            onChange={(value) => {
              setTemplates((prev) => ({ ...prev, contractTemplate: value }))
              setHasChanges((prev) => ({ ...prev, contract: true }))
            }}
            onReset={handleResetContract}
            isCustom={templates.isContractCustom || hasChanges.contract}
            type="contract"
          />
        </TabsContent>

        <TabsContent value="recibo" className="mt-4">
          <TemplateEditor
            value={templates.receiptTemplate}
            onChange={(value) => {
              setTemplates((prev) => ({ ...prev, receiptTemplate: value }))
              setHasChanges((prev) => ({ ...prev, receipt: true }))
            }}
            onReset={handleResetReceipt}
            isCustom={templates.isReceiptCustom || hasChanges.receipt}
            type="receipt"
          />
        </TabsContent>
      </Tabs>

      {/* Help Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Como usar as variáveis</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            As variáveis são substituídas automaticamente pelos dados reais
            quando o documento é gerado. Use o formato{" "}
            <code className="bg-muted px-1 rounded">{"{nomeDaVariavel}"}</code>{" "}
            para inserir dados dinâmicos.
          </p>
          <p>
            Por exemplo,{" "}
            <code className="bg-muted px-1 rounded">{"{clienteNome}"}</code> será
            substituído pelo nome real do cliente na hora de gerar o documento.
          </p>
          <p>
            Clique em uma variável no painel lateral para inseri-la
            automaticamente no cursor, ou copie-a para colar manualmente.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
