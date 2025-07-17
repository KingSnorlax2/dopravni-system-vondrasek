"use client"

import { useEffect, useState } from 'react'
import { RoleModal } from './RoleModal'

const PERMISSIONS = [
  { key: 'view_dashboard', label: 'View Dashboard' },
  { key: 'manage_users', label: 'Manage Users' },
  { key: 'manage_vehicles', label: 'Manage Vehicles' },
  { key: 'view_reports', label: 'View Reports' },
  { key: 'manage_distribution', label: 'Manage Distribution' },
  { key: 'driver_access', label: 'Driver Access' },
]

export function RolesPermissionsTable() {
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [changed, setChanged] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalRole, setModalRole] = useState<any | null>(null)
  const [allPermissions, setAllPermissions] = useState<string[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null)

  const fetchRoles = () => {
    setLoading(true)
    fetch('/api/admin/roles')
      .then(res => res.json())
      .then(data => {
        setRoles(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load roles')
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchRoles()
    fetch('/api/admin/roles?permissions=1')
      .then(res => res.json())
      .then(data => setAllPermissions(data))
  }, [])

  const handleToggle = (roleIdx: number, permKey: string) => {
    setRoles(prev => prev.map((role, idx) => {
      if (idx !== roleIdx) return role
      const has = role.permissions.includes(permKey)
      return {
        ...role,
        permissions: has
          ? role.permissions.filter((p: string) => p !== permKey)
          : [...role.permissions, permKey],
      }
    }))
    setChanged(true)
  }

  const handleSave = async (roleIdx: number) => {
    setSaving(true)
    const role = roles[roleIdx]
    const res = await fetch(`/api/admin/roles/${role.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions: role.permissions }),
    })
    setSaving(false)
    setChanged(false)
    if (!res.ok) {
      setError('Failed to save permissions')
    } else {
      setToast('Permissions updated')
      fetchRoles()
      setTimeout(() => setToast(null), 2000)
    }
  }

  const handleCreate = () => {
    setModalRole(null)
    setModalOpen(true)
  }

  const handleEdit = (role: any) => {
    setModalRole(role)
    setModalOpen(true)
  }

  const handleModalSave = async (form: any) => {
    setSaving(true)
    try {
      let res
      if (modalRole) {
        // Edit
        const patchData: any = { permissions: form.permissions }
        if (modalRole.name !== form.name) patchData.name = form.name
        res = await fetch(`/api/admin/roles/${modalRole.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patchData),
        })
      } else {
        // Create
        res = await fetch('/api/admin/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, permissions: form.permissions }),
        })
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setToast(data.error || 'Failed to save role')
      } else {
        setToast('Role saved')
        setModalOpen(false)
        fetchRoles()
      }
    } catch (e) {
      setToast('Failed to save role')
    } finally {
      setSaving(false)
      setTimeout(() => setToast(null), 2000)
    }
  }

  const handleDelete = async (role: any) => {
    if (!window.confirm(`Delete role '${role.name}'? This cannot be undone.`)) return
    setDeleteLoading(true)
    setDeleteRoleId(role.id)
    try {
      const res = await fetch(`/api/admin/roles/${role.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        setToast(data.error || 'Failed to delete role')
      } else {
        setToast('Role deleted')
        fetchRoles()
      }
    } catch {
      setToast('Failed to delete role')
    } finally {
      setDeleteLoading(false)
      setDeleteRoleId(null)
      setTimeout(() => setToast(null), 2000)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading roles...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>
  if (!Array.isArray(roles)) return <div className="p-8 text-center text-red-500">Invalid roles data received</div>;

  return (
    <div className="overflow-x-auto">
      {toast && <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow z-50">{toast}</div>}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Roles & Permissions</h3>
        <button className="px-4 py-2 rounded bg-blue-600 text-white font-semibold shadow" onClick={handleCreate}>+ Create Role</button>
      </div>
      <table className="min-w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2 text-left">Role</th>
            {allPermissions.map(perm => (
              <th key={perm} className="border px-4 py-2 text-center">{perm}</th>
            ))}
            <th className="border px-4 py-2 text-center">Allowed Pages</th>
            <th className="border px-4 py-2 text-center">Default Landing</th>
            <th className="border px-4 py-2 text-center">Actions</th>
            <th className="border px-4 py-2 text-center">Save</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role, idx) => {
            const isProtected = role.name === 'ADMIN'
            return (
              <tr key={role.id} className="border-b hover:bg-gray-50">
                <td className="border px-4 py-2 font-semibold">{role.name}</td>
                {allPermissions.map(perm => (
                  <td key={perm} className="border px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={role.permissions.includes(perm)}
                      onChange={() => handleToggle(idx, perm)}
                      disabled={isProtected}
                      title={isProtected ? 'Cannot change permissions for protected role' : ''}
                    />
                  </td>
                ))}
                <td className="border px-4 py-2 text-xs text-gray-700 max-w-[200px] whitespace-pre-line">{role.allowedPages?.join('\n') || ''}</td>
                <td className="border px-4 py-2 text-xs text-gray-700">{role.defaultLandingPage || ''}</td>
                <td className="border px-4 py-2 text-center">
                  <button
                    className="text-blue-600 hover:underline mr-2 disabled:text-gray-400"
                    onClick={() => handleEdit(role)}
                    disabled={isProtected}
                    title={isProtected ? 'Cannot edit protected role' : ''}
                  >Edit</button>
                  <button
                    className="text-red-600 hover:underline disabled:text-gray-400"
                    onClick={() => handleDelete(role)}
                    disabled={isProtected || (deleteLoading && deleteRoleId === role.id)}
                    title={isProtected ? 'Cannot delete protected role' : ''}
                  >
                    {deleteLoading && deleteRoleId === role.id ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
                <td className="border px-4 py-2 text-center">
                  <button
                    className="text-blue-600 hover:underline disabled:text-gray-400"
                    onClick={() => handleSave(idx)}
                    disabled={saving || !changed || isProtected}
                    title={isProtected ? 'Cannot save protected role' : ''}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <RoleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleModalSave}
        role={modalRole}
        allPermissions={allPermissions}
      />
    </div>
  )
} 