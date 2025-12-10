"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import {
  ArrowLeft,
  Save,
  Eye,
  Settings,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"

interface BlogCategory {
  id: string
  name: string
  slug: string
  color: string | null
}

interface FormData {
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage: string
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED"
  categoryId: string
  tags: string[]
  metaTitle: string
  metaDescription: string
  focusKeyword: string
  ogTitle: string
  ogDescription: string
  noIndex: boolean
  noFollow: boolean
}

export default function NovoPostPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("content")
  const [formData, setFormData] = useState<FormData>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImage: "",
    status: "DRAFT",
    categoryId: "",
    tags: [],
    metaTitle: "",
    metaDescription: "",
    focusKeyword: "",
    ogTitle: "",
    ogDescription: "",
    noIndex: false,
    noFollow: false,
  })
  const [tagsInput, setTagsInput] = useState("")

  const { data: categories } = useQuery<BlogCategory[]>({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const res = await fetch("/api/super-admin/blog/categorias")
      if (!res.ok) throw new Error("Erro ao carregar categorias")
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch("/api/super-admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          categoryId: data.categoryId || null,
          seoScore: calculateSeoScore(),
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao criar post")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Post criado com sucesso")
      router.push("/super-admin/blog")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const handleAddTag = () => {
    if (tagsInput.trim() && !formData.tags.includes(tagsInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagsInput.trim()] })
      setTagsInput("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) })
  }

  // SEO Analysis
  const seoChecks = {
    titleHasKeyword: formData.focusKeyword
      ? formData.title.toLowerCase().includes(formData.focusKeyword.toLowerCase())
      : null,
    metaDescriptionHasKeyword: formData.focusKeyword && formData.metaDescription
      ? formData.metaDescription.toLowerCase().includes(formData.focusKeyword.toLowerCase())
      : null,
    titleLength: formData.title.length >= 30 && formData.title.length <= 60,
    metaDescriptionLength:
      formData.metaDescription.length >= 120 && formData.metaDescription.length <= 160,
    contentHasKeyword: formData.focusKeyword
      ? formData.content.toLowerCase().includes(formData.focusKeyword.toLowerCase())
      : null,
    excerptHasKeyword: formData.focusKeyword
      ? formData.excerpt.toLowerCase().includes(formData.focusKeyword.toLowerCase())
      : null,
    contentLength: formData.content.split(/\s+/).length >= 300,
    slugHasKeyword: formData.focusKeyword
      ? formData.slug.includes(formData.focusKeyword.toLowerCase().replace(/\s+/g, "-"))
      : null,
  }

  const calculateSeoScore = () => {
    if (!formData.focusKeyword) return 0

    const checks = [
      seoChecks.titleHasKeyword,
      seoChecks.metaDescriptionHasKeyword,
      seoChecks.titleLength,
      seoChecks.metaDescriptionLength,
      seoChecks.contentHasKeyword,
      seoChecks.excerptHasKeyword,
      seoChecks.contentLength,
      seoChecks.slugHasKeyword,
    ].filter((c) => c !== null)

    const passed = checks.filter((c) => c === true).length
    return Math.round((passed / checks.length) * 100)
  }

  const seoScore = calculateSeoScore()

  const getSeoScoreColor = () => {
    if (seoScore >= 80) return "text-green-400"
    if (seoScore >= 50) return "text-yellow-400"
    return "text-red-400"
  }

  const SeoCheckItem = ({
    label,
    check,
  }: {
    label: string
    check: boolean | null
  }) => {
    if (check === null) {
      return (
        <div className="flex items-center gap-2 text-gray-500">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{label}</span>
        </div>
      )
    }
    return (
      <div className={`flex items-center gap-2 ${check ? "text-green-400" : "text-red-400"}`}>
        {check ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        <span className="text-sm">{label}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/super-admin/blog">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Novo Post</h1>
        </div>
        <div className="flex gap-2">
          <Select
            value={formData.status}
            onValueChange={(value: FormData["status"]) =>
              setFormData({ ...formData, status: value })
            }
          >
            <SelectTrigger className="w-[150px] bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Rascunho</SelectItem>
              <SelectItem value="PUBLISHED">Publicar</SelectItem>
              <SelectItem value="SCHEDULED">Agendar</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="bg-cyan-600 hover:bg-cyan-500"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="content">Conteúdo</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        title: e.target.value,
                        slug: formData.slug || generateSlug(e.target.value),
                      })
                    }
                    placeholder="Título do post"
                    className="bg-white/5 border-white/10 text-lg"
                  />
                  <p className="text-xs text-gray-500">
                    {formData.title.length}/60 caracteres
                  </p>
                </div>

                {/* Slug */}
                <div className="space-y-2">
                  <Label>Slug (URL)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">/blog/</span>
                    <Input
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value })
                      }
                      placeholder="url-do-post"
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>

                {/* Excerpt */}
                <div className="space-y-2">
                  <Label>Resumo *</Label>
                  <Textarea
                    value={formData.excerpt}
                    onChange={(e) =>
                      setFormData({ ...formData, excerpt: e.target.value })
                    }
                    placeholder="Um breve resumo do post (aparece na listagem)"
                    rows={3}
                    className="bg-white/5 border-white/10"
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label>Conteúdo *</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder="Escreva o conteúdo do post aqui... (suporta HTML)"
                    rows={15}
                    className="bg-white/5 border-white/10 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    {formData.content.split(/\s+/).filter(Boolean).length} palavras
                  </p>
                </div>

                {/* Cover Image */}
                <div className="space-y-2">
                  <Label>Imagem de Capa</Label>
                  <Input
                    value={formData.coverImage}
                    onChange={(e) =>
                      setFormData({ ...formData, coverImage: e.target.value })
                    }
                    placeholder="URL da imagem de capa"
                    className="bg-white/5 border-white/10"
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, categoryId: value })
                    }
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sem categoria</SelectItem>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                      placeholder="Adicionar tag"
                      className="bg-white/5 border-white/10"
                    />
                    <Button type="button" variant="outline" onClick={handleAddTag}>
                      Adicionar
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-white/10 rounded text-sm flex items-center gap-1"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-gray-400 hover:text-white"
                          >
                            x
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="seo" className="space-y-6">
                {/* Focus Keyword */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Palavra-chave Foco
                  </Label>
                  <Input
                    value={formData.focusKeyword}
                    onChange={(e) =>
                      setFormData({ ...formData, focusKeyword: e.target.value })
                    }
                    placeholder="Ex: sistema para locadora"
                    className="bg-white/5 border-white/10"
                  />
                  <p className="text-xs text-gray-500">
                    A palavra-chave principal que voce quer ranquear
                  </p>
                </div>

                {/* Meta Title */}
                <div className="space-y-2">
                  <Label>Titulo SEO</Label>
                  <Input
                    value={formData.metaTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, metaTitle: e.target.value })
                    }
                    placeholder={formData.title || "Titulo SEO (deixe vazio para usar o titulo)"}
                    className="bg-white/5 border-white/10"
                  />
                  <p className="text-xs text-gray-500">
                    {(formData.metaTitle || formData.title).length}/60 caracteres
                  </p>
                </div>

                {/* Meta Description */}
                <div className="space-y-2">
                  <Label>Meta Descricao</Label>
                  <Textarea
                    value={formData.metaDescription}
                    onChange={(e) =>
                      setFormData({ ...formData, metaDescription: e.target.value })
                    }
                    placeholder="Descricao que aparece nos resultados do Google (120-160 caracteres)"
                    rows={3}
                    className="bg-white/5 border-white/10"
                  />
                  <p className={`text-xs ${
                    formData.metaDescription.length >= 120 && formData.metaDescription.length <= 160
                      ? "text-green-400"
                      : "text-gray-500"
                  }`}>
                    {formData.metaDescription.length}/160 caracteres (ideal: 120-160)
                  </p>
                </div>

                {/* Open Graph */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <h3 className="font-semibold">Open Graph (Redes Sociais)</h3>
                  <div className="space-y-2">
                    <Label>Titulo para Redes Sociais</Label>
                    <Input
                      value={formData.ogTitle}
                      onChange={(e) =>
                        setFormData({ ...formData, ogTitle: e.target.value })
                      }
                      placeholder={formData.title || "Titulo para Facebook/LinkedIn"}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descricao para Redes Sociais</Label>
                    <Textarea
                      value={formData.ogDescription}
                      onChange={(e) =>
                        setFormData({ ...formData, ogDescription: e.target.value })
                      }
                      placeholder={formData.metaDescription || "Descricao para compartilhamento"}
                      rows={2}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>

                {/* Advanced */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <h3 className="font-semibold">Configuracoes Avancadas</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Nao indexar (noindex)</Label>
                      <p className="text-xs text-gray-500">Impede o Google de indexar</p>
                    </div>
                    <Switch
                      checked={formData.noIndex}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, noIndex: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Nao seguir links (nofollow)</Label>
                      <p className="text-xs text-gray-500">Impede o Google de seguir links</p>
                    </div>
                    <Switch
                      checked={formData.noFollow}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, noFollow: checked })
                      }
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* SEO Sidebar */}
        <div className="space-y-6">
          {/* SEO Score */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Analise SEO
            </h3>

            <div className="text-center mb-6">
              <div className={`text-5xl font-bold ${getSeoScoreColor()}`}>
                {seoScore}
              </div>
              <div className="text-gray-400 text-sm">Pontuacao SEO</div>
            </div>

            <div className="space-y-3">
              <SeoCheckItem
                label="Palavra-chave no titulo"
                check={seoChecks.titleHasKeyword}
              />
              <SeoCheckItem
                label="Palavra-chave na meta descricao"
                check={seoChecks.metaDescriptionHasKeyword}
              />
              <SeoCheckItem
                label="Titulo com 30-60 caracteres"
                check={seoChecks.titleLength}
              />
              <SeoCheckItem
                label="Meta descricao com 120-160 caracteres"
                check={seoChecks.metaDescriptionLength}
              />
              <SeoCheckItem
                label="Palavra-chave no conteudo"
                check={seoChecks.contentHasKeyword}
              />
              <SeoCheckItem
                label="Palavra-chave no resumo"
                check={seoChecks.excerptHasKeyword}
              />
              <SeoCheckItem
                label="Conteudo com 300+ palavras"
                check={seoChecks.contentLength}
              />
              <SeoCheckItem
                label="Palavra-chave no slug"
                check={seoChecks.slugHasKeyword}
              />
            </div>
          </div>

          {/* Preview Google */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview no Google
            </h3>
            <div className="bg-white rounded-lg p-4 text-left">
              <div className="text-blue-600 text-lg font-medium truncate">
                {formData.metaTitle || formData.title || "Titulo do Post"}
              </div>
              <div className="text-green-700 text-sm truncate">
                oduoloc.com.br/blog/{formData.slug || "url-do-post"}
              </div>
              <div className="text-gray-600 text-sm mt-1 line-clamp-2">
                {formData.metaDescription || formData.excerpt || "Descricao do post aparece aqui..."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
