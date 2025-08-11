"use client"

import { useState } from 'react'
import { UserTable } from './UserTable'
import { RoleManagement } from '@/components/admin/RoleManagement'

export function UsersAdminClient() {
  const [tab, setTab] = useState<'users' | 'roleManagement'>('users')

  return (
    <div>
      <div className="flex gap-4 mb-6 border-b">
        <button
          className={`pb-2 px-2 border-b-2 ${tab === 'users' ? 'border-blue-600 font-semibold' : 'border-transparent text-gray-500'}`}
          onClick={() => setTab('users')}
        >
          Users
        </button>
        <button
          className={`pb-2 px-2 border-b-2 ${tab === 'roleManagement' ? 'border-blue-600 font-semibold' : 'border-transparent text-gray-500'}`}
          onClick={() => setTab('roleManagement')}
        >
          Role Management
        </button>
      </div>
      
      {tab === 'users' && (
        <div>
          <UserTable />
        </div>
      )}
      
      {tab === 'roleManagement' && (
        <div>
          <RoleManagement />
        </div>
      )}
    </div>
  )
} 