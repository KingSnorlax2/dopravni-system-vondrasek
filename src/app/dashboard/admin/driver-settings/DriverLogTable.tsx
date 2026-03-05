'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MoreHorizontal, KeyRound, ChevronLeft, ChevronRight, Loader2, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { resetDriverPassword } from '@/app/actions/admin'
import { formatDateTimePrague } from '@/lib/format'

import type { DriverLogRow } from './types'

const SORT_COLUMNS: { key: string; sortBy: string }[] = [
  { key: 'driverName', sortBy: 'name' },
  { key: 'email', sortBy: 'email' },
  { key: 'clockIn', sortBy: 'clockIn' },
  { key: 'clockOut', sortBy: 'clockOut' },
]

function DriverRowActions({ row }: { row: DriverLogRow }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleOpenReset = () => {
    if (!row.uzivatelId) {
      toast.error('U tohoto záznamu nelze resetovat heslo (řidič není v systému).')
      return
    }
    setConfirmOpen(true)
  }

  const handleConfirmReset = () => {
    if (!row.uzivatelId) return
    startTransition(async () => {
      const result = await resetDriverPassword(row.uzivatelId!)
      if (result?.success && 'temporaryPassword' in result) {
        setConfirmOpen(false)
        toast.success(`Dočasné heslo: ${result.temporaryPassword}`, {
          description: 'Zapište si ho a předajte řidiči. Řidič si ho může po přihlášení změnit.',
          duration: 10000,
        })
      } else {
        toast.error(result?.error ?? 'Chyba při resetu hesla')
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
            <span className="sr-only">Otevřít menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={handleOpenReset}
            disabled={!row.uzivatelId || isPending}
          >
            <KeyRound className="mr-2 h-4 w-4" />
            Resetovat heslo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetovat heslo</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete resetovat heslo pro {row.driverName || row.email}?
              Bude vygenerováno nové dočasné heslo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Zrušit</AlertDialogCancel>
            <Button onClick={handleConfirmReset} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetuji...
                </>
              ) : (
                'Resetovat'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function SortableHeader({
  title,
  columnKey,
  sortBy,
  sortOrder,
  onSort,
}: {
  title: string
  columnKey: string
  sortBy: string
  sortOrder: string
  onSort: (sortBy: string, sortOrder: string) => void
}) {
  const config = SORT_COLUMNS.find((c) => c.key === columnKey)
  const isActive = config && config.sortBy === sortBy
  const handleClick = () => {
    if (!config) return
    const nextOrder = isActive && sortOrder === 'desc' ? 'asc' : 'desc'
    onSort(config.sortBy, nextOrder)
  }

  if (!config) return <span>{title}</span>

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1 hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
    >
      {title}
      {isActive && (
        sortOrder === 'asc' ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )
      )}
    </button>
  )
}

type DriverLogTableProps = {
  rows: DriverLogRow[]
  currentPage: number
  totalPages: number
  totalCount: number
  currentSearch: string
  pageSize: number
  sortBy: string
  sortOrder: string
  selectedIds?: number[]
  onSelectionChange?: (ids: number[]) => void
}

function buildPageUrl(
  pathname: string,
  search: string,
  page: number,
  pageSize: number,
  sortBy: string,
  sortOrder: string
): string {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  params.set('page', String(page))
  params.set('pageSize', String(pageSize))
  if (sortBy) params.set('sortBy', sortBy)
  if (sortOrder) params.set('sortOrder', sortOrder)
  return `${pathname}?${params.toString()}`
}

export default function DriverLogTable({
  rows,
  currentPage,
  totalPages,
  totalCount,
  currentSearch,
  pageSize,
  sortBy,
  sortOrder,
  selectedIds = [],
  onSelectionChange,
}: DriverLogTableProps) {
  const selectedSet = new Set(selectedIds)
  const router = useRouter()
  const pathname = usePathname()

  const handleSort = (newSortBy: string, newSortOrder: string) => {
    const params = new URLSearchParams()
    if (currentSearch) params.set('search', currentSearch)
    params.set('page', '1')
    params.set('pageSize', String(pageSize))
    params.set('sortBy', newSortBy)
    params.set('sortOrder', newSortOrder)
    router.push(`${pathname}?${params.toString()}`)
  }

  const columns: ColumnDef<DriverLogRow>[] = []
  if (onSelectionChange) {
    columns.push({
      id: 'select',
      header: () => (
        <Checkbox
          checked={rows.length > 0 && rows.every((r) => selectedSet.has(r.id))}
          onCheckedChange={(checked) => {
            const next = new Set(selectedSet)
            if (checked) rows.forEach((r) => next.add(r.id))
            else rows.forEach((r) => next.delete(r.id))
            onSelectionChange(Array.from(next))
          }}
          aria-label="Vybrat vše"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedSet.has(row.original.id)}
          onCheckedChange={() => {
            const next = new Set(selectedSet)
            if (next.has(row.original.id)) next.delete(row.original.id)
            else next.add(row.original.id)
            onSelectionChange(Array.from(next))
          }}
          aria-label={`Vybrat záznam ${row.original.driverName}`}
        />
      ),
    })
  }
  columns.push(
    {
      accessorKey: 'driverName',
      header: () => (
        <SortableHeader
          title="Jméno"
          columnKey="driverName"
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      ),
    },
    {
      accessorKey: 'email',
      header: () => (
        <SortableHeader
          title="Email"
          columnKey="email"
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      ),
    },
    {
      accessorKey: 'clockIn',
      header: () => (
        <SortableHeader
          title="Začátek směny"
          columnKey="clockIn"
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      ),
      cell: ({ row }) => formatDateTimePrague(row.original.clockIn),
    },
    {
      accessorKey: 'clockOut',
      header: () => (
        <SortableHeader
          title="Odjezd"
          columnKey="clockOut"
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      ),
      cell: ({ row }) =>
        row.original.clockOut
          ? formatDateTimePrague(row.original.clockOut)
          : '—',
    },
    {
      accessorKey: 'cisloTrasy',
      header: 'Trasa',
      cell: ({ row }) => row.original.cisloTrasy ?? '—',
    },
    {
      accessorKey: 'status',
      header: 'Stav',
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge variant={status === 'active' ? 'default' : 'secondary'}>
            {status === 'active' ? 'Aktivní' : 'Ukončeno'}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: 'Akce',
      cell: ({ row }) => <DriverRowActions row={row.original} />,
    },
  )

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const goToPage = (page: number) => {
    router.push(buildPageUrl(pathname, currentSearch, page, pageSize, sortBy, sortOrder))
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Celkem záznamů: {totalCount}
        {totalPages > 1 && ` · Stránka ${currentPage} / ${totalPages}`}
      </p>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
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
                  className="h-24 text-center text-muted-foreground"
                >
                  {currentSearch
                    ? 'Pro hledaný výraz nebyly nalezeny žádné záznamy.'
                    : 'Žádné záznamy docházky'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Předchozí
          </Button>
          <span className="text-sm text-muted-foreground">
            Stránka {currentPage} z {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Další
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
