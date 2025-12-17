import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { redirect } from 'next/navigation'
import { SessionDebugger } from '@/components/debug/SessionDebugger'
import { PermissionTest } from '@/components/debug/PermissionTest'
import { RoleCreationDebug } from '@/components/debug/RoleCreationDebug'

export default async function DebugPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    redirect('/403')
  }
  
  return (
    <div>
      {/* Page Header */}
      <div className="unified-section-header">
        <h1 className="unified-section-title">Debug Session & Permissions</h1>
        <p className="unified-section-description">
          Diagnostic tool for troubleshooting authentication and authorization issues
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <div className="unified-card p-6">
          <Suspense fallback={
            <div className="unified-loading">
              <div className="unified-spinner"></div>
            </div>
          }>
            <SessionDebugger />
          </Suspense>
        </div>
        
        <div className="unified-card p-6">
          <Suspense fallback={
            <div className="unified-loading">
              <div className="unified-spinner"></div>
            </div>
          }>
            <PermissionTest />
          </Suspense>
        </div>

        <div className="unified-card p-6">
          <Suspense fallback={
            <div className="unified-loading">
              <div className="unified-spinner"></div>
            </div>
          }>
            <RoleCreationDebug />
          </Suspense>
        </div>
      </div>
    </div>
  )
} 