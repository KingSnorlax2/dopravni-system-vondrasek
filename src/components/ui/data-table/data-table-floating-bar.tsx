'use client'

import { Table } from "@tanstack/react-table"
import { motion, AnimatePresence } from "framer-motion"
import { Trash2, Users, Calendar, Settings, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface DataTableFloatingBarProps<TData> {
  table: Table<TData>
  isLoading?: boolean
  onDelete?: (selectedRows: TData[]) => void | Promise<void>
  onStatusChange?: (selectedRows: TData[]) => void | Promise<void>
  onSTKChange?: (selectedRows: TData[]) => void | Promise<void>
  onExport?: (selectedRows: TData[]) => void
  onPrint?: (selectedRows: TData[]) => void
  onArchive?: (selectedRows: TData[]) => void | Promise<void>
}

export function DataTableFloatingBar<TData>({
  table,
  isLoading = false,
  onDelete,
  onStatusChange,
  onSTKChange,
  onExport,
  onPrint,
  onArchive,
}: DataTableFloatingBarProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length
  const totalCount = table.getFilteredRowModel().rows.length

  const handleClearSelection = () => {
    table.toggleAllPageRowsSelected(false)
  }

  const handleDelete = () => {
    if (onDelete) {
      const selectedData = selectedRows.map((row) => row.original)
      onDelete(selectedData)
    }
  }

  const handleStatusChange = () => {
    if (onStatusChange) {
      const selectedData = selectedRows.map((row) => row.original)
      onStatusChange(selectedData)
    }
  }

  const handleSTKChange = () => {
    if (onSTKChange) {
      const selectedData = selectedRows.map((row) => row.original)
      onSTKChange(selectedData)
    }
  }

  const handleExport = () => {
    if (onExport) {
      const selectedData = selectedRows.map((row) => row.original)
      onExport(selectedData)
    }
  }

  const handlePrint = () => {
    if (onPrint) {
      const selectedData = selectedRows.map((row) => row.original)
      onPrint(selectedData)
    }
  }

  const handleArchive = () => {
    if (onArchive) {
      const selectedData = selectedRows.map((row) => row.original)
      onArchive(selectedData)
    }
  }

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-fit z-50 px-4">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-white border border-gray-200 rounded-xl shadow-2xl p-3 flex items-center gap-4 mx-auto"
          >
            {/* Selection Indicator */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                  {selectedCount}
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900 text-sm leading-tight">
                  Vybrano vozidel
                </span>
                <span className="text-xs text-gray-500 leading-tight">
                  z {totalCount} celkem
                </span>
              </div>
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Delete Button */}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isLoading || !onDelete}
                className="h-9 px-4"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Smazat
              </Button>

              {/* Status Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleStatusChange}
                disabled={isLoading || !onStatusChange}
                className="h-9 px-4"
              >
                <Users className="h-4 w-4 mr-2" />
                Stav
              </Button>

              {/* STK Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSTKChange}
                disabled={isLoading || !onSTKChange}
                className="h-9 px-4"
              >
                <Calendar className="h-4 w-4 mr-2" />
                STK
              </Button>

              {/* More Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    className="h-9 px-4"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Dalsi
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {onExport && (
                    <DropdownMenuItem onClick={handleExport}>
                      Exportovat
                    </DropdownMenuItem>
                  )}
                  {onPrint && (
                    <DropdownMenuItem onClick={handlePrint}>
                      Tisknout
                    </DropdownMenuItem>
                  )}
                  {onArchive && (
                    <>
                      {onExport || onPrint ? <DropdownMenuSeparator /> : null}
                      <DropdownMenuItem onClick={handleArchive}>
                        Archivovat
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              disabled={isLoading}
              className="h-9 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <X className="h-4 w-4 mr-2" />
              Zrusit vyber
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

