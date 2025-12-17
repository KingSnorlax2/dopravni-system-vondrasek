'use client';

import React from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import UnifiedLayout from '@/components/layout/UnifiedLayout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="unified-loading">
        <div className="unified-spinner"></div>
      </div>
    )
  }

  if (!session) {
    redirect('/')
  }

  return (
    <UnifiedLayout>
      {children}
    </UnifiedLayout>
  )
}
