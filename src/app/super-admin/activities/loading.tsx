import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ActivitiesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Skeleton className="h-9 w-48 bg-white/10" />
          <Skeleton className="h-5 w-64 mt-2 bg-white/5" />
        </div>
        <Skeleton className="h-10 w-28 bg-white/10" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg bg-white/10" />
                <div>
                  <Skeleton className="h-7 w-12 bg-white/10" />
                  <Skeleton className="h-4 w-20 mt-1 bg-white/5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <Skeleton className="h-5 w-16 bg-white/10" />
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Skeleton className="h-10 bg-white/10" />
              <Skeleton className="h-10 bg-white/10" />
              <Skeleton className="h-10 bg-white/10" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <Skeleton className="h-6 w-40 bg-white/10" />
          <Skeleton className="h-4 w-32 mt-1 bg-white/5" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-lg bg-white/5 border border-white/5"
              >
                <Skeleton className="h-10 w-10 rounded-full bg-white/10 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4 bg-white/10" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20 bg-white/10" />
                    <Skeleton className="h-5 w-24 bg-white/10" />
                  </div>
                  <div className="flex gap-4 mt-2">
                    <Skeleton className="h-4 w-32 bg-white/5" />
                    <Skeleton className="h-4 w-28 bg-white/5" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16 bg-white/5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
