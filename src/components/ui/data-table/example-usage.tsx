/**
 * Example usage of DataTable with FloatingBar
 * 
 * This file shows how to use the DataTable component with row selection
 * and the floating action bar.
 */

'use client'

import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "./index"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableColumnHeader } from "./column-header"

// Example data type
type ExampleData = {
  id: string
  name: string
  email: string
  status: string
}

// Example columns with selection checkbox
export const exampleColumns: ColumnDef<ExampleData>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Jméno" />,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
  },
]

// Example usage component
export function ExampleDataTable() {
  const exampleData: ExampleData[] = [
    { id: "1", name: "Jan Novák", email: "jan@example.com", status: "Aktivní" },
    { id: "2", name: "Marie Svobodová", email: "marie@example.com", status: "Aktivní" },
    { id: "3", name: "Petr Dvořák", email: "petr@example.com", status: "Neaktivní" },
  ]

  return (
    <DataTable
      columns={exampleColumns}
      data={exampleData}
      enableRowSelection={true}
      onDelete={async (selectedRows) => {
        console.log("Delete:", selectedRows)
        // Implement delete logic
      }}
      onStatusChange={async (selectedRows) => {
        console.log("Status change:", selectedRows)
        // Implement status change logic
      }}
      onSTKChange={async (selectedRows) => {
        console.log("STK change:", selectedRows)
        // Implement STK change logic
      }}
      onExport={(selectedRows) => {
        console.log("Export:", selectedRows)
        // Implement export logic
      }}
      onPrint={(selectedRows) => {
        console.log("Print:", selectedRows)
        // Implement print logic
      }}
      onArchive={async (selectedRows) => {
        console.log("Archive:", selectedRows)
        // Implement archive logic
      }}
    />
  )
}




