"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  MapPin,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Star,
  Phone,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { SiteDialog, CustomerSite } from "./site-dialog"

interface CustomerSiteWithCount extends CustomerSite {
  _count?: {
    bookings: number
  }
}

interface CustomerSitesListProps {
  customerId: string
}

export function CustomerSitesList({ customerId }: CustomerSitesListProps) {
  const [sites, setSites] = useState<CustomerSiteWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSite, setEditingSite] = useState<CustomerSite | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [siteToDelete, setSiteToDelete] = useState<CustomerSite | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchSites = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/customers/${customerId}/sites`)
      if (response.ok) {
        const data = await response.json()
        setSites(data)
      }
    } catch (error) {
      console.error("Erro ao buscar locais:", error)
      toast.error("Erro ao carregar locais de obra")
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    fetchSites()
  }, [fetchSites])

  const handleEdit = (site: CustomerSite) => {
    setEditingSite(site)
    setDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!siteToDelete) return

    try {
      setDeleting(true)
      const response = await fetch(
        `/api/customers/${customerId}/sites/${siteToDelete.id}`,
        { method: "DELETE" }
      )

      if (response.ok) {
        toast.success("Local excluído com sucesso")
        fetchSites()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao excluir local")
      }
    } catch (error) {
      console.error("Erro ao excluir local:", error)
      toast.error("Erro ao excluir local")
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setSiteToDelete(null)
    }
  }

  const handleSetDefault = async (site: CustomerSite) => {
    try {
      const response = await fetch(
        `/api/customers/${customerId}/sites/${site.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isDefault: true }),
        }
      )

      if (response.ok) {
        toast.success("Local definido como padrão")
        fetchSites()
      } else {
        toast.error("Erro ao definir local padrão")
      }
    } catch (error) {
      console.error("Erro ao definir local padrão:", error)
      toast.error("Erro ao definir local padrão")
    }
  }

  const formatAddress = (site: CustomerSite) => {
    const parts = []
    if (site.street) {
      let address = site.street
      if (site.number) address += `, ${site.number}`
      if (site.complement) address += ` - ${site.complement}`
      parts.push(address)
    }
    if (site.neighborhood) parts.push(site.neighborhood)
    if (site.city && site.state) {
      parts.push(`${site.city}/${site.state}`)
    } else if (site.city) {
      parts.push(site.city)
    }
    if (site.zipCode) parts.push(`CEP: ${site.zipCode}`)
    return parts.join(" - ") || "Endereço não informado"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Locais de Obra
            </CardTitle>
            <CardDescription>
              Locais de entrega e obras vinculados a este cliente
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditingSite(null)
              setDialogOpen(true)
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Local
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sites.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">
              Nenhum local de obra cadastrado
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setEditingSite(null)
                setDialogOpen(true)
              }}
            >
              Cadastrar primeiro local
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Orçamentos</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.map((site) => (
                <TableRow key={site.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{site.name}</span>
                      {site.isDefault && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3" />
                          Padrão
                        </Badge>
                      )}
                      {!site.isActive && (
                        <Badge variant="outline" className="text-muted-foreground">
                          Inativo
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <span className="text-sm text-muted-foreground truncate block">
                      {formatAddress(site)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {site.contactName || site.contactPhone ? (
                      <div className="text-sm">
                        {site.contactName && <div>{site.contactName}</div>}
                        {site.contactPhone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {site.contactPhone}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {site._count?.bookings || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(site)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        {!site.isDefault && (
                          <DropdownMenuItem onClick={() => handleSetDefault(site)}>
                            <Star className="h-4 w-4 mr-2" />
                            Definir como padrão
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setSiteToDelete(site)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
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

      {/* Dialog de criação/edição */}
      <SiteDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditingSite(null)
        }}
        onSuccess={fetchSites}
        customerId={customerId}
        site={editingSite}
      />

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Local de Obra</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o local &quot;{siteToDelete?.name}&quot;?
              {(siteToDelete as CustomerSiteWithCount)?._count?.bookings ? (
                <span className="block mt-2 text-amber-600">
                  Este local possui {(siteToDelete as CustomerSiteWithCount)._count?.bookings} orçamento(s) vinculado(s)
                  e será desativado ao invés de excluído.
                </span>
              ) : (
                <span className="block mt-2">
                  Esta ação não pode ser desfeita.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
