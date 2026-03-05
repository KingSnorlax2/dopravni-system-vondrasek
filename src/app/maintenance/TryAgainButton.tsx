'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function TryAgainButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/maintenance-status')
      const data = await res.json()

      if (data.maintenanceMode) {
        toast.info('Údržba stále probíhá. Zkuste to prosím později.')
      } else {
        router.push('/')
      }
    } catch {
      toast.error('Nepodařilo se ověřit stav systému.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      size="lg"
      className="w-full"
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Kontroluji...
        </>
      ) : (
        'Zkusit znovu'
      )}
    </Button>
  )
}
