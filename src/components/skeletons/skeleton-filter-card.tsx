import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface SkeletonFilterCardProps {
  inputs?: number
}

export function SkeletonFilterCard({ inputs = 3 }: SkeletonFilterCardProps) {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: inputs }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-[180px]" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
