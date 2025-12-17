"use client"

import { useEffect, useState, useTransition } from 'react'
import { RoleModal } from './RoleModal'
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { upsertRole } from "@/app/actions/admin"
import { Shield, Plus, Edit, Trash2, Users } from "lucide-react"

interface AvailablePage {
  path: string
  label: string
  description: string
}

interface Role {
  id?: number
  name: string
  displayName: string
  description?: string
  allowedPages: string[]
  defaultLandingPage?: string
  isActive: boolean
  userCount?: number
}

export function RoleTable() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalRole, setModalRole] = useState<Role | null>(null)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmRole, setConfirmRole] = useState<Role | null>(null)
  const [availablePages, setAvailablePages] = useState<AvailablePage[]>([])

  const fetchAvailablePages = () => {
    fetch('/api/admin/available-pages')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAvailablePages(data)
        }
      })
      .catch(err => {
        console.error('Failed to fetch available pages:', err)
        // Fallback to basic pages
        setAvailablePages([
          { path: '/homepage', label: 'Homepage', description: 'Hlavní přehled' },
          { path: '/dashboard/auta', label: 'Vozidla', description: 'Správa vozidel' },
        ])
      })
  }

  const fetchRoles = () => {
    setLoading(true)
    fetch('/api/admin/roles')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRoles(data.filter((r: any) => r && typeof r === 'object' && r.name))
        } else {
          setRoles([])
          setError('Neplatná data rolí')
        }
        setLoading(false)
      })
      .catch(err => {
        setError('Nepodařilo se načíst role')
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchAvailablePages()
    fetchRoles()
  }, [])

  // Filtering
  const filtered = roles.filter(role => {
    if (!role || typeof role !== 'object' || !role.name) return false
    const searchLower = search.toLowerCase()
    return (
      role.name.toLowerCase().includes(searchLower) ||
      role.displayName?.toLowerCase().includes(searchLower) ||
      role.description?.toLowerCase().includes(searchLower)
    )
  })

  const handleAdd = () => {
    setModalRole(null)
    setModalOpen(true)
  }

  const handleEdit = (role: Role) => {
    setModalRole(role)
    setModalOpen(true)
  }

  const handleSave = async (formData: Role) => {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const result = await upsertRole(formData)
        if (result.success) {
          setToast('Role úspěšně uložena')
          setModalOpen(false)
          setModalRole(null)
          fetchRoles()
          setTimeout(() => setToast(null), 3000)
          resolve()
        } else {
          setToast(result.error || 'Nepodařilo se uložit roli')
          setTimeout(() => setToast(null), 3000)
          resolve()
        }
      })
    })
  }

  const handleDelete = (role: Role) => {
    setConfirmRole(role)
    setConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!confirmRole?.id) return
    
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/roles/${confirmRole.id}`, {
          method: 'DELETE',
        })
        if (res.ok) {
          setToast('Role smazána')
          setConfirmOpen(false)
          fetchRoles()
        } else {
          setToast('Nepodařilo se smazat roli')
        }
        setTimeout(() => setToast(null), 3000)
      } catch (e) {
        setToast('Nastala chyba při mazání role')
        setTimeout(() => setToast(null), 3000)
      }
    })
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Načítání rolí...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg z-50">
          {toast}
        </div>
      )}

      {/* Search & Add Button */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <Button
          onClick={handleAdd}
          disabled={isPending}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Přidat roli
        </Button>
        <Input
          type="text"
          placeholder="Hledat role..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left w-[20%]">Název</th>
              <th className="px-3 py-3 text-left w-[30%]">Popis</th>
              <th className="px-3 py-3 text-left w-[25%]">Povolené stránky</th>
              <th className="px-3 py-3 text-left w-[10%]">Status</th>
              <th className="px-3 py-3 text-left w-[10%]">Uživatelé</th>
              <th className="px-3 py-3 text-center w-[15%]">Akce</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                  {search ? 'Žádné role nenalezeny' : 'Žádné role. Vytvořte první roli.'}
                </td>
              </tr>
            ) : (
              filtered.map(role => (
                <tr key={role.id || role.name} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium text-gray-900">{role.displayName || role.name}</div>
                        <div className="text-xs text-gray-500">{role.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-700 text-sm">
                    {role.description || <span className="text-gray-400">Bez popisu</span>}
                  </td>
                  <td className="px-3 py-3">
                    {role.allowedPages && role.allowedPages.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {role.allowedPages.slice(0, 3).map((page, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-xs border border-blue-200 truncate max-w-[100px]">
                            {page}
                          </span>
                        ))}
                        {role.allowedPages.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-xs">
                            +{role.allowedPages.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">Žádné</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant={role.isActive ? 'success' : 'outline'}>
                      {role.isActive ? 'Aktivní' : 'Neaktivní'}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">{role.userCount || 0}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1 justify-center">
                      <button
                        className="px-2 py-1 text-xs rounded-md border text-blue-700 border-blue-200 hover:bg-blue-50 disabled:opacity-50 whitespace-nowrap"
                        onClick={() => handleEdit(role)}
                        disabled={isPending}
                      >
                        <Edit className="h-3 w-3 inline mr-1" />
                        Upravit
                      </button>
                      <button
                        className="px-2 py-1 text-xs rounded-md border text-red-700 border-red-200 hover:bg-red-50 disabled:opacity-50 whitespace-nowrap"
                        onClick={() => handleDelete(role)}
                        disabled={isPending || (role.userCount && role.userCount > 0)}
                        title={role.userCount && role.userCount > 0 ? 'Nelze smazat roli s přiřazenými uživateli' : ''}
                      >
                        <Trash2 className="h-3 w-3 inline mr-1" />
                        Smazat
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <RoleModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setModalRole(null)
        }}
        onSave={handleSave}
        role={modalRole}
        availablePages={availablePages}
      />

      {/* Confirm Delete Modal */}
      {confirmOpen && confirmRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4 text-center">Smazat roli</h2>
            <p className="mb-6 text-center">
              Opravdu chcete smazat roli{' '}
              <span className="font-semibold">{confirmRole.displayName || confirmRole.name}</span>?
              <br />
              Tato akce je nevratná.
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
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                onClick={handleConfirmDelete}
                disabled={isPending}
              >
                {isPending ? 'Mazání...' : 'Smazat'}
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

