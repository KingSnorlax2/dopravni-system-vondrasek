'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import DriverLoginControl from '@/components/newspaper/DriverLoginControl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Download, RefreshCw } from 'lucide-react'
import DriverLogTable from './DriverLogTable'
import type { DriverLogRow } from './types'

const PAGE_SIZE_OPTIONS = [5, 10, 20, 25, 50, 100] as const

type DriverSettingsClientProps = {
  rows: DriverLogRow[]
  currentPage: number
  totalPages: number
  totalCount: number
  currentSearch: string
  pageSize: number
  sortBy: string
  sortOrder: string
}

export default function DriverSettingsClient({
  rows,
  currentPage,
  totalPages,
  totalCount,
  currentSearch,
  pageSize,
  sortBy,
  sortOrder,
}: DriverSettingsClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchValue, setSearchValue] = useState(currentSearch)

  useEffect(() => {
    setSearchValue(currentSearch || '')
  }, [currentSearch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchValue.trim()) params.set('search', searchValue.trim())
    params.set('page', '1')
    params.set('pageSize', String(pageSize))
    if (sortBy) params.set('sortBy', sortBy)
    if (sortOrder) params.set('sortOrder', sortOrder)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handlePageSizeChange = (value: string) => {
    const params = new URLSearchParams()
    if (currentSearch) params.set('search', currentSearch)
    params.set('page', '1')
    params.set('pageSize', value)
    if (sortBy) params.set('sortBy', sortBy)
    if (sortOrder) params.set('sortOrder', sortOrder)
    router.push(`${pathname}?${params.toString()}`)
  }

  const [isExporting, setIsExporting] = useState(false)
  const [isRefreshing, startRefreshTransition] = useTransition()

  const handleExportCsv = async () => {
    const params = new URLSearchParams()
    if (currentSearch) params.set('search', currentSearch)
    if (sortBy) params.set('sortBy', sortBy)
    if (sortOrder) params.set('sortOrder', sortOrder)
    const url = `/api/admin/export-driver-logs?${params.toString()}`

    setIsExporting(true)
    try {
      const res = await fetch(url)
      if (!res.ok) {
        toast.error('Chyba při exportu dat. Nemáte oprávnění.')
        return
      }
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = 'dochazka_ridicu.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objectUrl)
    } finally {
      setIsExporting(false)
    }
  }

  const handleRefresh = () => {
    startRefreshTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Uzamčení přihlášení řidičů</CardTitle>
          <CardDescription>
            Spravujte přístup řidičů k přihlašovacímu systému
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DriverLoginControl />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Přehled docházky a aktivit řidičů</CardTitle>
          <CardDescription>
            Směny řidičů: příchod, odjezd a stav
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                type="search"
                placeholder="Vyhledat podle jména nebo e-mailu..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="max-w-sm"
                aria-label="Vyhledat řidiče"
              />
              <Button type="submit" variant="secondary" size="icon" aria-label="Hledat">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Řádků na stránku:</span>
              <Select
                value={String(pageSize)}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportovat CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Obnovit
            </Button>
          </div>
          <DriverLogTable
            rows={rows}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            currentSearch={currentSearch}
            pageSize={pageSize}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        </CardContent>
      </Card>
    </div>
  )
}
