"use client"

import { useState } from 'react'
import { UserTable } from './UserTable'
import { RoleManagement } from '@/components/admin/RoleManagement'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Shield } from 'lucide-react'

type RolePanelTab = 'roles' | 'userSettings' | 'userPreferences'

export function UsersAdminClient() {
  const [activeSection, setActiveSection] = useState<'users' | 'roles'>('users')
  const [userTableKey, setUserTableKey] = useState(0)
  const [prefillUserId, setPrefillUserId] = useState<string>()
  const [rolePanelTab, setRolePanelTab] = useState<RolePanelTab>('roles')

  const handleManageUser = (user: any) => {
    if (!user?.id) return
    setPrefillUserId(String(user.id))
    setRolePanelTab('userSettings')
    setActiveSection('roles')
  }

  const handleRoleChange = () => {
    setUserTableKey((prev) => prev + 1)
  }

  return (
    <Tabs
      value={activeSection}
      onValueChange={(value) => setActiveSection(value as 'users' | 'roles')}
      className="space-y-6"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="users" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Uživatelé
        </TabsTrigger>
        <TabsTrigger value="roles" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Role & oprávnění
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

      <TabsContent value="roles">
        <RoleManagement
          onRoleChange={handleRoleChange}
          prefillUserId={prefillUserId}
          initialTab={rolePanelTab}
        />
      </TabsContent>
    </Tabs>
  )
}