"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trash2, 
  Calendar, 
  Users, 
  X,
  ChevronDown,
  Settings,
  Download,
  Printer,
  Archive,
  AlertTriangle,
  Loader2,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePickerWithPresets } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format } from 'date-fns'
import { cs } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'

interface BulkActionToolbarProps {
  selectedCount: number
  totalCount: number
  onClearSelectionAction: () => void
  onBulkDelete: () => Promise<void>
  onBulkStateChange: (newState: string) => Promise<void>
  onBulkSTKChange: (newDate: Date | null) => Promise<void>
  onBulkExport: () => void
  onBulkPrint: () => void
  onBulkArchive: () => Promise<void>
  isLoading?: boolean
}

export function BulkActionToolbar({
  selectedCount,
  totalCount,
  onClearSelectionAction,
  onBulkDelete,
  onBulkStateChange,
  onBulkSTKChange,
  onBulkExport,
  onBulkPrint,
  onBulkArchive,
  isLoading = false,
}: BulkActionToolbarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showStateDialog, setShowStateDialog] = useState(false)
  const [showSTKDialog, setShowSTKDialog] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [newState, setNewState] = useState('Aktivni')
  const [newSTKDate, setNewSTKDate] = useState<Date | null>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleBulkAction = async (action: () => Promise<void>) => {
    setIsActionLoading(true)
    try {
      await action()
      toast({
        title: "Akce uspesna",
        description: "Hromadna akce byla uspesne dokoncena",
      })
    } catch (error) {
      console.error('Bulk action error:', error)
      toast({
        title: "Chyba",
        description: error instanceof Error ? error.message : "Nepodarilo se dokoncit hromadnou akci",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDelete = async () => {
    await handleBulkAction(onBulkDelete)
    setShowDeleteDialog(false)
  }

  const handleStateChange = async () => {
    await handleBulkAction(() => onBulkStateChange(newState))
    setShowStateDialog(false)
  }

  const handleSTKChange = async () => {
    await handleBulkAction(() => onBulkSTKChange(newSTKDate))
    setShowSTKDialog(false)
  }

  const handleArchive = async () => {
    await handleBulkAction(onBulkArchive)
    setShowArchiveDialog(false)
  }

  if (selectedCount === 0) return null

  return (
    <>
      {/* New Floating Action Bar */}
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
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isLoading || isActionLoading}
                  className="h-9 px-4"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Smazat
                </Button>

                {/* Status Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStateDialog(true)}
                  disabled={isLoading || isActionLoading}
                  className="h-9 px-4"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Stav
                </Button>

                {/* STK Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSTKDialog(true)}
                  disabled={isLoading || isActionLoading}
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
                      disabled={isLoading || isActionLoading}
                      className="h-9 px-4"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Dalsi
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={onBulkExport}
                      disabled={isLoading || isActionLoading}
                    >
                      Exportovat
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={onBulkPrint}
                      disabled={isLoading || isActionLoading}
                    >
                      Tisknout
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowArchiveDialog(true)}
                      disabled={isLoading || isActionLoading}
                    >
                      Archivovat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelectionAction}
                disabled={isLoading || isActionLoading}
                className="h-9 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <X className="h-4 w-4 mr-2" />
                Zrusit vyber
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-5 w-5" />
              </div>
              Potvrdit smazani
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Opravdu chcete smazat <strong>{selectedCount} vybranych vozidel</strong>? 
              Tato akce je nevratna a nelze ji zrusit.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isActionLoading}
              className="flex-1"
            >
              Zrusit
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isActionLoading}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Mazu...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Smazat
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* State Change Dialog */}
      <Dialog open={showStateDialog} onOpenChange={setShowStateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              Zmenit stav vozidel
            </DialogTitle>
            <DialogDescription>
              Vyberte novy stav pro <strong>{selectedCount} vybranych vozidel</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newState} onValueChange={setNewState}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Vyberte stav" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Aktivni">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Aktivni
                  </div>
                </SelectItem>
                <SelectItem value="Neaktivni">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    Neaktivni
                  </div>
                </SelectItem>
                <SelectItem value="V servisu">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    V servisu
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowStateDialog(false)}
              disabled={isActionLoading}
              className="flex-1"
            >
              Zrusit
            </Button>
            <Button
              onClick={handleStateChange}
              disabled={isActionLoading}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ukladam...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Ulozit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* STK Change Dialog */}
      <Dialog open={showSTKDialog} onOpenChange={setShowSTKDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              Zmenit datum STK
            </DialogTitle>
            <DialogDescription>
              Vyberte nove datum STK pro <strong>{selectedCount} vybranych vozidel</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <DatePickerWithPresets
              date={newSTKDate || undefined}
              setDate={(date) => {
                setNewSTKDate(date || null);
                if (date) setOpen(false);
              }}
              placeholder="Vyberte datum STK"
              fromYear={2020}
              toYear={new Date().getFullYear() + 10}
            />
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowSTKDialog(false)}
              disabled={isActionLoading}
              className="flex-1"
            >
              Zrusit
            </Button>
            <Button
              onClick={handleSTKChange}
              disabled={isActionLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ukladam...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Ulozit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-orange-600">
              <div className="p-2 bg-orange-100 rounded-full">
                <Archive className="h-5 w-5" />
              </div>
              Potvrdit archivaci
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Opravdu chcete archivovat <strong>{selectedCount} vybranych vozidel</strong>? 
              Vozidla budou presunuta do archivu.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowArchiveDialog(false)}
              disabled={isActionLoading}
              className="flex-1"
            >
              Zrusit
            </Button>
            <Button
              variant="outline"
              onClick={handleArchive}
              disabled={isActionLoading}
              className="flex-1 text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Archivuji...
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Archivovat
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
