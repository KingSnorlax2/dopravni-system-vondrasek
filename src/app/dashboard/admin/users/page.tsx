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
    <div className="container max-w-6xl py-8">
      <nav className="mb-4 text-sm text-gray-500">
        Dashboard / Admin / <span className="text-black font-semibold">Users</span>
      </nav>
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <UsersAdminClient />
      </Suspense>
    </div>
  )
} 