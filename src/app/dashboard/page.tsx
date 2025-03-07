'use client';

import { useSession } from 'next-auth/react'

export default function DashboardPage() {
  const { data: session } = useSession()

  return (
    <main className="p-8 bg-gray-100">
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      <p>Welcome, {session?.user?.name || 'User'}!</p>
    </main>
  )
}
