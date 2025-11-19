"use client"

import { useEffect, useState } from 'react'
import { UserTable } from './UserTable'

export function UsersAdminClient() {
  // Right-side access panel removed per request. Keep minimal state if needed later.

  // All role/permission logic removed with the panel

  return (
    <div className="grid grid-cols-1 gap-6">
      <section className="unified-card p-4">
        <header className="mb-3">
          <h2 className="text-lg font-semibold">Uživatelé</h2>
          <p className="text-sm text-gray-500">Přehled, filtrování a správa</p>
        </header>
          <UserTable />
      </section>
    </div>
  )
} 