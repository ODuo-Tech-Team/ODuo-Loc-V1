import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonStatCard() {
  return (
    <Card className="relative overflow-hidden border-l-4 border-l-white/10 bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-2">
        <Skeleton className="h-3 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-20 mb-2" />
        <Skeleton className="h-4 w-32" />
      </CardContent>
      {/* Background icon placeholder */}
      <div className="absolute top-4 right-4 opacity-5">
        <Skeleton className="h-16 w-16 rounded-full" />
      </div>
    </Card>
  )
}
