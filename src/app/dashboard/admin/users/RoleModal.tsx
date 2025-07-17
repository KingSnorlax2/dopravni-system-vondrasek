"use client"

import { useEffect, useState } from 'react'

export function RoleModal({ open, onClose, onSave, role, allPermissions }: {
  open: boolean,
  onClose: () => void,
  onSave: (data: any) => void,
  role?: any,
  allPermissions: string[],
}) {
  const [form, setForm] = useState({
    name: '',
    permissions: [] as string[],
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (role) {
      setForm({
        name: role.name || '',
        permissions: role.permissions || [],
      })
    } else {
      setForm({ name: '', permissions: [] })
    }
    setError(null)
  }, [role, open])

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target
    if (name === 'permissions') {
      setForm(f => ({
        ...f,
        permissions: checked
          ? [...f.permissions, value]
          : f.permissions.filter((p: string) => p !== value),
      }))
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
  }

  const handleSubmit = (e: any) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Role name is required')
      return
    }
    onSave(form)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{role ? 'Edit Role' : 'Create Role'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Role Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full"
              required
            />
            {role && role.name !== form.name && (
              <div className="text-xs text-gray-500 mt-1">Role name will be updated.</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Permissions</label>
            <div className="flex flex-wrap gap-3">
              {allPermissions.map(perm => (
                <label key={perm} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    name="permissions"
                    value={perm}
                    checked={form.permissions.includes(perm)}
                    onChange={handleChange}
                  />
                  {perm}
                </label>
              ))}
            </div>
          </div>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={onClose}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Save</button>
          </div>
        </form>
      </div>
    </div>
  )
} 