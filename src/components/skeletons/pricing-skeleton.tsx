import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function PricingSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-80 mx-auto" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center items-center gap-4">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, planIndex) => (
            <Card
              key={planIndex}
              className={`bg-zinc-900/50 border-zinc-800 ${
                planIndex === 1 ? "ring-2 ring-primary scale-105" : ""
              }`}
            >
              <CardHeader className="text-center space-y-4">
                {planIndex === 1 && (
                  <Skeleton className="h-6 w-24 mx-auto rounded-full" />
                )}
                <Skeleton className="h-8 w-32 mx-auto" />
                <div className="space-y-2">
                  <Skeleton className="h-12 w-36 mx-auto" />
                  <Skeleton className="h-4 w-20 mx-auto" />
                </div>
                <Skeleton className="h-4 w-48 mx-auto" />
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Features */}
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ or Additional Info */}
        <div className="space-y-6">
          <Skeleton className="h-8 w-48 mx-auto" />
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
