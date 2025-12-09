"use client"

import { useState } from "react"
import { Plus, TrendingUp, Target, DollarSign, Users, Eye, MousePointer, Play, Pause, Edit, Trash2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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

interface Campaign {
  id: string
  name: string
  platform: "Google Ads" | "Meta Ads" | "Google My Business"
  status: "active" | "paused" | "completed"
  budget: number
  spent: number
  impressions: number
  clicks: number
  conversions: number
  startDate: string
  endDate: string
}

const mockCampaigns: Campaign[] = [
  {
    id: "1",
    name: "Campanha Verão 2024 - Aluguel de Equipamentos",
    platform: "Google Ads",
    status: "active",
    budget: 5000,
    spent: 3250,
    impressions: 125000,
    clicks: 3250,
    conversions: 85,
    startDate: "2024-01-01",
    endDate: "2024-03-31",
  },
  {
    id: "2",
    name: "Promoção Black Friday - Locação",
    platform: "Meta Ads",
    status: "completed",
    budget: 3000,
    spent: 2980,
    impressions: 85000,
    clicks: 2100,
    conversions: 52,
    startDate: "2023-11-20",
    endDate: "2023-11-30",
  },
  {
    id: "3",
    name: "Divulgação Local - Google Meu Negócio",
    platform: "Google My Business",
    status: "active",
    budget: 1500,
    spent: 890,
    impressions: 45000,
    clicks: 1250,
    conversions: 28,
    startDate: "2024-01-15",
    endDate: "2024-04-15",
  },
  {
    id: "4",
    name: "Anúncio Instagram - Equipamentos Construção",
    platform: "Meta Ads",
    status: "paused",
    budget: 2000,
    spent: 1200,
    impressions: 55000,
    clicks: 1500,
    conversions: 30,
    startDate: "2023-12-01",
    endDate: "2024-02-28",
  },
]

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns)
  const [createDialog, setCreateDialog] = useState(false)
  const [campaignName, setCampaignName] = useState("")
  const [platform, setPlatform] = useState("")
  const [budget, setBudget] = useState("")

  // Calcular métricas totais
  const totalStats = {
    campaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === "active").length,
    totalSpent: campaigns.reduce((sum, c) => sum + c.spent, 0),
    totalImpressions: campaigns.reduce((sum, c) => sum + c.impressions, 0),
    totalClicks: campaigns.reduce((sum, c) => sum + c.clicks, 0),
    totalConversions: campaigns.reduce((sum, c) => sum + c.conversions, 0),
  }

  const ctr = totalStats.totalImpressions > 0
    ? ((totalStats.totalClicks / totalStats.totalImpressions) * 100).toFixed(2)
    : "0"

  const conversionRate = totalStats.totalClicks > 0
    ? ((totalStats.totalConversions / totalStats.totalClicks) * 100).toFixed(2)
    : "0"

  const cpc = totalStats.totalClicks > 0
    ? (totalStats.totalSpent / totalStats.totalClicks).toFixed(2)
    : "0"

  const handleCreateCampaign = () => {
    if (!campaignName || !platform || !budget) {
      toast.error("Preencha todos os campos")
      return
    }

    toast.success("Campanha criada com sucesso! (exemplo)")
    setCreateDialog(false)
    setCampaignName("")
    setPlatform("")
    setBudget("")
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "Google Ads":
        return "bg-primary"
      case "Meta Ads":
        return "bg-secondary"
      case "Google My Business":
        return "bg-accent"
      default:
        return "bg-muted-foreground"
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 font-headline tracking-wide">ODuo Marketing</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            CoPilot de Crescimento - Gerencie suas campanhas de marketing
          </p>
        </div>
        <Dialog open={createDialog} onOpenChange={setCreateDialog}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Campanha</DialogTitle>
              <DialogDescription>
                Configure uma nova campanha de marketing
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="campaignName">Nome da Campanha *</Label>
                <Input
                  id="campaignName"
                  placeholder="Ex: Campanha Verão 2024"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">Plataforma *</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Google Ads">Google Ads</SelectItem>
                    <SelectItem value="Meta Ads">Meta Ads (Facebook/Instagram)</SelectItem>
                    <SelectItem value="Google My Business">Google Meu Negócio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Orçamento (R$) *</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="5000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva os objetivos da campanha..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateCampaign} className="flex-1">
                  Criar Campanha
                </Button>
                <Button variant="outline" onClick={() => setCreateDialog(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Investimento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalStats.totalSpent.toLocaleString("pt-BR")}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalStats.activeCampaigns} campanhas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Impressões</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(totalStats.totalImpressions / 1000).toFixed(1)}k
            </div>
            <p className="text-xs text-muted-foreground">CTR: {ctr}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Cliques</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalStats.totalClicks.toLocaleString("pt-BR")}
            </div>
            <p className="text-xs text-muted-foreground">CPC: R$ {cpc}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Conversões</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalConversions}</div>
            <p className="text-xs text-muted-foreground">Taxa: {conversionRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg font-headline tracking-wide">Campanhas</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Gerencie todas as suas campanhas de marketing</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 h-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm">Todas ({campaigns.length})</TabsTrigger>
              <TabsTrigger value="active" className="text-xs sm:text-sm">
                Ativas ({campaigns.filter(c => c.status === "active").length})
              </TabsTrigger>
              <TabsTrigger value="paused" className="text-xs sm:text-sm">
                Pausadas ({campaigns.filter(c => c.status === "paused").length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs sm:text-sm">
                Concluídas ({campaigns.filter(c => c.status === "completed").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 sm:space-y-4">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                >
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <h3 className="font-medium text-sm sm:text-base truncate">{campaign.name}</h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={`${getPlatformColor(campaign.platform)} text-xs`}>
                            {campaign.platform}
                          </Badge>
                          {campaign.status === "active" && (
                            <Badge className="bg-green-600 text-xs">Ativa</Badge>
                          )}
                          {campaign.status === "paused" && (
                            <Badge variant="secondary" className="text-xs">Pausada</Badge>
                          )}
                          {campaign.status === "completed" && (
                            <Badge variant="outline" className="text-xs">Concluída</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {new Date(campaign.startDate).toLocaleDateString("pt-BR")} -{" "}
                        {new Date(campaign.endDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <p className="text-muted-foreground">Orçamento</p>
                        <p className="font-medium">
                          R$ {campaign.budget.toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Gasto</p>
                        <p className="font-medium">
                          R$ {campaign.spent.toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Impressões</p>
                        <p className="font-medium">
                          {(campaign.impressions / 1000).toFixed(1)}k
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cliques</p>
                        <p className="font-medium">
                          {campaign.clicks.toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Conversões</p>
                        <p className="font-medium">{campaign.conversions}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
                        <span>Progresso do orçamento</span>
                        <span>{((campaign.spent / campaign.budget) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${Math.min((campaign.spent / campaign.budget) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 sm:ml-4 justify-end sm:justify-start">
                    {campaign.status === "active" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toast.info("Campanha pausada (exemplo)")}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {campaign.status === "paused" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toast.info("Campanha retomada (exemplo)")}
                      >
                        <Play className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toast.info("Editar campanha (exemplo)")}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toast.info("Deletar campanha (exemplo)")}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {campaigns.filter(c => c.status === "active").length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhuma campanha ativa
                </p>
              ) : (
                campaigns
                  .filter(c => c.status === "active")
                  .map((campaign) => (
                    <div key={campaign.id} className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">{campaign.name}</h3>
                      {/* Mesma estrutura do card acima */}
                    </div>
                  ))
              )}
            </TabsContent>

            <TabsContent value="paused" className="space-y-4">
              {campaigns.filter(c => c.status === "paused").length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhuma campanha pausada
                </p>
              ) : (
                campaigns
                  .filter(c => c.status === "paused")
                  .map((campaign) => (
                    <div key={campaign.id} className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">{campaign.name}</h3>
                    </div>
                  ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {campaigns.filter(c => c.status === "completed").length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhuma campanha concluída
                </p>
              ) : (
                campaigns
                  .filter(c => c.status === "completed")
                  .map((campaign) => (
                    <div key={campaign.id} className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">{campaign.name}</h3>
                    </div>
                  ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-headline tracking-wide">Melhores Campanhas</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Por taxa de conversão</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {campaigns
                .sort((a, b) =>
                  (b.conversions / b.clicks) - (a.conversions / a.clicks)
                )
                .slice(0, 3)
                .map((campaign, index) => (
                  <div key={campaign.id} className="flex items-center gap-3">
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">{campaign.name}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {campaign.conversions} conversões •{" "}
                        {((campaign.conversions / campaign.clicks) * 100).toFixed(2)}% taxa
                      </p>
                    </div>
                    <TrendingUp className="h-4 w-4 flex-shrink-0 text-green-600" />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-headline tracking-wide">Distribuição por Plataforma</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Investimento por canal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["Google Ads", "Meta Ads", "Google My Business"].map((platform) => {
                const platformCampaigns = campaigns.filter(c => c.platform === platform)
                const totalSpent = platformCampaigns.reduce((sum, c) => sum + c.spent, 0)
                const percentage = totalStats.totalSpent > 0
                  ? ((totalSpent / totalStats.totalSpent) * 100).toFixed(0)
                  : "0"

                return (
                  <div key={platform} className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 text-xs sm:text-sm">
                      <span className="font-medium sm:font-normal">{platform}</span>
                      <span className="font-medium">
                        R$ {totalSpent.toLocaleString("pt-BR")} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getPlatformColor(platform)} transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
