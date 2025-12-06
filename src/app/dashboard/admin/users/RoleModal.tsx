"use client"

import { useEffect, useState, useTransition } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

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
}

export function RoleModal({ 
  open, 
  onClose, 
  onSave, 
  role, 
  availablePages,
  onSuccess
}: {
  open: boolean
  onClose: () => void
  onSave: (data: Role) => Promise<void>
  role?: Role | null
  availablePages: AvailablePage[]
  onSuccess?: () => void
}) {
  const [form, setForm] = useState<Role>({
    name: '',
    displayName: '',
    description: '',
    allowedPages: [],
    defaultLandingPage: '',
    isActive: true,
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (role) {
      setForm({
        id: role.id,
        name: role.name || '',
        displayName: role.displayName || '',
        description: role.description || '',
        allowedPages: role.allowedPages || [],
        defaultLandingPage: role.defaultLandingPage || '',
        isActive: role.isActive !== undefined ? role.isActive : true,
      })
    } else {
      setForm({
        name: '',
        displayName: '',
        description: '',
        allowedPages: [],
        defaultLandingPage: '',
        isActive: true,
      })
    }
    setError(null)
  }, [role, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const togglePage = (pagePath: string) => {
    setForm(f => ({
      ...f,
      allowedPages: f.allowedPages.includes(pagePath)
        ? f.allowedPages.filter(p => p !== pagePath)
        : [...f.allowedPages, pagePath]
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!form.name.trim()) {
      setError('Název role je povinný')
      return
    }
    if (!form.displayName.trim()) {
      setError('Zobrazovaný název je povinný')
      return
    }
    if (!/^[A-Z_]+$/.test(form.name)) {
      setError('Název role musí obsahovat pouze velká písmena a podtržítka (např. ADMIN, DRIVER)')
      return
    }

    startTransition(async () => {
      await onSave(form)
      // Success handling is done in parent component
      // Modal will be closed by parent after successful save
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {role ? 'Upravit roli' : 'Nová role'}
            </h2>
            <p className="text-sm text-gray-500">
              {role ? 'Upravte informace o roli' : 'Vytvořte novou roli s oprávněními'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Název role *</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="ADMIN, DRIVER, MANAGER"
                className="mt-1 font-mono"
                required
                disabled={isPending || !!role?.id}
                title={role?.id ? 'Název role nelze změnit' : 'Pouze velká písmena a podtržítka'}
              />
              <p className="text-xs text-gray-500 mt-1">
                Technický název (např. ADMIN, DRIVER)
              </p>
            </div>
            <div>
              <Label htmlFor="displayName">Zobrazovaný název *</Label>
              <Input
                id="displayName"
                name="displayName"
                value={form.displayName}
                onChange={handleChange}
                placeholder="Administrátor, Řidič"
                className="mt-1"
                required
                disabled={isPending}
              />
              <p className="text-xs text-gray-500 mt-1">
                Název zobrazený uživatelům
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Popis</Label>
            <Textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Popis role a jejích oprávnění..."
              className="mt-1"
              rows={3}
              disabled={isPending}
            />
          </div>

          <div>
            <Label>Povolené stránky</Label>
            <p className="text-xs text-gray-500 mb-2">
              Vyberte stránky, ke kterým má tato role přístup
            </p>
            <ScrollArea className="h-48 border rounded-md p-3 mt-1">
              <div className="space-y-2">
                {availablePages.length === 0 ? (
                  <p className="text-sm text-gray-500">Načítání stránek...</p>
                ) : (
                  availablePages.map(page => (
                    <div key={page.path} className="flex items-start space-x-2">
                      <Checkbox
                        id={`page-${page.path}`}
                        checked={form.allowedPages.includes(page.path)}
                        onCheckedChange={() => togglePage(page.path)}
                        disabled={isPending}
                        className="mt-0.5"
                      />
                      <label
                        htmlFor={`page-${page.path}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        <div className="font-medium text-gray-900">{page.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{page.path}</div>
                        {page.description && (
                          <div className="text-xs text-gray-400 mt-0.5">{page.description}</div>
                        )}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div>
            <Label htmlFor="defaultLandingPage">Výchozí stránka</Label>
            <select
              id="defaultLandingPage"
              name="defaultLandingPage"
              value={form.defaultLandingPage || ''}
              onChange={(e) => setForm(f => ({ ...f, defaultLandingPage: e.target.value }))}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-white text-gray-900 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isPending}
            >
              <option value="">-- Vyberte stránku --</option>
              {availablePages.map(page => (
                <option key={page.path} value={page.path}>
                  {page.label} ({page.path})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Stránka, na kterou budou uživatelé s touto rolí přesměrováni po přihlášení
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={form.isActive}
              onCheckedChange={(checked) => setForm(f => ({ ...f, isActive: checked }))}
              disabled={isPending}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Aktivní role
            </Label>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded border border-red-200">
              {error}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Zrušit
            </Button>
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending ? 'Ukládání...' : 'Uložit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
