'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface User {
  id: string
  name: string | null
  email: string | null
  role: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real app, fetch users from API
    setUsers([{
      id: "1",
      name: "Admin",
      email: "admin@example.com",
      role: "ADMIN"
    }])
    setLoading(false)
  }, [])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Správa uživatelů</h1>
      
      {loading ? (
        <div>Načítání...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Uživatelé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {users.map(user => (
                <div key={user.id} className="py-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 