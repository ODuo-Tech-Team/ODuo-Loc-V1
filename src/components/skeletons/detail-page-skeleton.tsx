import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface DetailPageSkeletonProps {
  showTabs?: boolean
  tabCount?: number
  formSections?: number
  fieldsPerSection?: number
}

export function DetailPageSkeleton({
  showTabs = false,
  tabCount = 4,
  formSections = 2,
  fieldsPerSection = 4,
}: DetailPageSkeletonProps) {
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header with Breadcrumb */}
      <div className="space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Title and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>

      {/* Tabs (optional) */}
      {showTabs && (
        <div className="flex gap-2 border-b border-zinc-800 pb-2">
          {Array.from({ length: tabCount }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28" />
          ))}
        </div>
      )}

      {/* Form Sections */}
      <div className="space-y-6">
        {Array.from({ length: formSections }).map((_, sectionIndex) => (
          <Card key={sectionIndex} className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                {Array.from({ length: fieldsPerSection }).map((_, fieldIndex) => (
                  <div key={fieldIndex} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}
