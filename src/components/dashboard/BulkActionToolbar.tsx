"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trash2, 
  Edit3, 
  Download, 
  Printer, 
  Archive, 
  Calendar, 
  Users, 
  X,
  Check,
  AlertTriangle,
  Loader2,
  ChevronDown,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
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
      {/* Enhanced Floating Bulk Action Toolbar */}
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.3 
          }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 min-w-[500px] max-w-[800px]">
            {/* Enhanced Selection Info */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Badge 
                  variant="default" 
                  className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full shadow-lg"
                >
                  {selectedCount}
                </Badge>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  Vybrano vozidel
                </span>
                <span className="text-xs text-gray-500">
                  z {totalCount} celkem
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent" />

            {/* Primary Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Delete - Primary Destructive Action */}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isLoading || isActionLoading}
                className="bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                aria-label="Smazat vybrana vozidla"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Smazat
              </Button>

              {/* State Change */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStateDialog(true)}
                disabled={isLoading || isActionLoading}
                className="border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200"
                aria-label="Zmenit stav vybranych vozidel"
              >
                <Users className="h-4 w-4 mr-2" />
                Stav
              </Button>

              {/* STK Change */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSTKDialog(true)}
                disabled={isLoading || isActionLoading}
                className="border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                aria-label="Zmenit datum STK vybranych vozidel"
              >
                <Calendar className="h-4 w-4 mr-2" />
                STK
              </Button>
            </div>

            {/* Secondary Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading || isActionLoading}
                  className="border-gray-300 hover:border-gray-400 transition-all duration-200"
                  aria-label="Dalsi akce pro vybrana vozidla"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Dalsi
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={onBulkExport}
                  disabled={isLoading || isActionLoading}
                  className="cursor-pointer hover:bg-green-50"
                >
                  <Download className="h-4 w-4 mr-3 text-green-600" />
                  <div>
                    <div className="font-medium">Exportovat</div>
                    <div className="text-xs text-gray-500">Stahnout jako CSV</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onBulkPrint}
                  disabled={isLoading || isActionLoading}
                  className="cursor-pointer hover:bg-blue-50"
                >
                  <Printer className="h-4 w-4 mr-3 text-blue-600" />
                  <div>
                    <div className="font-medium">Vytisknout</div>
                    <div className="text-xs text-gray-500">Vytvorit tiskovy prehled</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowArchiveDialog(true)}
                  disabled={isLoading || isActionLoading}
                  className="cursor-pointer hover:bg-orange-50 text-orange-600 focus:text-orange-600"
                >
                  <Archive className="h-4 w-4 mr-3" />
                  <div>
                    <div className="font-medium">Archivovat</div>
                    <div className="text-xs text-gray-500">Presunout do archivu</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Selection Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelectionAction}
              disabled={isLoading || isActionLoading}
              className="ml-auto text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
              aria-label="Zrusit vyber vsech vozidel"
            >
              <X className="h-4 w-4 mr-2" />
              Zrusit vyber
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Enhanced Delete Confirmation Dialog */}
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

      {/* Enhanced State Change Dialog */}
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

      {/* Enhanced STK Change Dialog */}
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
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-12",
                    !newSTKDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {newSTKDate ? (
                    format(newSTKDate, "d. MMMM yyyy", { locale: cs })
                  ) : (
                    <span>Vyberte datum STK</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={newSTKDate || undefined}
                  onSelect={(date) => {
                    setNewSTKDate(date || null);
                    if (date) setOpen(false);
                  }}
                  initialFocus
                  required={false}
                  locale={cs}
                  className="rounded-md border-0 shadow-lg"
                />
              </PopoverContent>
            </Popover>
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

      {/* Enhanced Archive Confirmation Dialog */}
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