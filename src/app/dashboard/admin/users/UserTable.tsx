"use client"

import { useEffect, useState } from 'react'
import { UserModal } from './UserModal'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DISABLED', label: 'Disabled' },
]

export function UserTable() {
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
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white font-semibold shadow"
          onClick={handleAdd}
        >
          + Add User
        </button>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-64"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Roles</option>
          {allRoles.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2 text-left cursor-pointer" onClick={() => handleSort('name')}>
                Name {sortKey === 'name' && (sortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th className="border px-4 py-2 text-left cursor-pointer" onClick={() => handleSort('email')}>
                Email {sortKey === 'email' && (sortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th className="border px-4 py-2 text-left">Roles</th>
              <th className="border px-4 py-2 text-left cursor-pointer" onClick={() => handleSort('status')}>
                Status {sortKey === 'status' && (sortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th className="border px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="border px-4 py-2">{user.name}</td>
                <td className="border px-4 py-2">{user.email}</td>
                <td className="border px-4 py-2">
                  {user.roles && user.roles.length > 0 ? user.roles.join(', ') : <span className="text-gray-400">None</span>}
                </td>
                <td className="border px-4 py-2">
                  <span className={user.status === 'ACTIVE' ? 'text-green-700' : 'text-gray-400'}>{user.status}</span>
                </td>
                <td className="border px-4 py-2 text-center">
                  <button className="text-blue-600 hover:underline mr-2" onClick={() => handleEdit(user)}>Edit</button>
                  <button className="text-yellow-600 hover:underline mr-2" onClick={() => handleDeactivate(user)} disabled={user.status === 'DISABLED'}>Deactivate</button>
                  <button className="text-red-600 hover:underline" onClick={() => handleDelete(user)}>Delete</button>
                </td>
              </tr>
            ))}
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