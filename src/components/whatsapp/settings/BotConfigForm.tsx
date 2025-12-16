"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Sparkles,
  Info,
  Plus,
  X,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

interface BotConfig {
  enabled: boolean
  hasApiKey: boolean
  openaiModel: string
  temperature: number
  maxTokens: number
  systemPrompt: string | null
  includeEquipmentCatalog: boolean
  includeRentalPrices: boolean
  autoCreateLeads: boolean
  transferKeywords: string[]
  businessHours: Record<string, { start: string; end: string; enabled: boolean }> | null
  welcomeMessage: string | null
  awayMessage: string | null
  transferMessage: string | null
  closingMessage: string | null
}

interface BotConfigFormProps {
  config: BotConfig
  onSave: (updates: Partial<BotConfig> & { openaiApiKey?: string }) => Promise<boolean>
  saving: boolean
}

const DEFAULT_SYSTEM_PROMPT = `Voce e um assistente virtual de uma locadora de equipamentos. Seja educado, profissional e prestativo.

Suas responsabilidades:
- Responder duvidas sobre equipamentos disponiveis
- Informar sobre precos e condicoes de locacao
- Agendar visitas ou demonstracoes
- Coletar informacoes de contato de potenciais clientes

Sempre que o cliente demonstrar interesse, colete:
- Nome completo
- Telefone de contato
- Equipamento de interesse
- Periodo desejado de locacao

Se nao souber responder algo, sugira falar com um atendente humano.`

const PROMPT_VARIABLES = [
  { key: "{{empresa}}", label: "Nome da empresa" },
  { key: "{{catalogo}}", label: "Catalogo de equipamentos" },
  { key: "{{horario}}", label: "Horario de funcionamento" },
  { key: "{{contato}}", label: "Contato da empresa" },
]

export function BotConfigForm({ config, onSave, saving }: BotConfigFormProps) {
  const [enabled, setEnabled] = useState(config.enabled)
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [model, setModel] = useState(config.openaiModel)
  const [temperature, setTemperature] = useState(config.temperature)
  const [maxTokens, setMaxTokens] = useState(config.maxTokens)
  const [systemPrompt, setSystemPrompt] = useState(config.systemPrompt || DEFAULT_SYSTEM_PROMPT)
  const [includeEquipmentCatalog, setIncludeEquipmentCatalog] = useState(config.includeEquipmentCatalog)
  const [includeRentalPrices, setIncludeRentalPrices] = useState(config.includeRentalPrices)
  const [autoCreateLeads, setAutoCreateLeads] = useState(config.autoCreateLeads)
  const [transferKeywords, setTransferKeywords] = useState<string[]>(config.transferKeywords)
  const [newKeyword, setNewKeyword] = useState("")

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !transferKeywords.includes(newKeyword.trim().toLowerCase())) {
      setTransferKeywords([...transferKeywords, newKeyword.trim().toLowerCase()])
      setNewKeyword("")
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    setTransferKeywords(transferKeywords.filter((k) => k !== keyword))
  }

  const insertVariable = (variable: string) => {
    setSystemPrompt((prev) => prev + " " + variable)
  }

  const handleSave = async () => {
    const updates: Partial<BotConfig> & { openaiApiKey?: string } = {
      enabled,
      openaiModel: model,
      temperature,
      maxTokens,
      systemPrompt,
      includeEquipmentCatalog,
      includeRentalPrices,
      autoCreateLeads,
      transferKeywords,
    }

    if (apiKey) {
      updates.openaiApiKey = apiKey
    }

    const success = await onSave(updates)
    if (success && apiKey) {
      setApiKey("")
    }
  }

  return (
    <div className="space-y-6">
      {/* Status do Bot */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              <h3 className="text-lg font-semibold">Bot de IA</h3>
            </div>
            <p className="text-sm text-zinc-500">
              Ative o bot para responder automaticamente as mensagens
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
            disabled={!config.hasApiKey && !apiKey}
          />
        </div>

        {!config.hasApiKey && !apiKey && (
          <p className="mt-4 text-sm text-amber-500">
            Configure sua chave da API OpenAI abaixo para habilitar o bot.
          </p>
        )}
      </div>

      {/* Chave da API */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Chave da API OpenAI</h3>
            <p className="text-sm text-zinc-500">
              Necessaria para o funcionamento do bot de IA
            </p>
          </div>
          {config.hasApiKey && (
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/50">
              <CheckCircle className="h-3 w-3 mr-1" />
              Configurada
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <Label>Nova chave (deixe em branco para manter a atual)</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="pr-10 bg-zinc-800 border-zinc-700"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <p className="text-xs text-zinc-500">
            Obtenha sua chave em{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-500 hover:underline"
            >
              platform.openai.com
            </a>
          </p>
        </div>
      </div>

      {/* Configuracoes do Modelo */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6">
        <h3 className="text-lg font-semibold">Configuracoes do Modelo</h3>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Modelo</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini (Economico)</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o (Avancado)</SelectItem>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-500">GPT-4o Mini e recomendado para a maioria dos casos</p>
          </div>

          <div className="space-y-2">
            <Label>Max Tokens: {maxTokens}</Label>
            <input
              type="range"
              value={maxTokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
              min={100}
              max={2000}
              step={100}
              className="w-full mt-2 accent-emerald-500"
            />
            <p className="text-xs text-zinc-500">Limite de tokens na resposta</p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Temperatura: {temperature.toFixed(1)}</Label>
            <input
              type="range"
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              min={0}
              max={1}
              step={0.1}
              className="w-full mt-2 accent-emerald-500"
            />
            <p className="text-xs text-zinc-500">
              Menor = mais focado e determinista. Maior = mais criativo e variado.
            </p>
          </div>
        </div>
      </div>

      {/* System Prompt */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Instrucoes do Bot (System Prompt)</h3>
            <p className="text-sm text-zinc-500">
              Defina a personalidade e comportamento do bot
            </p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-zinc-500" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>O system prompt define como o bot deve se comportar e responder.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Variaveis */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-zinc-500">Inserir variavel:</span>
          {PROMPT_VARIABLES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => insertVariable(key)}
              className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700"
            >
              {label}
            </button>
          ))}
        </div>

        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder={DEFAULT_SYSTEM_PROMPT}
          className="w-full h-64 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg resize-none font-mono text-sm"
        />

        <Button
          variant="outline"
          size="sm"
          onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
          className="text-xs"
        >
          Restaurar padrao
        </Button>
      </div>

      {/* Comportamento */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Comportamento</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Incluir catalogo de equipamentos</Label>
              <p className="text-xs text-zinc-500">O bot tera acesso ao catalogo para responder</p>
            </div>
            <Switch checked={includeEquipmentCatalog} onCheckedChange={setIncludeEquipmentCatalog} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Incluir precos de locacao</Label>
              <p className="text-xs text-zinc-500">O bot podera informar precos aos clientes</p>
            </div>
            <Switch checked={includeRentalPrices} onCheckedChange={setIncludeRentalPrices} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Criar leads automaticamente</Label>
              <p className="text-xs text-zinc-500">Criar lead quando o bot coletar dados do cliente</p>
            </div>
            <Switch checked={autoCreateLeads} onCheckedChange={setAutoCreateLeads} />
          </div>
        </div>
      </div>

      {/* Palavras de Transferencia */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Palavras para Atendimento Humano</h3>
          <p className="text-sm text-zinc-500">
            Quando o cliente usar essas palavras, o bot transferira para um atendente
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {transferKeywords.map((keyword) => (
            <Badge key={keyword} variant="secondary" className="gap-1 pl-2">
              {keyword}
              <button
                type="button"
                onClick={() => handleRemoveKeyword(keyword)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="Nova palavra..."
            className="bg-zinc-800 border-zinc-700"
            onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
          />
          <Button variant="outline" size="icon" onClick={handleAddKeyword}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Configuracoes"
          )}
        </Button>
      </div>
    </div>
  )
}
