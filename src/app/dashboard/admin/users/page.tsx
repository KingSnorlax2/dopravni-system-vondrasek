'use client'

import { useState } from 'react'
import { Plus } from "lucide-react"
import { columns, type User } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { UserForm } from "./user-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const defaultData: User[] = [
  {
    id: "1",
    name: "Admin",
    email: "admin@example.com",
    role: "ADMIN" as const
  },
  {
    id: "2",
    name: "User",
    email: "user@example.com",
    role: "USER" as const
  }
]

export default function UsersPage() {
  const [data] = useState(defaultData)
  const [showAddDialog, setShowAddDialog] = useState(false)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Správa uživatelů</h1>
        <Button onClick={() => setShowAddDialog(true)}>
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
          <DataTable columns={columns} data={data} />
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