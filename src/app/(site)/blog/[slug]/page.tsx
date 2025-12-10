import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Calendar, User, Tag, ArrowLeft, ArrowRight, Share2, Linkedin, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  params: Promise<{ slug: string }>
}

async function getPost(slug: string) {
  const post = await prisma.blogPost.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      publishedAt: { not: null },
    },
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
  })

  if (!post) return null

  // Related posts
  const relatedPosts = await prisma.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { not: null },
      id: { not: post.id },
      OR: [
        post.categoryId ? { categoryId: post.categoryId } : {},
        post.tags.length > 0 ? { tags: { hasSome: post.tags } } : {},
      ],
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
      category: {
        select: {
          name: true,
          slug: true,
          color: true,
        },
      },
    },
  })

  return { post, relatedPosts }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getPost(slug)

  if (!data) {
    return {
      title: "Post não encontrado | ODuoLoc",
    }
  }

  const { post } = data

  return {
    title: post.metaTitle || `${post.title} | ODuoLoc`,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      title: post.ogTitle || post.metaTitle || post.title,
      description: post.ogDescription || post.metaDescription || post.excerpt,
      images: post.coverImage ? [post.coverImage] : [],
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: post.twitterTitle || post.metaTitle || post.title,
      description: post.twitterDescription || post.metaDescription || post.excerpt,
      images: post.twitterImage || post.coverImage ? [post.twitterImage || post.coverImage!] : [],
    },
    robots: {
      index: !post.noIndex,
      follow: !post.noFollow,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const data = await getPost(slug)

  if (!data) {
    notFound()
  }

  const { post, relatedPosts } = data
  const shareUrl = `https://oduoloc.com.br/blog/${post.slug}`

  return (
    <article className="min-h-screen">
      {/* Hero */}
      <section className="py-12 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
              <Link href="/blog" className="hover:text-white transition-colors">
                Blog
              </Link>
              <span>/</span>
              {post.category && (
                <>
                  <Link
                    href={`/blog?category=${post.category.slug}`}
                    className="hover:text-white transition-colors"
                  >
                    {post.category.name}
                  </Link>
                  <span>/</span>
                </>
              )}
              <span className="text-gray-400 truncate">{post.title}</span>
            </nav>

            {/* Category */}
            {post.category && (
              <Link
                href={`/blog?category=${post.category.slug}`}
                className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-4"
                style={{ backgroundColor: post.category.color || "#06b6d4", color: "white" }}
              >
                {post.category.name}
              </Link>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-gray-400 mb-8">
              {post.author && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{post.author.name}</span>
                </div>
              )}
              {post.publishedAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(post.publishedAt).toLocaleDateString("pt-BR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-white/10 rounded-full text-sm text-gray-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Cover Image */}
            {post.coverImage && (
              <div className="aspect-video rounded-xl overflow-hidden mb-8">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="max-w-3xl">
                {/* Article Content */}
                <div
                  className="prose prose-invert prose-lg max-w-none
                    prose-headings:font-bold prose-headings:text-white
                    prose-p:text-gray-300 prose-p:leading-relaxed
                    prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-white
                    prose-ul:text-gray-300 prose-ol:text-gray-300
                    prose-li:marker:text-cyan-400
                    prose-blockquote:border-l-cyan-500 prose-blockquote:text-gray-400
                    prose-code:text-cyan-400 prose-code:bg-white/10 prose-code:px-1 prose-code:rounded
                    prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Share */}
                <div className="mt-12 pt-8 border-t border-white/10">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Compartilhar
                  </h3>
                  <div className="flex gap-3">
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Twitter className="h-4 w-4" />
                      Twitter
                    </a>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </a>
                  </div>
                </div>

                {/* Navigation */}
                <div className="mt-8 flex justify-between">
                  <Link href="/blog">
                    <Button variant="outline">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar ao Blog
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1 space-y-6">
              {/* CTA */}
              <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6 sticky top-24">
                <h3 className="font-semibold mb-2">Conheça o ODuoLoc</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Sistema completo para gestão da sua locadora.
                </p>
                <Link href="/cadastro">
                  <Button className="w-full bg-cyan-600 hover:bg-cyan-500">
                    Começar Agora
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 border-t border-white/10">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">Posts Relacionados</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((related) => (
                <article
                  key={related.id}
                  className="rounded-xl border border-white/10 bg-white/5 overflow-hidden hover:border-cyan-500/50 transition-all group"
                >
                  {related.coverImage ? (
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={related.coverImage}
                        alt={related.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                      <span className="text-4xl font-bold text-white/20">
                        {related.title.charAt(0)}
                      </span>
                    </div>
                  )}

                  <div className="p-5">
                    {related.category && (
                      <span
                        className="inline-block px-2 py-1 rounded text-xs font-medium mb-3"
                        style={{ backgroundColor: related.category.color || "#06b6d4", color: "white" }}
                      >
                        {related.category.name}
                      </span>
                    )}

                    <h3 className="text-lg font-semibold mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2">
                      <Link href={`/blog/${related.slug}`}>{related.title}</Link>
                    </h3>

                    <p className="text-gray-400 text-sm line-clamp-2">
                      {related.excerpt}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": post.schemaType || "Article",
            headline: post.title,
            description: post.excerpt,
            image: post.coverImage,
            author: {
              "@type": "Person",
              name: post.author?.name || "ODuoLoc",
            },
            publisher: {
              "@type": "Organization",
              name: "ODuoLoc",
              logo: {
                "@type": "ImageObject",
                url: "https://oduoloc.com.br/logo.png",
              },
            },
            datePublished: post.publishedAt?.toISOString(),
            dateModified: post.updatedAt.toISOString(),
          }),
        }}
      />
    </article>
  )
}
