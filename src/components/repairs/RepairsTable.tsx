'use client'

import { useMemo, useState, useEffect } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getPaginationRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import cs from 'date-fns/locale/cs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Filter, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

type Repair = {
  id: number
  autoId: number
  kategorie: string
  popis: string
  datum: Date | string
  najezd: number
  poznamka: string | null
  cena: number | null
  auto?: {
    id: number
    spz: string
    znacka: string
    model: string
  }
}

interface RepairsTableProps {
  repairs: Repair[]
  showVehicleColumn?: boolean
}

export function RepairsTable({
  repairs,
  showVehicleColumn = false,
}: RepairsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterKategorie, setFilterKategorie] = useState<string>('vse')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [pageSize, setPageSize] = useState(10)

  // Get unique categories for filter
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>()
    repairs.forEach((r) => {
      if (r.kategorie) uniqueCategories.add(r.kategorie)
    })
    return Array.from(uniqueCategories).sort()
  }, [repairs])

  // Filter repairs
  const filteredRepairs = useMemo(() => {
    return repairs.filter((repair) => {
      // Search filter
      const searchTermLower = searchTerm.toLowerCase()
      const matchesSearch =
        !searchTerm ||
        repair.popis?.toLowerCase().includes(searchTermLower) ||
        repair.kategorie?.toLowerCase().includes(searchTermLower) ||
        repair.poznamka?.toLowerCase().includes(searchTermLower) ||
        repair.najezd?.toString().includes(searchTermLower) ||
        repair.cena?.toString().includes(searchTermLower) ||
        (showVehicleColumn &&
          repair.auto &&
          `${repair.auto.spz} ${repair.auto.znacka} ${repair.auto.model}`
            .toLowerCase()
            .includes(searchTermLower))

      // Category filter
      const matchesKategorie =
        filterKategorie === 'vse' || repair.kategorie === filterKategorie

      // Date range filter
      const repairDate = typeof repair.datum === 'string' 
        ? new Date(repair.datum) 
        : repair.datum
      const matchesDateFrom = dateFrom
        ? repairDate >= new Date(dateFrom)
        : true
      const matchesDateTo = dateTo
        ? repairDate <= new Date(dateTo)
        : true

      return matchesSearch && matchesKategorie && matchesDateFrom && matchesDateTo
    })
  }, [repairs, searchTerm, filterKategorie, dateFrom, dateTo, showVehicleColumn])

  const columns = useMemo<ColumnDef<Repair>[]>(() => {
    const baseColumns: ColumnDef<Repair>[] = [
      {
        accessorKey: 'datum',
        header: 'Datum',
        cell: ({ row }) => {
          const date = row.getValue('datum') as Date | string
          const dateObj = typeof date === 'string' ? new Date(date) : date
          return format(dateObj, 'PPP', { locale: cs })
        },
      },
    ]

    // Add vehicle column only if showVehicleColumn is true
    if (showVehicleColumn) {
      baseColumns.push({
        accessorKey: 'auto',
        header: 'Vozidlo',
        cell: ({ row }) => {
          const auto = row.original.auto
          if (!auto) return '-'
          return `${auto.spz} - ${auto.znacka} ${auto.model}`
        },
      })
    }

    baseColumns.push(
      {
        accessorKey: 'kategorie',
        header: 'Kategorie',
      },
      {
        accessorKey: 'popis',
        header: 'Popis',
        cell: ({ row }) => {
          const popis = row.getValue('popis') as string
          return (
            <div className="max-w-[300px] truncate" title={popis}>
              {popis}
            </div>
          )
        },
      },
      {
        accessorKey: 'najezd',
        header: 'Nájezd',
        cell: ({ row }) => {
          const najezd = row.getValue('najezd') as number
          return `${najezd.toLocaleString('cs-CZ')} km`
        },
      }
    )

    // Add price column if cena exists in any repair
    if (repairs.some((r) => r.cena !== null && r.cena !== undefined)) {
      baseColumns.push({
        accessorKey: 'cena',
        header: 'Cena',
        cell: ({ row }) => {
          const cena = row.getValue('cena') as number | null
          if (cena === null || cena === undefined) return '-'
          return `${cena.toLocaleString('cs-CZ')} Kč`
        },
      })
    }

    return baseColumns
  }, [showVehicleColumn, repairs])

  const [sorting, setSorting] = useState<SortingState>([])

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  // Update pagination when pageSize changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageSize: pageSize, pageIndex: 0 }))
  }, [pageSize])

  // Reset to first page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [searchTerm, filterKategorie, dateFrom, dateTo])

  const table = useReactTable({
    data: filteredRepairs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination,
    },
  })

  const hasActiveFilters = searchTerm || filterKategorie !== 'vse' || dateFrom || dateTo

  const clearFilters = () => {
    setSearchTerm('')
    setFilterKategorie('vse')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtry a vyhledávání
            </CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Vymazat filtry
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium">
              Vyhledávání
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Hledat podle popisu, kategorie, vozidla..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div className="space-y-2">
              <Label htmlFor="kategorie-filter" className="text-sm font-medium">
                Kategorie
              </Label>
              <Select value={filterKategorie} onValueChange={setFilterKategorie}>
                <SelectTrigger id="kategorie-filter" className="h-10">
                  <SelectValue placeholder="Všechny kategorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vse">Všechny kategorie</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label htmlFor="date-from" className="text-sm font-medium">
                Datum od
              </Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10"
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label htmlFor="date-to" className="text-sm font-medium">
                Datum do
              </Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          {/* Results count */}
          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              Zobrazeno <span className="font-semibold text-foreground">{table.getRowModel().rows.length}</span> z{' '}
              <span className="font-semibold text-foreground">{filteredRepairs.length}</span> oprav
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Žádné opravy
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </Card>

      {/* Pagination Card */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left Side: Page Info and Page Size */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Page Info */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Stránka{' '}
                  <span className="font-semibold text-foreground">
                    {table.getState().pagination.pageIndex + 1}
                  </span>{' '}
                  z{' '}
                  <span className="font-semibold text-foreground">
                    {table.getPageCount() || 1}
                  </span>
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">
                  Celkem{' '}
                  <span className="font-semibold text-foreground">
                    {filteredRepairs.length}
                  </span>{' '}
                  oprav
                </span>
              </div>

              {/* Page Size Selector */}
              <div className="flex items-center gap-2">
                <Label htmlFor="page-size" className="text-sm font-medium whitespace-nowrap">
                  Záznamů na stránku:
                </Label>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(Number(value))
                    table.setPageIndex(0)
                  }}
                >
                  <SelectTrigger id="page-size" className="h-9 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              {/* First Page Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="h-9 w-9 p-0"
                title="První stránka"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>

              {/* Previous Page Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-9 px-3"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Předchozí
              </Button>

              {/* Page Number Buttons */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(table.getPageCount(), 5) }, (_, i) => {
                  const totalPages = table.getPageCount()
                  const currentPage = table.getState().pagination.pageIndex + 1
                  let pageNum: number

                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => table.setPageIndex(pageNum - 1)}
                      className={`h-9 w-9 p-0 ${
                        currentPage === pageNum
                          ? 'bg-primary text-primary-foreground'
                          : ''
                      }`}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              {/* Next Page Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-9 px-3"
              >
                Další
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>

              {/* Last Page Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="h-9 w-9 p-0"
                title="Poslední stránka"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
