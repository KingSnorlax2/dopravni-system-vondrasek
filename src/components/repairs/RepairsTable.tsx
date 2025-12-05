'use client'

import { useMemo, useState } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getPaginationRowModel,
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

  const table = useReactTable({
    data: repairs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  return (
    <div>
      <div className="rounded-md border">
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
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Předchozí
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Další
        </Button>
      </div>
    </div>
  )
}
