"use client"

import { useState } from 'react'
import { UserTable } from './UserTable'
import { RolesPermissionsTable } from './RolesPermissionsTable'

export function UsersAdminClient() {
  const [tab, setTab] = useState<'users' | 'roles'>('users')

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
          className={`pb-2 px-2 border-b-2 ${tab === 'roles' ? 'border-blue-600 font-semibold' : 'border-transparent text-gray-500'}`}
          onClick={() => setTab('roles')}
        >
          Roles & Permissions
        </button>
      </div>
      {tab === 'users' ? (
        <div>
          <UserTable />
        </div>
      ) : (
        <div>
          <RolesPermissionsTable />
        </div>
      )}
    </div>
  )
} 