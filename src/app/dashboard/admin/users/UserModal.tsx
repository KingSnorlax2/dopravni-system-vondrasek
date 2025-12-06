"use client"

import { useEffect, useState, useTransition } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Eye, EyeOff } from "lucide-react"
import { upsertUser } from "@/app/actions/admin"

export function UserModal({ open, onClose, onSave, user, onSuccess }: {
  open: boolean,
  onClose: () => void,
  onSave: (data: any) => Promise<void>,
  user?: any,
  onSuccess?: () => void,
}) {
  const [form, setForm] = useState({
    id: undefined as string | undefined,
    name: '',
    email: '',
    password: '',
    roles: [] as string[],
    status: 'ACTIVE' as 'ACTIVE' | 'DISABLED' | 'SUSPENDED',
    avatar: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [roleOptions, setRoleOptions] = useState<string[]>([])
  const [rolesLoading, setRolesLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (open) {
      setRolesLoading(true)
      fetch('/api/admin/roles')
        .then(res => res.json())
        .then(data => {
          setRoleOptions(data.map((r: any) => r.name))
          setRolesLoading(false)
        })
        .catch(() => {
          setRoleOptions([])
          setRolesLoading(false)
        })
    }
  }, [open])

  useEffect(() => {
    if (user) {
      setForm({
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        password: '',
        roles: user.roles || [],
        status: user.status || 'ACTIVE',
        avatar: user.avatar || '',
      })
    } else {
      setForm({ 
        id: undefined,
        name: '', 
        email: '', 
        password: '', 
        roles: [], 
        status: 'ACTIVE',
        avatar: '',
      })
    }
    setError(null)
    setFieldErrors({})
    setShowPassword(false)
  }, [user, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const toggleRoleChip = (role: string) => {
    setForm(f => ({
      ...f,
      roles: f.roles.includes(role)
        ? f.roles.filter(r => r !== role)
        : [...f.roles, role]
    }))
  }

  const handleStatusChange = (checked: boolean) => {
    setForm(f => ({ 
      ...f, 
      status: checked ? 'ACTIVE' : 'DISABLED' 
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!form.name.trim()) {
      setError('Jméno je povinné')
      return
    }
    if (!form.email.trim()) {
      setError('Email je povinný')
      return
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setError('Neplatný formát emailu')
      return
    }
    if (!user && !form.password) {
      setError('Heslo je povinné pro nové uživatele')
      return
    }
    if (form.password && form.password.length > 0 && form.password.length < 8) {
      setError('Heslo musí mít minimálně 8 znaků')
      return
    }
    if (!form.roles.length) {
      setError('Musí být vybrána alespoň jedna role')
      return
    }
    if (form.avatar && form.avatar.trim() && !/^https?:\/\/.+/.test(form.avatar)) {
      setError('Avatar URL musí být platná URL adresa')
      return
    }

    // Clear previous errors
    setError(null)
    setFieldErrors({})

    // Prepare data - only include password if provided
    const submitData: any = {
      ...(form.id && { id: form.id }),
      name: form.name.trim(),
      email: form.email.trim(),
      roles: form.roles,
      status: form.status,
      ...(form.avatar && form.avatar.trim() && { avatar: form.avatar.trim() }),
    }

    // Only include password if it's provided (for new users or when changing password)
    if (form.password && form.password.length > 0) {
      submitData.password = form.password
    }

    startTransition(async () => {
      const result = await upsertUser(submitData)
      if (result.success) {
        // Success - close modal, refresh list, and reset form
        setError(null)
        setFieldErrors({})
        setShowPassword(false)
        onClose()
        if (onSuccess) {
          onSuccess()
        }
      } else {
        // Show error on form - don't close modal
        if (result.errors) {
          setFieldErrors(result.errors)
        }
        if (result.error) {
          setError(result.error)
        }
      }
    })
  }

  if (!open) return null

  const initials = form.name
    ? form.name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()
    : form.email.slice(0, 2).toUpperCase()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {user ? 'Upravit uživatele' : 'Nový uživatel'}
            </h2>
            <p className="text-sm text-gray-500">
              Vyplňte základní informace a přiřaďte role.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Zavřít"
            disabled={isPending}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              {form.avatar && <AvatarImage src={form.avatar} alt={form.name || form.email} />}
              <AvatarFallback className="bg-gray-200 text-gray-700 text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label htmlFor="avatar">URL avatara</Label>
              <Input
                id="avatar"
                name="avatar"
                type="url"
                value={form.avatar}
                onChange={handleChange}
                placeholder="https://example.com/avatar.jpg"
                className="mt-1"
                disabled={isPending}
              />
              <p className="text-xs text-gray-500 mt-1">
                Zadejte URL adresu obrázku pro avatar uživatele
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Jméno *</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Např. Jan Novák"
                className="mt-1"
                required
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={(e) => {
                  handleChange(e)
                  // Clear email error when user types
                  if (fieldErrors.email || error) {
                    setFieldErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.email
                      return newErrors
                    })
                    if (error && error.includes('email')) {
                      setError(null)
                    }
                  }
                }}
                placeholder="jan.novak@example.com"
                className={`mt-1 ${fieldErrors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                required
                disabled={isPending}
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.email[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="password">
                Heslo {user && <span className="text-xs text-gray-500">(ponechte prázdné pro zachování)</span>}
              </Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder={user ? '••••••••' : 'Min. 8 znaků'}
                  className="pr-10"
                  autoComplete="new-password"
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none disabled:opacity-50"
                  disabled={isPending}
                  aria-label={showPassword ? "Skrýt heslo" : "Zobrazit heslo"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <div className="mt-1 flex items-center gap-3">
                <Switch
                  id="status"
                  checked={form.status === 'ACTIVE'}
                  onCheckedChange={handleStatusChange}
                  disabled={isPending}
                />
                <div className="flex-1">
                  <Select
                    value={form.status}
                    onValueChange={(value: 'ACTIVE' | 'DISABLED' | 'SUSPENDED') => 
                      setForm(f => ({ ...f, status: value }))
                    }
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Aktivní</SelectItem>
                      <SelectItem value="DISABLED">Deaktivovaný</SelectItem>
                      <SelectItem value="SUSPENDED">Pozastavený</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Role *</Label>
              {rolesLoading && <span className="text-xs text-gray-500">Načítám…</span>}
            </div>
            {rolesLoading ? (
              <div className="text-gray-500 text-sm">Načítám role…</div>
            ) : roleOptions.length === 0 ? (
              <div className="text-red-500 text-sm">
                Nejsou dostupné žádné role. Vytvořte nejdříve roli.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {roleOptions.map(opt => {
                  const active = form.roles.includes(opt)
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => toggleRoleChip(opt)}
                      disabled={isPending}
                      className={`px-3 py-1 rounded-full text-sm border transition ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      } disabled:opacity-50`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {error && !Object.keys(fieldErrors).length && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded border border-red-200">
              {error}
            </div>
          )}
          {Object.keys(fieldErrors).length > 0 && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200">
              <p className="font-medium mb-1">Chyby ve formuláři:</p>
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(fieldErrors).map(([field, errors]) => (
                  <li key={field}>{errors[0]}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition disabled:opacity-50"
              onClick={onClose}
              disabled={isPending}
            >
              Zrušit
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
              disabled={rolesLoading || roleOptions.length === 0 || isPending}
            >
              {isPending ? 'Ukládání...' : 'Uložit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
