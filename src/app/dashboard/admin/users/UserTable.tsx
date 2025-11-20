"use client"

import { useEffect, useState } from 'react'
import { UserModal } from './UserModal'
import { useAccessControl } from "@/hooks/useAccessControl";

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DISABLED', label: 'Disabled' },
]

export function UserTable({ onManageUser }: { onManageUser?: (user: any) => void }) {
  const { hasPermission } = useAccessControl();
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortKey, setSortKey] = useState<'name' | 'email' | 'status'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [allRoles, setAllRoles] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalUser, setModalUser] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmType, setConfirmType] = useState<'delete' | 'deactivate' | null>(null)
  const [confirmUser, setConfirmUser] = useState<any | null>(null)

  const fetchUsers = () => {
    setLoading(true)
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUsers(data.filter(u => u && typeof u === 'object' && u.email && u.name));
          // Collect all unique roles for filter dropdown
          const roles = Array.from(new Set(data.flatMap((u: any) => (u && u.roles ? u.roles : []))));
          setAllRoles(roles);
        } else {
          setUsers([]);
          setError('Invalid user data received');
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load users');
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Filtering
  let filtered = users.filter(user => {
    if (!user || typeof user !== 'object' || !user.name || !user.email) return false;
    const matchesSearch =
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
    const matchesRole = !roleFilter || (user.roles && user.roles.includes(roleFilter))
    const matchesStatus = !statusFilter || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  // Sorting
  filtered = filtered.sort((a, b) => {
    let vA = a[sortKey] || ''
    let vB = b[sortKey] || ''
    if (typeof vA === 'string') vA = vA.toLowerCase()
    if (typeof vB === 'string') vB = vB.toLowerCase()
    if (vA < vB) return sortDir === 'asc' ? -1 : 1
    if (vA > vB) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const handleSort = (key: 'name' | 'email' | 'status') => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const handleAdd = () => {
    setModalUser(null)
    setModalOpen(true)
  }

  const handleEdit = (user: any) => {
    setModalUser(user)
    setModalOpen(true)
    if (onManageUser) onManageUser(user)
  }

  const handleSave = async (form: any) => {
    setSaving(true)
    try {
      let res
      if (modalUser) {
        // Edit
        res = await fetch(`/api/admin/users/${modalUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      } else {
        // Add
        res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      }
      if (!res.ok) throw new Error('Failed to save user')
      setToast('User saved successfully')
      setModalOpen(false)
      fetchUsers()
    } catch (e) {
      setToast('Failed to save user')
    } finally {
      setSaving(false)
      setTimeout(() => setToast(null), 2000)
    }
  }

  const handleDeactivate = (user: any) => {
    setConfirmUser(user)
    setConfirmType('deactivate')
    setConfirmOpen(true)
  }

  const handleDelete = (user: any) => {
    setConfirmUser(user)
    setConfirmType('delete')
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    if (!confirmUser || !confirmType) return
    setSaving(true)
    try {
      if (confirmType === 'deactivate') {
        const res = await fetch(`/api/admin/users/${confirmUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'DISABLED' }),
        })
        if (!res.ok) throw new Error('Failed to deactivate user')
        setToast('User deactivated')
      } else if (confirmType === 'delete') {
        const res = await fetch(`/api/admin/users/${confirmUser.id}`, {
          method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to delete user')
        setToast('User deleted')
      }
      setConfirmOpen(false)
      fetchUsers()
    } catch (e) {
      setToast('Failed to update user')
    } finally {
      setSaving(false)
      setTimeout(() => setToast(null), 2000)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading users...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>

  return (
    <div>
      {/* Toast */}
      {toast && <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow z-50">{toast}</div>}
      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        {hasPermission("manage_users") && (
          <button
            className="px-3 py-2 rounded-md bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition"
            onClick={handleAdd}
          >
            + Add User
          </button>
        )}
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded-md px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="border rounded-md px-3 py-2"
        >
          <option value="">All Roles</option>
          {allRoles.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-2"
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left w-[30%] cursor-pointer" onClick={() => handleSort('name')}>
                Name {sortKey === 'name' && (sortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th className="px-4 py-2 text-left w-[30%] cursor-pointer" onClick={() => handleSort('email')}>
                Email {sortKey === 'email' && (sortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th className="px-4 py-2 text-left">Roles</th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort('status')}>
                Status {sortKey === 'status' && (sortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => {
              const initials = String(user.name || user.email || '?')
                .split(' ')
                .map((s: string) => s[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
              return (
                <tr key={user.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                        {initials}
                      </div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-gray-700">{user.email}</td>
                  <td className="px-4 py-2">
                    {user.roles && user.roles.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((r: string) => (
                          <span key={r} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs border">{r}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="inline-flex gap-2">
                      <button className="px-2 py-1 rounded-md border text-blue-700 border-blue-200 hover:bg-blue-50" onClick={() => handleEdit(user)}>Edit</button>
                      <button className="px-2 py-1 rounded-md border text-yellow-700 border-yellow-200 hover:bg-yellow-50 disabled:opacity-50" onClick={() => handleDeactivate(user)} disabled={user.status === 'DISABLED'}>Deactivate</button>
                      <button className="px-2 py-1 rounded-md border text-red-700 border-red-200 hover:bg-red-50" onClick={() => handleDelete(user)}>Delete</button>
                      {onManageUser && (
                        <button
                          className="px-2 py-1 rounded-md border text-slate-700 border-slate-200 hover:bg-slate-50"
                          onClick={() => onManageUser(user)}
                        >
                          Role
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )})}
          </tbody>
        </table>
      </div>
      <UserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        user={modalUser}
      />
      {/* Confirm Modal */}
      {confirmOpen && confirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4 text-center">
              {confirmType === 'delete' ? 'Delete User' : 'Deactivate User'}
            </h2>
            <p className="mb-6 text-center">
              Are you sure you want to {confirmType} <span className="font-semibold">{confirmUser.name || confirmUser.email}</span>?
              {confirmType === 'delete' && <><br/>This action cannot be undone.</>}
            </p>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded bg-gray-200" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button
                className={confirmType === 'delete' ? 'px-4 py-2 rounded bg-red-600 text-white' : 'px-4 py-2 rounded bg-yellow-500 text-white'}
                onClick={handleConfirm}
                disabled={saving}
              >
                {saving ? (confirmType === 'delete' ? 'Deleting...' : 'Deactivating...') : (confirmType === 'delete' ? 'Delete' : 'Deactivate')}
              </button>
            </div>
          </div>
        </div>
      )}
      {saving && !confirmOpen && <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50"><div className="bg-white px-6 py-4 rounded shadow">Saving...</div></div>}
    </div>
  )
} 