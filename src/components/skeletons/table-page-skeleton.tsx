import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonFilterCard } from "./skeleton-filter-card"
import { SkeletonTable } from "./skeleton-table"

interface SkeletonTableColumn {
  width?: string
  align?: "left" | "center" | "right"
}

interface TablePageSkeletonProps {
  filterInputs?: number
  tableColumns: SkeletonTableColumn[]
  tableRows?: number
  showPagination?: boolean
}

export function TablePageSkeleton({
  filterInputs = 3,
  tableColumns,
  tableRows = 10,
  showPagination = true,
}: TablePageSkeletonProps) {
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Filter Card */}
      <SkeletonFilterCard inputs={filterInputs} />

      {/* Table Card */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-36" />
        </CardHeader>
        <CardContent>
          <SkeletonTable rows={tableRows} columns={tableColumns} />

          {showPagination && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 mt-4 border-t border-zinc-800">
              <Skeleton className="h-8 w-48" />
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-8" />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
