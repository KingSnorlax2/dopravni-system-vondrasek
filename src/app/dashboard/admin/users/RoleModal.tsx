"use client"

import { useEffect, useState, useTransition, useCallback } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  FileText, 
  Globe, 
  Home, 
  Settings, 
  X, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Car,
  Newspaper,
  Users,
  BarChart3,
  Wallet,
  Wrench,
  MapPin,
  Search
} from "lucide-react"
import { cn } from "@/lib/utils"

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
  const [searchQuery, setSearchQuery] = useState('')

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

  const togglePage = useCallback((pagePath: string) => {
    setForm(f => {
      const isCurrentlySelected = f.allowedPages.includes(pagePath)
      // Prevent unnecessary updates
      if (isCurrentlySelected && f.allowedPages.length === 1) {
        // Don't allow removing the last page
        return f
      }
      return {
        ...f,
        allowedPages: isCurrentlySelected
          ? f.allowedPages.filter(p => p !== pagePath)
          : [...f.allowedPages, pagePath]
      }
    })
  }, [])

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

  // Categorize pages
  const categorizePages = (pages: AvailablePage[]) => {
    const categories: Record<string, { icon: typeof Home, pages: AvailablePage[] }> = {
      'Hlavní': { icon: Home, pages: [] },
      'Vozidla': { icon: Car, pages: [] },
      'Noviny': { icon: Newspaper, pages: [] },
      'Administrace': { icon: Shield, pages: [] },
      'Ostatní': { icon: Settings, pages: [] },
    }

    pages.forEach(page => {
      if (page.path === '/homepage') {
        categories['Hlavní'].pages.push(page)
      } else if (page.path.startsWith('/dashboard/auta') || page.path.startsWith('/dashboard/opravy')) {
        categories['Vozidla'].pages.push(page)
      } else if (page.path.startsWith('/dashboard/noviny')) {
        categories['Noviny'].pages.push(page)
      } else if (page.path.startsWith('/dashboard/admin') || page.path.startsWith('/dashboard/settings')) {
        categories['Administrace'].pages.push(page)
      } else {
        categories['Ostatní'].pages.push(page)
      }
    })

    // Remove empty categories
    return Object.entries(categories).filter(([_, data]) => data.pages.length > 0)
  }

  // Filter pages by search query
  const filteredPages = availablePages.filter(page => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      page.label.toLowerCase().includes(query) ||
      page.path.toLowerCase().includes(query) ||
      (page.description && page.description.toLowerCase().includes(query))
    )
  })

  const categorizedPages = categorizePages(filteredPages)
  const selectedPagesCount = form.allowedPages.length

  // Get icon for page based on path
  const getPageIcon = (path: string) => {
    if (path.includes('auta') || path.includes('opravy')) return Car
    if (path.includes('noviny')) return Newspaper
    if (path.includes('admin') || path.includes('users')) return Users
    if (path.includes('grafy') || path.includes('charts')) return BarChart3
    if (path.includes('transakce')) return Wallet
    if (path.includes('mapa')) return MapPin
    if (path.includes('settings')) return Settings
    return Home
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Shield className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {role ? 'Upravit roli' : 'Nová role'}
              </h2>
              <p className="text-sm text-gray-500 mt-1.5">
                {role ? 'Upravte informace o roli a oprávnění' : 'Vytvořte novou roli s oprávněními'}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isPending}
            className="h-9 w-9"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Zavřít</span>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Základní informace */}
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FileText className="h-5 w-5 text-gray-700" />
                </div>
                Základní informace
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Identifikační údaje role
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Technický název *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="ADMIN, DRIVER, MANAGER"
                    className="mt-2 font-mono uppercase"
                    required
                    disabled={isPending || !!role?.id}
                    title={role?.id ? 'Název role nelze změnit' : 'Pouze velká písmena a podtržítka'}
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Pouze velká písmena a podtržítka (např. ADMIN, DRIVER)
                  </p>
                </div>
                <div>
                  <Label htmlFor="displayName" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Zobrazovaný název *
                  </Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    value={form.displayName}
                    onChange={handleChange}
                    placeholder="Administrátor, Řidič"
                    className="mt-2"
                    required
                    disabled={isPending}
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Název zobrazený uživatelům v systému
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="flex items-center gap-2 text-base font-medium">
                  <FileText className="h-4 w-4" />
                  Popis role
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Popište účel role a její oprávnění..."
                  className="mt-2"
                  rows={3}
                  disabled={isPending}
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Volebný popis role a jejích oprávnění
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Oprávnění a přístup */}
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Globe className="h-5 w-5 text-gray-700" />
                </div>
                Oprávnění a přístup
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Nastavte, ke kterým stránkám má role přístup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <Globe className="h-5 w-5 text-gray-600" />
                    Povolené stránky
                  </Label>
                  {selectedPagesCount > 0 && (
                    <Badge variant="secondary" className="text-sm bg-blue-50 text-blue-700 border-blue-200 px-3 py-1.5">
                      {selectedPagesCount} {selectedPagesCount === 1 ? 'stránka' : selectedPagesCount < 5 ? 'stránky' : 'stránek'} vybráno
                    </Badge>
                  )}
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Hledat stránky..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    disabled={isPending}
                  />
                </div>

                <ScrollArea className="h-96 border-2 rounded-lg bg-gray-50/30">
                  <div className="p-4 space-y-6">
                    {categorizedPages.length === 0 ? (
                      <div className="flex items-center justify-center py-8 text-gray-500">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <span>Žádné stránky nenalezeny</span>
                      </div>
                    ) : (
                      categorizedPages.map(([categoryName, categoryData]) => {
                        const CategoryIcon = categoryData.icon
                        const categorySelectedCount = categoryData.pages.filter(p => 
                          form.allowedPages.includes(p.path)
                        ).length
                        const allSelected = categorySelectedCount === categoryData.pages.length && categoryData.pages.length > 0

                        return (
                          <div key={categoryName} className="space-y-2">
                            {/* Category Header */}
                            <div className="flex items-center justify-between pb-3 border-b-2 border-gray-200">
                              <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-gray-100 rounded-md">
                                  <CategoryIcon className="h-4 w-4 text-gray-700" />
                                </div>
                                <span className="font-semibold text-gray-900 text-base">{categoryName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {categorySelectedCount}/{categoryData.pages.length}
                                </Badge>
                              </div>
                              {categoryData.pages.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setForm(f => {
                                      const categoryPaths = new Set(categoryData.pages.map(p => p.path))
                                      const categorySelectedCount = f.allowedPages.filter(p => categoryPaths.has(p)).length
                                      const isAllSelectedInCategory = categorySelectedCount === categoryData.pages.length && categoryData.pages.length > 0
                                      
                                      if (isAllSelectedInCategory) {
                                        // Deselect all in category, but keep at least one page total
                                        const remainingPages = f.allowedPages.filter(p => !categoryPaths.has(p))
                                        // If removing all would leave us with 0 pages, don't allow it
                                        if (remainingPages.length === 0 && f.allowedPages.length > 1) {
                                          // Remove all except one from this category
                                          const pagesToKeep = f.allowedPages.filter(p => !categoryPaths.has(p) || p === categoryData.pages[0].path)
                                          return { ...f, allowedPages: pagesToKeep }
                                        }
                                        return { ...f, allowedPages: remainingPages }
                                      } else {
                                        // Select all in category
                                        const newPages = new Set([...f.allowedPages, ...categoryData.pages.map(p => p.path)])
                                        return { ...f, allowedPages: Array.from(newPages) }
                                      }
                                    })
                                  }}
                                  className="text-xs h-7"
                                  disabled={isPending}
                                >
                                  {allSelected ? 'Zrušit vše' : 'Vybrat vše'}
                                </Button>
                              )}
                            </div>

                            {/* Pages in category */}
                            <div className="grid grid-cols-1 gap-3 pl-2 mt-3">
                              {categoryData.pages.map(page => {
                                const isSelected = form.allowedPages.includes(page.path)
                                const PageIcon = getPageIcon(page.path)
                                return (
                                  <div
                                    key={page.path}
                                    className={cn(
                                      "flex items-start gap-3 p-4 rounded-lg border-2 transition-all group cursor-pointer",
                                      isSelected
                                        ? "bg-blue-50 border-blue-300 shadow-md"
                                        : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                                    )}
                                  >
                                    <Checkbox
                                      id={`page-${page.path}`}
                                      checked={isSelected}
                                      onCheckedChange={(checked) => {
                                        if (!isPending) {
                                          togglePage(page.path)
                                        }
                                      }}
                                      disabled={isPending}
                                      className="mt-0.5"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                      }}
                                    />
                                    <label
                                      htmlFor={`page-${page.path}`}
                                      className="flex-1 cursor-pointer min-w-0"
                                    >
                                      <div className="flex items-center gap-2.5 mb-1.5">
                                        <div className={cn(
                                          "p-1.5 rounded-md",
                                          isSelected ? "bg-blue-100" : "bg-gray-100"
                                        )}>
                                          <PageIcon className={cn(
                                            "h-4 w-4 flex-shrink-0",
                                            isSelected ? "text-blue-700" : "text-gray-500"
                                          )} />
                                        </div>
                                        <span className={cn(
                                          "font-semibold truncate text-sm",
                                          isSelected ? "text-blue-900" : "text-gray-900"
                                        )}>
                                          {page.label}
                                        </span>
                                        {isSelected && (
                                          <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0 ml-auto" />
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-500 font-mono truncate ml-8">{page.path}</div>
                                      {page.description && (
                                        <div className="text-xs text-gray-400 mt-1 ml-8 line-clamp-1">
                                          {page.description}
                                        </div>
                                      )}
                                    </label>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>

              <Separator className="my-6" />

              <div>
                <Label htmlFor="defaultLandingPage" className="flex items-center gap-2 text-base font-medium mb-2">
                  <Home className="h-4 w-4" />
                  Výchozí stránka po přihlášení
                </Label>
                <Select
                  value={form.defaultLandingPage || undefined}
                  onValueChange={(value) => setForm(f => ({ ...f, defaultLandingPage: value }))}
                  disabled={isPending || form.allowedPages.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="-- Vyberte stránku --" />
                  </SelectTrigger>
                  <SelectContent>
                    {form.allowedPages.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-gray-500">
                        Nejdříve vyberte alespoň jednu povolenou stránku
                      </div>
                    ) : (
                      availablePages
                        .filter(page => form.allowedPages.includes(page.path))
                        .map(page => (
                          <SelectItem key={page.path} value={page.path}>
                            {page.label} ({page.path})
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-2">
                  Stránka, na kterou budou uživatelé s touto rolí přesměrováni po přihlášení
                  {form.allowedPages.length === 0 && (
                    <span className="text-amber-600 block mt-1.5 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Nejdříve vyberte alespoň jednu povolenou stránku
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Status */}
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Settings className="h-5 w-5 text-gray-700" />
                </div>
                Status
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Aktivace nebo deaktivace role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border-2 border-gray-200">
                <div className="flex items-center gap-4">
                  <Switch
                    id="isActive"
                    checked={form.isActive}
                    onCheckedChange={(checked) => setForm(f => ({ ...f, isActive: checked }))}
                    disabled={isPending}
                  />
                  <div>
                    <Label htmlFor="isActive" className="cursor-pointer font-semibold text-base">
                      Aktivní role
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      {form.isActive 
                        ? 'Role je aktivní a může být přiřazena uživatelům' 
                        : 'Role je deaktivovaná a nelze ji přiřadit novým uživatelům'}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={form.isActive ? "success" : "outline"}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium",
                    form.isActive 
                      ? "bg-green-100 text-green-700 border-green-300" 
                      : "bg-gray-200 text-gray-600 border-gray-300"
                  )}
                >
                  {form.isActive ? 'Aktivní' : 'Neaktivní'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end items-center gap-3 pt-6 border-t-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isPending}
              size="lg"
            >
              <X className="h-4 w-4 mr-2" />
              Zrušit
            </Button>
            <Button 
              type="submit" 
              disabled={isPending}
              size="lg"
              className="min-w-[160px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ukládání...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {role ? 'Uložit změny' : 'Vytvořit roli'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
