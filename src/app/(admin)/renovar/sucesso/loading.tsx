import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function SucessoLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="bg-zinc-900/50 border-zinc-800 max-w-md w-full">
        <CardContent className="p-8 text-center space-y-6">
          <Skeleton className="h-16 w-16 rounded-full mx-auto" />
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-5 w-64 mx-auto" />
          <Skeleton className="h-5 w-56 mx-auto" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
