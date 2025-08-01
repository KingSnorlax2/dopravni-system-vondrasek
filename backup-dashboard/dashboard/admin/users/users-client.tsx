'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from "lucide-react"
import { columns, type User } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { UserForm } from "./user-form"
import { useToast } from "@/components/ui/use-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface UsersClientProps {
  users: User[]
}

export function UsersClient({ users: initialUsers }: UsersClientProps) {
  const [users, setUsers] = useState(initialUsers)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleAddUser = async (data: any) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to create user')

      const newUser = await response.json()
      setUsers([...users, newUser])
      setShowAddDialog(false)
      toast({
        title: "Success",
        description: "User created successfully",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateUser = async (id: string, data: any) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to update user')

      const updatedUser = await response.json()
      setUsers(users.map(user => 
        user.id === id ? updatedUser : user
      ))
      toast({
        title: "Success",
        description: "User updated successfully",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete user')

      setUsers(users.filter(user => user.id !== id))
      toast({
        title: "Success",
        description: "User deleted successfully",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Správa uživatelů</h1>
        <Button 
          onClick={() => setShowAddDialog(true)}
          disabled={isLoading}
        >
          <Plus className="mr-2 h-4 w-4" />
          Přidat uživatele
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uživatelé</CardTitle>
          <CardDescription>
            Zde můžete spravovat všechny uživatele systému.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={users}
          />
        </CardContent>
      </Card>

      <UserForm
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        mode="add"
      />
    </div>
  )
} 