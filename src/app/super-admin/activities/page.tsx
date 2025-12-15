import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ActivitiesClient } from "./activities-client"
import ActivitiesLoading from "./loading"

// Dados iniciais buscados no servidor
async function getInitialData() {
  // Buscar atividades iniciais (primeiras 20) - queries em paralelo
  const [activities, total, stats, tenants] = await Promise.all([
    prisma.activityLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.activityLog.count(),
    prisma.activityLog.groupBy({
      by: ["action"],
      _count: true,
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: "asc" },
    }),
  ])

  return {
    activities: activities.map(a => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
    tenants,
    stats: stats.reduce((acc, item) => {
      acc[item.action] = item._count
      return acc
    }, {} as Record<string, number>),
    pagination: {
      page: 1,
      limit: 20,
      total,
      totalPages: Math.ceil(total / 20),
    },
  }
}

export default async function ActivitiesPage() {
  // Verificar se é super admin
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/login")
  }

  // Buscar dados iniciais no servidor (streaming)
  const initialData = await getInitialData()

  return (
    <Suspense fallback={<ActivitiesLoading />}>
      <ActivitiesClient initialData={initialData} />
    </Suspense>
  )
}
