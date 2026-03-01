'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="container py-10">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Něco se pokazilo</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Při načítání přehledu docházky došlo k chybě. Zkuste stránku obnovit.
          </p>
          <Button onClick={reset}>Zkusit znovu</Button>
        </CardContent>
      </Card>
    </div>
  )
}
