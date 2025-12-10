import { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Calendar, User, Tag, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Blog | ODuoLoc",
  description: "Dicas, novidades e conteúdos sobre gestão de locadoras de equipamentos. Aprenda a otimizar sua operação.",
  openGraph: {
    title: "Blog | ODuoLoc",
    description: "Dicas, novidades e conteúdos sobre gestão de locadoras de equipamentos.",
  },
}

async function getPosts(page = 1, limit = 9) {
  const skip = (page - 1) * limit

  const [posts, total, categories] = await Promise.all([
    prisma.blogPost.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: { not: null },
      },
      orderBy: { publishedAt: "desc" },
      skip,
      take: limit,
      include: {
        category: {
          select: {
            name: true,
            slug: true,
            color: true,
          },
        },
        author: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.blogPost.count({
      where: {
        status: "PUBLISHED",
        publishedAt: { not: null },
      },
    }),
    prisma.blogCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { posts: { where: { status: "PUBLISHED" } } },
        },
      },
    }),
  ])

  return {
    posts,
    total,
    totalPages: Math.ceil(total / limit),
    categories,
  }
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || "1")
  const { posts, total, totalPages, categories } = await getPosts(page)

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-20 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Blog ODuoLoc
            </h1>
            <p className="text-xl text-gray-400">
              Dicas, tutoriais e novidades sobre gestão de locadoras de equipamentos.
              Aprenda a otimizar sua operação e crescer seu negócio.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-20">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {posts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg">Nenhum post publicado ainda.</p>
                <p className="text-gray-500 mt-2">Em breve teremos conteúdos incríveis para você!</p>
              </div>
            ) : (
              <>
                {/* Posts Grid */}
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <article
                      key={post.id}
                      className="rounded-xl border border-white/10 bg-white/5 overflow-hidden hover:border-cyan-500/50 transition-all group"
                    >
                      {post.coverImage ? (
                        <div className="aspect-video relative overflow-hidden">
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                          <span className="text-4xl font-bold text-white/20">
                            {post.title.charAt(0)}
                          </span>
                        </div>
                      )}

                      <div className="p-5">
                        {post.category && (
                          <Link
                            href={`/blog?category=${post.category.slug}`}
                            className="inline-block px-2 py-1 rounded text-xs font-medium mb-3"
                            style={{ backgroundColor: post.category.color || "#06b6d4", color: "white" }}
                          >
                            {post.category.name}
                          </Link>
                        )}

                        <h2 className="text-lg font-semibold mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2">
                          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                        </h2>

                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                          {post.excerpt}
                        </p>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {post.publishedAt
                              ? new Date(post.publishedAt).toLocaleDateString("pt-BR")
                              : ""}
                          </div>
                          {post.author && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {post.author.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-12">
                    {page > 1 && (
                      <Link href={`/blog?page=${page - 1}`}>
                        <Button variant="outline">Anterior</Button>
                      </Link>
                    )}

                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <Link key={p} href={`/blog?page=${p}`}>
                          <Button
                            variant={p === page ? "default" : "outline"}
                            size="sm"
                            className={p === page ? "bg-cyan-600" : ""}
                          >
                            {p}
                          </Button>
                        </Link>
                      ))}
                    </div>

                    {page < totalPages && (
                      <Link href={`/blog?page=${page + 1}`}>
                        <Button variant="outline">Próximo</Button>
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Categories */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold mb-4">Categorias</h3>
              {categories.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhuma categoria</p>
              ) : (
                <ul className="space-y-2">
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={`/blog?category=${cat.slug}`}
                        className="flex items-center justify-between text-gray-400 hover:text-white transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cat.color || "#06b6d4" }}
                          />
                          {cat.name}
                        </span>
                        <span className="text-xs text-gray-600">
                          {cat._count.posts}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* CTA */}
            <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6">
              <h3 className="font-semibold mb-2">Conheça o ODuoLoc</h3>
              <p className="text-gray-400 text-sm mb-4">
                Sistema completo para sua locadora.
              </p>
              <Link href="/cadastro">
                <Button className="w-full bg-cyan-600 hover:bg-cyan-500">
                  Começar Agora
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Recent Posts */}
            {posts.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <h3 className="font-semibold mb-4">Posts Recentes</h3>
                <ul className="space-y-4">
                  {posts.slice(0, 5).map((post) => (
                    <li key={post.id}>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-sm text-gray-400 hover:text-white transition-colors line-clamp-2"
                      >
                        {post.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
