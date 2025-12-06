"use client"

import { useEffect, useState, useTransition } from 'react'
import { UserModal } from './UserModal'
import { useAccessControl } from "@/hooks/useAccessControl"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { upsertUser, toggleUserStatus } from "@/app/actions/admin"
import { format } from "date-fns"
import cs from "date-fns/locale/cs"

const STATUS_OPTIONS = [
  { value: 'all', label: 'Všechny statusy' },
  { value: 'ACTIVE', label: 'Aktivní' },
  { value: 'DISABLED', label: 'Deaktivovaný' },
  { value: 'SUSPENDED', label: 'Pozastavený' },
]

// Helper function to format date
function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'Nikdy'
  try {
    return format(new Date(date), 'd. M. HH:mm', { locale: cs })
  } catch {
    return 'Neplatné datum'
  }
}

// Helper function to get user initials
function getInitials(name: string | null | undefined, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map((s) => s[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

// Helper function to get status badge variant
function getStatusVariant(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'success'
    case 'DISABLED':
      return 'destructive'
    case 'SUSPENDED':
      return 'warning'
    default:
      return 'outline'
  }
}

// Helper function to get status label
function getStatusLabel(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'Aktivní'
    case 'DISABLED':
      return 'Deaktivovaný'
    case 'SUSPENDED':
      return 'Pozastavený'
    default:
      return status
  }
}

export function UserTable({ onManageUser }: { onManageUser?: (user: any) => void }) {
  const { hasPermission } = useAccessControl()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortKey, setSortKey] = useState<'name' | 'email' | 'status' | 'lastLoginAt'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [allRoles, setAllRoles] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalUser, setModalUser] = useState<any | null>(null)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmType, setConfirmType] = useState<'delete' | 'deactivate' | 'activate' | null>(null)
  const [confirmUser, setConfirmUser] = useState<any | null>(null)

  const fetchUsers = () => {
    setLoading(true)
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUsers(data.filter(u => u && typeof u === 'object' && u.email && u.name))
          // Collect all unique roles for filter dropdown
          const roles = Array.from(new Set(data.flatMap((u: any) => (u && u.roles ? u.roles : []))))
          setAllRoles(roles)
        } else {
          setUsers([])
          setError('Neplatná data uživatelů')
        }
        setLoading(false)
      })
      .catch(err => {
        setError('Nepodařilo se načíst uživatele')
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Filtering
  let filtered = users.filter(user => {
    if (!user || typeof user !== 'object' || !user.name || !user.email) return false
    const matchesSearch =
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || (user.roles && user.roles.includes(roleFilter))
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  // Sorting
  filtered = filtered.sort((a, b) => {
    let vA: any = a[sortKey] || ''
    let vB: any = b[sortKey] || ''
    
    // Handle dates
    if (sortKey === 'lastLoginAt') {
      vA = vA ? new Date(vA).getTime() : 0
      vB = vB ? new Date(vB).getTime() : 0
    } else if (typeof vA === 'string') {
      vA = vA.toLowerCase()
    }
    if (typeof vB === 'string') {
      vB = vB.toLowerCase()
    }
    
    if (vA < vB) return sortDir === 'asc' ? -1 : 1
    if (vA > vB) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const handleSort = (key: 'name' | 'email' | 'status' | 'lastLoginAt') => {
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
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const result = await upsertUser(form)
        if (result.success) {
          setToast('Uživatel úspěšně uložen')
          setModalOpen(false)
          fetchUsers()
          resolve()
        } else {
          // Return error to modal - don't close it
          resolve()
          // Error will be handled by modal
        }
      })
    })
  }

  const handleDeactivate = (user: any) => {
    setConfirmUser(user)
    setConfirmType('deactivate')
    setConfirmOpen(true)
  }

  const handleActivate = (user: any) => {
    setConfirmUser(user)
    setConfirmType('activate')
    setConfirmOpen(true)
  }

  const handleDelete = (user: any) => {
    setConfirmUser(user)
    setConfirmType('delete')
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    if (!confirmUser || !confirmType) return
    
    startTransition(async () => {
      if (confirmType === 'deactivate') {
        const result = await toggleUserStatus(confirmUser.id, 'DISABLED')
        if (result.success) {
          setToast('Uživatel deaktivován')
          setConfirmOpen(false)
          fetchUsers()
        } else {
          setToast(result.error || 'Nepodařilo se deaktivovat uživatele')
        }
      } else if (confirmType === 'activate') {
        const result = await toggleUserStatus(confirmUser.id, 'ACTIVE')
        if (result.success) {
          setToast('Uživatel aktivován')
          setConfirmOpen(false)
          fetchUsers()
        } else {
          setToast(result.error || 'Nepodařilo se aktivovat uživatele')
        }
      } else if (confirmType === 'delete') {
        // For delete, we'll use the API route for now
        const res = await fetch(`/api/admin/users/${confirmUser.id}`, {
          method: 'DELETE'
        })
        if (res.ok) {
          setToast('Uživatel smazán')
          setConfirmOpen(false)
          fetchUsers()
        } else {
          setToast('Nepodařilo se smazat uživatele')
        }
      }
      setTimeout(() => setToast(null), 3000)
    })
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Načítání uživatelů...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg z-50">
          {toast}
        </div>
      )}
      
      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        {hasPermission("manage_users") && (
          <button
            className="px-3 py-2 rounded-md bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition disabled:opacity-50"
            onClick={handleAdd}
            disabled={isPending}
          >
            + Přidat uživatele
          </button>
        )}
        <Input
          type="text"
          placeholder="Hledat podle jména nebo emailu..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Všechny role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny role</SelectItem>
            {allRoles.map(role => (
              <SelectItem key={role} value={role}>{role}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Všechny statusy" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left w-14">Avatar</th>
                <th className="px-2 py-3 text-left w-[15%] cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                  Jméno {sortKey === 'name' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th className="px-2 py-3 text-left w-[20%] cursor-pointer hover:bg-gray-100" onClick={() => handleSort('email')}>
                  Email {sortKey === 'email' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th className="px-2 py-3 text-left w-[12%]">Role</th>
                <th className="px-2 py-3 text-left w-[12%] cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
                  Status {sortKey === 'status' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th className="px-2 py-3 text-left w-[15%] cursor-pointer hover:bg-gray-100" onClick={() => handleSort('lastLoginAt')}>
                  Poslední přihlášení {sortKey === 'lastLoginAt' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th className="px-2 py-3 text-center w-[24%]">Akce</th>
              </tr>
            </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                  Žádní uživatelé nenalezeni
                </td>
              </tr>
            ) : (
              filtered.map(user => {
                const initials = getInitials(user.name, user.email)
                return (
                  <tr key={user.id} className="border-t hover:bg-gray-50">
                    <td className="px-2 py-3">
                      <Avatar className="h-8 w-8">
                        {user.avatar && <AvatarImage src={user.avatar} alt={user.name || user.email} />}
                        <AvatarFallback className="bg-gray-200 text-gray-700 text-xs font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </td>
                    <td className="px-2 py-3 font-medium text-gray-900 truncate" title={user.name}>{user.name}</td>
                    <td className="px-2 py-3 text-gray-700 truncate" title={user.email}>{user.email}</td>
                    <td className="px-2 py-3">
                      {user.roles && user.roles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((r: string) => (
                            <span key={r} className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs border truncate max-w-full">
                              {r}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Žádné</span>
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <Badge variant={getStatusVariant(user.status)} className="text-xs">
                        {getStatusLabel(user.status)}
                      </Badge>
                    </td>
                    <td className="px-2 py-3 text-gray-600 text-xs truncate" title={formatDate(user.lastLoginAt)}>
                      {formatDate(user.lastLoginAt)}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap gap-1 justify-center">
                        <button 
                          className="px-2 py-1 text-xs rounded-md border text-blue-700 border-blue-200 hover:bg-blue-50 disabled:opacity-50 whitespace-nowrap" 
                          onClick={() => handleEdit(user)}
                          disabled={isPending}
                        >
                          Upravit
                        </button>
                        {user.status === 'DISABLED' || user.status === 'SUSPENDED' ? (
                          <button 
                            className="px-2 py-1 text-xs rounded-md border text-green-700 border-green-200 hover:bg-green-50 disabled:opacity-50 whitespace-nowrap" 
                            onClick={() => handleActivate(user)} 
                            disabled={isPending}
                          >
                            Aktivovat
                          </button>
                        ) : (
                          <button 
                            className="px-2 py-1 text-xs rounded-md border text-yellow-700 border-yellow-200 hover:bg-yellow-50 disabled:opacity-50 whitespace-nowrap" 
                            onClick={() => handleDeactivate(user)} 
                            disabled={isPending}
                          >
                            Deaktivovat
                          </button>
                        )}
                        <button 
                          className="px-2 py-1 text-xs rounded-md border text-red-700 border-red-200 hover:bg-red-50 disabled:opacity-50 whitespace-nowrap" 
                          onClick={() => handleDelete(user)}
                          disabled={isPending}
                        >
                          Smazat
                        </button>
                        {onManageUser && (
                          <button
                            className="px-2 py-1 text-xs rounded-md border text-slate-700 border-slate-200 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap"
                            onClick={() => onManageUser(user)}
                            disabled={isPending}
                          >
                            Role
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
            </tbody>
          </table>
      </div>
      
      <UserModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setModalUser(null)
        }}
        onSave={handleSave}
        user={modalUser}
        onSuccess={() => {
          fetchUsers()
          setToast('Uživatel úspěšně uložen')
          setTimeout(() => setToast(null), 3000)
        }}
      />
      
      {/* Confirm Modal */}
      {confirmOpen && confirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4 text-center">
              {confirmType === 'delete' 
                ? 'Smazat uživatele' 
                : confirmType === 'activate'
                ? 'Aktivovat uživatele'
                : 'Deaktivovat uživatele'}
            </h2>
            <p className="mb-6 text-center">
              Opravdu chcete {confirmType === 'delete' 
                ? 'smazat' 
                : confirmType === 'activate'
                ? 'aktivovat'
                : 'deaktivovat'} uživatele{' '}
              <span className="font-semibold">{confirmUser.name || confirmUser.email}</span>?
              {confirmType === 'delete' && <><br />Tato akce je nevratná.</>}
            </p>
            <div className="flex justify-end gap-2">
              <button 
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50" 
                onClick={() => setConfirmOpen(false)}
                disabled={isPending}
              >
                Zrušit
              </button>
              <button
                className={
                  confirmType === 'delete' 
                    ? 'px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50' 
                    : confirmType === 'activate'
                    ? 'px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                    : 'px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50'
                }
                onClick={handleConfirm}
                disabled={isPending}
              >
                {isPending 
                  ? (confirmType === 'delete' 
                      ? 'Mazání...' 
                      : confirmType === 'activate'
                      ? 'Aktivace...'
                      : 'Deaktivace...') 
                  : (confirmType === 'delete' 
                      ? 'Smazat' 
                      : confirmType === 'activate'
                      ? 'Aktivovat'
                      : 'Deaktivovat')
                }
              </button>
            </div>
          </div>
        </div>
      )}
      
      {isPending && !confirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded shadow">Ukládání...</div>
        </div>
      )}
    </div>
  )
}
