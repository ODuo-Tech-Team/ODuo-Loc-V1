import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function CheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left - Order Summary */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Plan Details */}
              <div className="flex justify-between items-center p-4 bg-zinc-800/50 rounded-lg">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>

              {/* Features List */}
              <div className="space-y-3 py-4 border-t border-zinc-800">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-32" />
              </div>
            </CardContent>
          </Card>

          {/* Right - Payment Form */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Methods */}
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <Skeleton className="h-12 w-full" />

              {/* Security Notice */}
              <div className="flex items-center justify-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-48" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
