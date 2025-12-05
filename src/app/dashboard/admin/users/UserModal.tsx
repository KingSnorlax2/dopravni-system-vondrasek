"use client"

import { useEffect, useState } from 'react'

export function UserModal({ open, onClose, onSave, user }: {
  open: boolean,
  onClose: () => void,
  onSave: (data: any) => void,
  user?: any,
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    roles: [] as string[],
    status: 'ACTIVE',
  })
  const [error, setError] = useState<string | null>(null)
  const [roleOptions, setRoleOptions] = useState<string[]>([])
  const [rolesLoading, setRolesLoading] = useState(true)

  useEffect(() => {
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
  }, [open])

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        password: '',
        roles: user.roles || [],
        status: user.status || 'ACTIVE',
      })
    } else {
      setForm({ name: '', email: '', password: '', roles: [], status: 'ACTIVE' })
    }
    setError(null)
  }, [user, open])

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target
    if (name === 'roles') {
      setForm(f => ({
        ...f,
        roles: checked
          ? [...f.roles, value]
          : f.roles.filter((r: string) => r !== value),
      }))
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
  }

  const toggleRoleChip = (role: string) => {
    setForm(f => ({
      ...f,
      roles: f.roles.includes(role)
        ? f.roles.filter(r => r !== role)
        : [...f.roles, role]
    }))
  }

  const handleSubmit = (e: any) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required')
      return
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setError('Invalid email format')
      return
    }
    if (!user && !form.password) {
      setError('Password is required for new users')
      return
    }
    if (!form.roles.length) {
      setError('At least one role is required')
      return
    }
    onSave(form)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{user ? 'Upravit uživatele' : 'Nový uživatel'}</h2>
            <p className="text-sm text-gray-500">Vyplňte základní informace a přiřaďte role.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Zavřít"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Jméno</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="border rounded-lg px-3 py-2 w-full bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Např. Jan Novák"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="border rounded-lg px-3 py-2 w-full bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="jan.novak@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Heslo {user && <span className="text-xs text-gray-500">(ponechte prázdné pro zachování)</span>}
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="border rounded-lg px-3 py-2 w-full bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder={user ? '••••••••' : 'Min. 8 znaků'}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="border rounded-lg px-3 py-2 w-full bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ACTIVE">Aktivní</option>
                <option value="DISABLED">Deaktivovaný</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Role</label>
              {rolesLoading && <span className="text-xs text-gray-500">Načítám…</span>}
            </div>
            {rolesLoading ? (
              <div className="text-gray-500 text-sm">Načítám role…</div>
            ) : roleOptions.length === 0 ? (
              <div className="text-red-500 text-sm">Nejsou dostupné žádné role. Vytvořte nejdříve roli.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {roleOptions.map(opt => {
                  const active = form.roles.includes(opt)
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => toggleRoleChip(opt)}
                      className={`px-3 py-1 rounded-full text-sm border transition ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {error && <div className="text-red-600 text-sm text-center">{error}</div>}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              onClick={onClose}
            >
              Zrušit
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
              disabled={rolesLoading || roleOptions.length === 0}
            >
              Uložit
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 