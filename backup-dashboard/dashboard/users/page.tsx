'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, UserPlus, Trash2, Eye, EyeOff, Wand2, Pencil } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function generatePassword() {
  const length = 10
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}



export default function UsersPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER'
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleGeneratePassword = () => {
    const newPassword = generatePassword()
    setFormData(prev => ({
      ...prev,
      password: newPassword
    }))
  }

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value
    }))
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst uživatele.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to create user')
      }

      toast({
        title: "Uživatel vytvořen",
        description: "Nový uživatel byl úspěšně vytvořen.",
      })

      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'USER'
      })

      loadUsers()
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se vytvořit uživatele.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Opravdu chcete smazat tohoto uživatele?')) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      toast({
        title: "Uživatel smazán",
        description: "Uživatel byl úspěšně smazán.",
      })

      loadUsers()
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se smazat uživatele.",
        variant: "destructive",
      })
    }
  }

  const handleEditUser = (user: any) => {
    setEditingUser(user)
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'USER'
    })
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return
    setIsLoading(true)

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update user')
      }

      toast({
        title: "Uživatel aktualizován",
        description: "Údaje uživatele byly úspěšně aktualizovány.",
      })

      setEditingUser(null)
      loadUsers()
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se aktualizovat uživatele.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGeneratePasswordForUser = async (userId: string) => {
    const newPassword = generatePassword()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      })

      if (!response.ok) {
        throw new Error('Failed to update password')
      }

      toast({
        title: "Heslo změněno",
        description: `Nové heslo: ${newPassword}`,
        duration: 10000,
      })

      loadUsers()
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se změnit heslo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load users on mount
  useState(() => {
    loadUsers()
  })

  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-4">Přístup odepřen</h1>
        <p>Nemáte oprávnění pro přístup k této stránce.</p>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-6">
      <h1 className="text-3xl font-bold mb-6">Správa uživatelů</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Vytvořit uživatele</CardTitle>
          <CardDescription>
            Vytvořte nového uživatele systému
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Jméno
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Heslo
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  required
                  className="pr-20"
                />
                <div className="absolute right-0 top-0 flex">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10"
                    onClick={handleGeneratePassword}
                  >
                    <Wand2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                Role
              </label>
              <Select
                value={formData.role}
                onValueChange={handleRoleChange}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte roli" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Uživatel</SelectItem>
                  <SelectItem value="ADMIN">Administrátor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vytvářím...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Vytvořit uživatele
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seznam uživatelů</CardTitle>
          <CardDescription>
            Přehled všech uživatelů v systému
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {users.map((user) => (
              <div key={user.id} className="py-4 flex items-center justify-between">
                <div className="space-y-1 flex-grow">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-400">{user.role}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="relative flex-grow max-w-sm">
                      <Input
                        type="text"
                        value={user.password || ''}
                        readOnly
                        className="pr-24 bg-muted"
                        placeholder="Heslo není nastaveno"
                      />
                      <div className="absolute right-0 top-0 flex">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-10"
                          onClick={() => {
                            const newPassword = generatePassword()
                            handleGeneratePasswordForUser(user.id)
                          }}
                          disabled={isLoading}
                        >
                          <Wand2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEditUser(user)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={user.email === session?.user?.email}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upravit uživatele</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-name" className="text-sm font-medium">
                Jméno
              </label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-password" className="text-sm font-medium">
                Nové heslo
              </label>
              <div className="relative">
                <Input
                  id="edit-password"
                  name="password"
                  type="text"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  placeholder="Ponechte prázdné pro zachování současného hesla"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-10"
                  onClick={handleGeneratePassword}
                >
                  <Wand2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-role" className="text-sm font-medium">
                Role
              </label>
              <Select
                value={formData.role}
                onValueChange={handleRoleChange}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte roli" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Uživatel</SelectItem>
                  <SelectItem value="ADMIN">Administrátor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditingUser(null)}
                disabled={isLoading}
              >
                Zrušit
              </Button>
              <Button
                onClick={handleUpdateUser}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ukládám...
                  </>
                ) : (
                  'Uložit změny'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 