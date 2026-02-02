"use client"

import { useEffect, useState, useTransition } from 'react'
import { RoleModal } from './RoleModal'
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { upsertRole } from "@/app/actions/admin"
import { Shield, Plus, Edit, Trash2, Users, Globe, CheckCircle2, XCircle, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

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
      <div className="flex flex-wrap gap-6 mb-6 items-end">
        <Button
          onClick={handleAdd}
          disabled={isPending}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Přidat roli
        </Button>
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Hledat role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Grid Cards */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center text-gray-500 rounded-lg border border-dashed">
          <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">
            {search ? 'Žádné role nenalezeny' : 'Žádné role'}
          </p>
          <p className="text-sm">
            {search ? 'Zkuste upravit vyhledávací dotaz' : 'Vytvořte první roli pro začátek'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(role => (
            <Card key={role.id || role.name} className="flex flex-col hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold truncate">
                        {role.displayName || role.name}
                      </CardTitle>
                      <CardDescription className="text-xs font-mono truncate">
                        {role.name}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {role.userCount || 0}
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-4">
                {/* Description */}
                <div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {role.description || <span className="text-gray-400 italic">Bez popisu</span>}
                  </p>
                </div>

                {/* Access Level - Permissions */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-700">Povolené stránky</span>
                  </div>
                  {role.allowedPages && role.allowedPages.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {role.allowedPages.slice(0, 3).map((page, idx) => (
                        <Badge 
                          key={idx} 
                          variant="secondary" 
                          className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {page.split('/').pop() || page}
                        </Badge>
                      ))}
                      {role.allowedPages.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.allowedPages.length - 3} více
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Žádné stránky</span>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    {role.isActive ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className={`text-sm font-medium ${role.isActive ? 'text-green-700' : 'text-gray-500'}`}>
                      {role.isActive ? 'Aktivní' : 'Neaktivní'}
                    </span>
                  </div>
                  <Switch
                    checked={role.isActive}
                    disabled={true}
                    aria-label="Status role"
                  />
                </div>
              </CardContent>

              <CardFooter className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(role)}
                  disabled={isPending}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Upravit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(role)}
                  disabled={isPending || (role.userCount && role.userCount > 0)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  title={role.userCount && role.userCount > 0 ? 'Nelze smazat roli s přiřazenými uživateli' : ''}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

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

