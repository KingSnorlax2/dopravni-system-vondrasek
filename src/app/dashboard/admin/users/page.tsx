import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { redirect } from 'next/navigation'
import { UsersAdminClient } from './users-admin-client'

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    redirect('/403')
  }
  
  return (
    <div>
      {/* Page Header */}
      <div className="unified-section-header">
        <h1 className="unified-section-title">Správa uživatelů</h1>
        <p className="unified-section-description">
          Spravujte uživatele systému, role a oprávnění
        </p>
      </div>

      {/* Main Content */}
      <div className="unified-card p-6">
        <Suspense fallback={
          <div className="unified-loading">
            <div className="unified-spinner"></div>
          </div>
        }>
          <UsersAdminClient />
        </Suspense>
      </div>
    </div>
  )
} 