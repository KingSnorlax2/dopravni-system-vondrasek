"use client"

import { useState } from 'react'
import { UserTable } from './UserTable'
import { DynamicRoleSettings } from '@/components/admin/DynamicRoleSettings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Shield } from 'lucide-react'

export function UsersAdminClient() {
  const [activeTab, setActiveTab] = useState('users')

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles & Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="bg-white rounded-lg border p-6">
            <UserTable />
          </div>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="bg-white rounded-lg border p-6">
            <DynamicRoleSettings />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 