"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Skeleton para o Header da página
export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <Skeleton className="h-10 w-36" />
    </div>
  )
}

// Skeleton para as Tabs de navegação
export function EquipmentTabsSkeleton() {
  return (
    <div className="w-full">
      <div className="flex gap-1 p-1 bg-zinc-900/50 border border-zinc-800 rounded-xl">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-10 flex-1 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

// Skeleton para Stats Cards (grid de estatísticas)
export function StatsCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid gap-4 md:grid-cols-${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Skeleton para Card de Filtros
export function FiltersSkeleton() {
  return (
    <div className="flex gap-4 flex-wrap">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-10 w-40" />
    </div>
  )
}

// Skeleton para Tabela
export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardContent className="p-0">
        <div className="w-full">
          {/* Header */}
          <div className="border-b border-zinc-800 p-4">
            <div className="flex gap-4">
              {Array.from({ length: cols }).map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1" />
              ))}
            </div>
          </div>
          {/* Rows */}
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="border-b border-zinc-800 p-4 last:border-0">
              <div className="flex gap-4 items-center">
                {Array.from({ length: cols }).map((_, colIndex) => (
                  <Skeleton key={colIndex} className="h-5 flex-1" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton para Card com Título
export function CardWithTitleSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-4 w-64 mt-1" />
      </CardHeader>
      <CardContent>
        {children || <Skeleton className="h-32 w-full" />}
      </CardContent>
    </Card>
  )
}

// Skeleton para Formulário de Edição de Equipamento
export function EquipmentFormSkeleton() {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-72 mt-1" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Nome */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-24 w-full" />
        </div>

        {/* Categoria */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Imagens */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <div className="flex gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-24 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Períodos */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-20 w-full" />
        </div>

        {/* Preço e Quantidade */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-4 pt-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton para página de Unidades
export function UnidadesPageSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <PageHeaderSkeleton />
      <EquipmentTabsSkeleton />
      <StatsCardsSkeleton count={6} />
      <FiltersSkeleton />
      <TableSkeleton rows={5} cols={6} />
    </div>
  )
}

// Skeleton para página de Estoque
export function EstoquePageSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <PageHeaderSkeleton />
      <EquipmentTabsSkeleton />
      <StatsCardsSkeleton count={5} />
      <div className="flex gap-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-28" />
      </div>
      {/* Status do Estoque Card */}
      <CardWithTitleSkeleton>
        <div className="space-y-4">
          <Skeleton className="h-4 w-full rounded-full" />
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-1">
                <Skeleton className="h-3 w-3 rounded" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
      </CardWithTitleSkeleton>
      <CardWithTitleSkeleton>
        <TableSkeleton rows={5} cols={7} />
      </CardWithTitleSkeleton>
    </div>
  )
}

// Skeleton para página de Manutenção
export function ManutencaoPageSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <PageHeaderSkeleton />
      <EquipmentTabsSkeleton />
      <StatsCardsSkeleton count={4} />
      <FiltersSkeleton />
      <CardWithTitleSkeleton>
        <TableSkeleton rows={5} cols={8} />
      </CardWithTitleSkeleton>
    </div>
  )
}

// Skeleton para página de Documentos
export function DocumentosPageSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <PageHeaderSkeleton />
      <EquipmentTabsSkeleton />
      <CardWithTitleSkeleton>
        <TableSkeleton rows={4} cols={5} />
      </CardWithTitleSkeleton>
    </div>
  )
}

// Skeleton para página Financeira
export function FinanceiroPageSkeleton() {
  return (
    <div className="p-8 space-y-6">
      <PageHeaderSkeleton />
      <EquipmentTabsSkeleton />
      <StatsCardsSkeleton count={4} />
      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
      <CardWithTitleSkeleton>
        <TableSkeleton rows={5} cols={5} />
      </CardWithTitleSkeleton>
      <CardWithTitleSkeleton>
        <TableSkeleton rows={5} cols={4} />
      </CardWithTitleSkeleton>
    </div>
  )
}

// Skeleton para página de Detalhes/Edição
export function EquipmentDetailsPageSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 sm:space-y-8">
      <PageHeaderSkeleton />
      <EquipmentTabsSkeleton />
      <EquipmentFormSkeleton />
    </div>
  )
}
