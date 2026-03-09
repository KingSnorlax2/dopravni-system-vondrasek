import { Suspense } from 'react'
import { ResetPasswordForm } from './ResetPasswordForm'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

function ResetPasswordFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-[350px] shadow-lg">
        <CardHeader>
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="h-8 w-8 rounded bg-muted animate-pulse mx-auto my-2" />
          <div className="h-6 w-32 bg-muted rounded animate-pulse mx-auto" />
          <div className="h-4 w-48 bg-muted/80 rounded animate-pulse mx-auto" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 bg-muted rounded-md animate-pulse" />
          <div className="h-10 bg-muted rounded-md animate-pulse" />
          <div className="h-10 bg-muted rounded-md animate-pulse" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
