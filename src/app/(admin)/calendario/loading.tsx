import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function CalendarioLoading() {
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-0">
          {/* Header Row (Days) */}
          <div className="grid grid-cols-7 border-b border-zinc-800">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="p-3 text-center border-r border-zinc-800 last:border-r-0">
                <Skeleton className="h-4 w-8 mx-auto" />
              </div>
            ))}
          </div>

          {/* Calendar Rows */}
          {Array.from({ length: 5 }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-7 border-b border-zinc-800 last:border-b-0">
              {Array.from({ length: 7 }).map((_, colIndex) => (
                <div
                  key={colIndex}
                  className="min-h-[100px] p-2 border-r border-zinc-800 last:border-r-0"
                >
                  <Skeleton className="h-5 w-5 mb-2" />
                  {rowIndex % 2 === 0 && colIndex % 3 === 0 && (
                    <Skeleton className="h-6 w-full rounded" />
                  )}
                  {rowIndex % 3 === 1 && colIndex % 2 === 0 && (
                    <Skeleton className="h-6 w-full rounded mt-1" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
