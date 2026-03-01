import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function VehicleTransactionsSkeleton() {
  return (
    <Card className="unified-card">
      <CardHeader className="unified-card-header flex flex-row items-center justify-between space-y-0">
        <Skeleton className="h-6 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
        </div>
      </CardHeader>
      <CardContent className="unified-card-content p-0">
        <div className="overflow-hidden">
          {/* Table header */}
          <div className="flex border-b border-gray-200 bg-gray-50 px-6 py-3">
            <Skeleton className="h-4 w-20 mr-16" />
            <Skeleton className="h-4 w-24 mr-16" />
            <Skeleton className="h-4 w-16 mr-16" />
            <Skeleton className="h-4 w-20 ml-auto" />
          </div>
          {/* 10 table rows */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center border-b border-gray-200 px-6 py-4 last:border-b-0"
            >
              <Skeleton className="h-4 w-20 mr-16" />
              <Skeleton className="h-4 flex-1 max-w-[200px] mr-4" />
              <Skeleton className="h-5 w-16 mr-16" />
              <Skeleton className="h-4 w-20 ml-auto" />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end p-4 border-t">
        <Skeleton className="h-9 w-48" />
      </CardFooter>
    </Card>
  )
}
