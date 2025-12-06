'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import UnifiedLayout from '@/components/layout/UnifiedLayout'

export default function AdminPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/')
      return
    }

    // Redirect to admin users page (main admin page)
    router.replace('/dashboard/admin/users')
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <UnifiedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Načítání...</p>
          </div>
        </div>
      </UnifiedLayout>
    )
  }

  return null
}

