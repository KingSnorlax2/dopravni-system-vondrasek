'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function UsersPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new admin users page
    router.replace('/dashboard/admin/users')
  }, [router])

  return (
    <div className="unified-loading">
      <div className="unified-spinner"></div>
    </div>
  )
} 