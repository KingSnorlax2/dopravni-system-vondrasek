'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getPaginationRowModel,
  RowSelectionState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { DataTableFloatingBar } from "./data-table-floating-bar"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  enableRowSelection?: boolean
  onDelete?: (selectedRows: TData[]) => void | Promise<void>
  onStatusChange?: (selectedRows: TData[]) => void | Promise<void>
  onSTKChange?: (selectedRows: TData[]) => void | Promise<void>
  onExport?: (selectedRows: TData[]) => void
  onPrint?: (selectedRows: TData[]) => void
  onArchive?: (selectedRows: TData[]) => void | Promise<void>
  isLoading?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  enableRowSelection = false,
  onDelete,
  onStatusChange,
  onSTKChange,
  onExport,
  onPrint,
  onArchive,
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: enableRowSelection,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
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
                <TableRow 
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
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
                  Žádní uživatelé
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
      
      {/* Floating Action Bar */}
      {enableRowSelection && (
        <DataTableFloatingBar
          table={table}
          isLoading={isLoading}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onSTKChange={onSTKChange}
          onExport={onExport}
          onPrint={onPrint}
          onArchive={onArchive}
        />
      )}
    </div>
  )
}

// Export the floating bar component
export { DataTableFloatingBar } from "./data-table-floating-bar"
export type { DataTableFloatingBarProps } from "./data-table-floating-bar" 