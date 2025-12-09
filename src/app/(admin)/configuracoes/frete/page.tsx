"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Truck,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ConfigTabs } from "@/components/config"

interface FreightRegion {
  id: string
  name: string
  cities: string[]
  price: number
  createdAt: string
}

export default function FreteConfigPage() {
  const [regions, setRegions] = useState<FreightRegion[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<FreightRegion | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    cities: "",
    price: "",
  })

  useEffect(() => {
    fetchRegions()
  }, [])

  const fetchRegions = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/freight-regions")
      if (res.ok) {
        const data = await res.json()
        setRegions(data.regions || [])
      }
    } catch (error) {
      toast.error("Erro ao carregar regiões")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      cities: "",
      price: "",
    })
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório")
      return
    }

    if (!formData.price) {
      toast.error("Preço é obrigatório")
      return
    }

    setIsSubmitting(true)
    try {
      const cities = formData.cities
        .split(",")
        .map(c => c.trim())
        .filter(c => c.length > 0)

      const res = await fetch("/api/freight-regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          cities,
          price: parseFloat(formData.price),
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao criar região")
      }

      toast.success("Região criada com sucesso!")
      setIsCreateOpen(false)
      resetForm()
      fetchRegions()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedRegion || !formData.name.trim()) {
      toast.error("Nome é obrigatório")
      return
    }

    setIsSubmitting(true)
    try {
      const cities = formData.cities
        .split(",")
        .map(c => c.trim())
        .filter(c => c.length > 0)

      const res = await fetch(`/api/freight-regions/${selectedRegion.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          cities,
          price: parseFloat(formData.price),
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao atualizar região")
      }

      toast.success("Região atualizada com sucesso!")
      setIsEditOpen(false)
      setSelectedRegion(null)
      resetForm()
      fetchRegions()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedRegion) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/freight-regions/${selectedRegion.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao excluir região")
      }

      toast.success("Região excluída com sucesso!")
      setIsDeleteOpen(false)
      setSelectedRegion(null)
      fetchRegions()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (region: FreightRegion) => {
    setSelectedRegion(region)
    setFormData({
      name: region.name,
      cities: region.cities.join(", "),
      price: region.price.toString(),
    })
    setIsEditOpen(true)
  }

  const openDeleteDialog = (region: FreightRegion) => {
    setSelectedRegion(region)
    setIsDeleteOpen(true)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold font-headline tracking-wide flex items-center gap-3">
            <Truck className="h-8 w-8 text-primary" />
            Regiões de Frete
          </h1>
          <p className="text-muted-foreground">
            Configure as regiões e valores de frete para entrega
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Região
        </Button>
      </div>

      {/* Config Tabs */}
      <ConfigTabs activeTab="frete" />

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {regions.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Nenhuma região cadastrada</h3>
              <p className="text-muted-foreground mt-2">
                Adicione regiões de frete para usar nos orçamentos.
              </p>
              <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Região
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cidades</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regions.map((region) => (
                  <TableRow key={region.id}>
                    <TableCell className="font-medium">{region.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {region.cities.length > 0 ? (
                          region.cities.slice(0, 3).map((city, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {city}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                        {region.cities.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{region.cities.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatCurrency(region.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(region)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(region)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Região de Frete</DialogTitle>
            <DialogDescription>
              Cadastre uma nova região com valor de frete fixo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Região *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Zona Sul, Interior, Grande São Paulo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Valor do Frete (R$) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cities">Cidades (separadas por vírgula)</Label>
              <Input
                id="cities"
                value={formData.cities}
                onChange={(e) => setFormData({ ...formData, cities: e.target.value })}
                placeholder="Ex: São Paulo, Guarulhos, Osasco"
              />
              <p className="text-xs text-muted-foreground">
                Liste as cidades atendidas por esta região (opcional)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar Região"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Região</DialogTitle>
            <DialogDescription>Atualize as informações da região de frete.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome da Região *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Valor do Frete (R$) *</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cities">Cidades (separadas por vírgula)</Label>
              <Input
                id="edit-cities"
                value={formData.cities}
                onChange={(e) => setFormData({ ...formData, cities: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false)
                setSelectedRegion(null)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Região</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a região{" "}
              <strong>{selectedRegion?.name}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteOpen(false)
                setSelectedRegion(null)
              }}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
