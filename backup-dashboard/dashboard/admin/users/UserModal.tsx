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
    username: '',
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
        username: user.username || '',
        email: user.email || '',
        password: '',
        roles: user.roles || [],
        status: user.status || 'ACTIVE',
      })
    } else {
      setForm({ name: '', username: '', email: '', password: '', roles: [], status: 'ACTIVE' })
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

  const handleSubmit = (e: any) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.username.trim()) {
      setError('Name, username, and email are required')
      return
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(form.username)) {
      setError('Username must be alphanumeric and cannot contain spaces')
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{user ? 'Edit User' : 'Add User'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full"
              required
              pattern="^[a-zA-Z0-9._-]+$"
              autoComplete="username"
            />
            <div className="text-xs text-gray-500 mt-1">Username must be unique, alphanumeric, and cannot contain spaces.</div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password {user ? '(leave blank to keep unchanged)' : ''}</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full"
              placeholder={user ? '••••••••' : ''}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Roles</label>
            {rolesLoading ? (
              <div className="text-gray-500 text-sm">Loading roles...</div>
            ) : roleOptions.length === 0 ? (
              <div className="text-red-500 text-sm">No roles available. Please create a role first.</div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {roleOptions.map(opt => (
                  <label key={opt} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      name="roles"
                      value={opt}
                      checked={form.roles.includes(opt)}
                      onChange={handleChange}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full"
            >
              <option value="ACTIVE">Active</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </div>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={onClose}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white" disabled={rolesLoading || roleOptions.length === 0}>Save</button>
          </div>
        </form>
      </div>
    </div>
  )
} 