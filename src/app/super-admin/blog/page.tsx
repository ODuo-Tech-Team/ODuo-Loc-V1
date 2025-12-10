"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  FileText,
  FolderOpen,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface BlogPost {
  id: string
  title: string
  slug: string
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED"
  publishedAt: string | null
  scheduledAt: string | null
  category: { name: string; color: string } | null
  author: { name: string }
  seoScore: number | null
  createdAt: string
}

const statusConfig = {
  DRAFT: { label: "Rascunho", color: "bg-gray-500" },
  PUBLISHED: { label: "Publicado", color: "bg-green-500" },
  SCHEDULED: { label: "Agendado", color: "bg-blue-500" },
  ARCHIVED: { label: "Arquivado", color: "bg-red-500" },
}

export default function BlogPage() {
  const [search, setSearch] = useState("")
  const queryClient = useQueryClient()

  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const res = await fetch("/api/super-admin/blog")
      if (!res.ok) throw new Error("Erro ao carregar posts")
      return res.json()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/super-admin/blog/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao deletar post")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] })
      toast.success("Post deletado com sucesso")
    },
    onError: () => {
      toast.error("Erro ao deletar post")
    },
  })

  const filteredPosts = posts?.filter(
    (post) =>
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.slug.toLowerCase().includes(search.toLowerCase())
  )

  const getSeoScoreColor = (score: number | null) => {
    if (!score) return "text-gray-400"
    if (score >= 80) return "text-green-400"
    if (score >= 50) return "text-yellow-400"
    return "text-red-400"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-cyan-400" />
            Blog
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Gerencie os posts do blog institucional
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/super-admin/blog/categorias">
            <Button variant="outline" className="border-white/10 bg-white/5">
              <FolderOpen className="h-4 w-4 mr-2" />
              Categorias
            </Button>
          </Link>
          <Link href="/super-admin/blog/novo">
            <Button className="bg-cyan-600 hover:bg-cyan-500">
              <Plus className="h-4 w-4 mr-2" />
              Novo Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white/5 border-white/10"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : !filteredPosts?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <FileText className="h-12 w-12 mb-4 opacity-50" />
            <p>Nenhum post encontrado</p>
            <Link href="/super-admin/blog/novo" className="mt-4">
              <Button variant="outline" size="sm">
                Criar primeiro post
              </Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-gray-400">Título</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Categoria</TableHead>
                <TableHead className="text-gray-400">SEO</TableHead>
                <TableHead className="text-gray-400">Data</TableHead>
                <TableHead className="text-gray-400 w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.map((post) => (
                <TableRow key={post.id} className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <div>
                      <p className="font-medium text-white">{post.title}</p>
                      <p className="text-sm text-gray-500">/{post.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${statusConfig[post.status].color} text-white`}
                    >
                      {statusConfig[post.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {post.category ? (
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: post.category.color,
                          color: post.category.color,
                        }}
                      >
                        {post.category.name}
                      </Badge>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${getSeoScoreColor(post.seoScore)}`}>
                      {post.seoScore ?? "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-400">
                    {post.publishedAt
                      ? format(new Date(post.publishedAt), "dd/MM/yyyy", { locale: ptBR })
                      : post.scheduledAt
                      ? `Agendado: ${format(new Date(post.scheduledAt), "dd/MM/yyyy", { locale: ptBR })}`
                      : format(new Date(post.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/super-admin/blog/${post.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        {post.status === "PUBLISHED" && (
                          <DropdownMenuItem asChild>
                            <a href={`/blog/${post.slug}`} target="_blank">
                              <Eye className="h-4 w-4 mr-2" />
                              Ver no site
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-red-400"
                          onClick={() => {
                            if (confirm("Deseja realmente deletar este post?")) {
                              deleteMutation.mutate(post.id)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Deletar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
