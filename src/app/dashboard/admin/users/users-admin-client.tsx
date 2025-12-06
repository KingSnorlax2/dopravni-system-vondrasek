"use client"

import { useState } from 'react'
import { UserTable } from './UserTable'
import { RoleTable } from './RoleTable'
import { AuditLogTab } from './AuditLogTab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Shield, FileText } from 'lucide-react'

export function UsersAdminClient() {
  const [activeSection, setActiveSection] = useState<'users' | 'roles' | 'audit'>('users')
  const [userTableKey, setUserTableKey] = useState(0)

  const handleManageUser = (user: any) => {
    // This can be used for future role assignment from user table
    console.log('Manage user:', user)
  }

  const handleRoleChange = () => {
    setUserTableKey((prev) => prev + 1)
  }

  return (
    <Tabs
      value={activeSection}
      onValueChange={(value) => setActiveSection(value as 'users' | 'roles' | 'audit')}
      className="space-y-6"
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="users" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Uživatelé
        </TabsTrigger>
        <TabsTrigger value="roles" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Role & oprávnění
        </TabsTrigger>
        <TabsTrigger value="audit" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Historie změn
        </TabsTrigger>
      </TabsList>

      <TabsContent value="users" className="grid grid-cols-1 gap-6">
        <section className="unified-card p-4">
          <header className="mb-3">
            <h2 className="text-lg font-semibold">Uživatelé</h2>
            <p className="text-sm text-gray-500">Přehled, filtrování a správa</p>
          </header>
          <UserTable key={userTableKey} onManageUser={handleManageUser} />
        </section>
      </TabsContent>

      <TabsContent value="roles" className="grid grid-cols-1 gap-6">
        <section className="unified-card p-4">
          <header className="mb-3">
            <h2 className="text-lg font-semibold">Role & oprávnění</h2>
            <p className="text-sm text-gray-500">Správa rolí a jejich oprávnění</p>
          </header>
          <RoleTable />
        </section>
      </TabsContent>

      <TabsContent value="audit" className="grid grid-cols-1 gap-6">
        <section className="unified-card p-4">
          <header className="mb-3">
            <h2 className="text-lg font-semibold">Historie změn</h2>
            <p className="text-sm text-gray-500">Audit log všech administračních akcí</p>
          </header>
          <AuditLogTab />
        </section>
      </TabsContent>
    </Tabs>
  )
}