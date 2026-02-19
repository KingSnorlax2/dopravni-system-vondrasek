'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { AutoForm } from "@/components/forms/AutoForm"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Pencil, ImageIcon, CalendarIcon, MoreHorizontal, Eye, Trash2, AlertTriangle, AlertCircle, Check, Edit3, CircleDot, Search, Filter, X, ChevronDown } from "lucide-react"
import { AutoDetailForm, type AutoDetailValues } from "@/components/forms/Autochangeform"
import { BulkActionToolbar } from "@/components/dashboard/BulkActionToolbar"
import Image from 'next/image'
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableCell, TableRow, TableHead } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { loadSettings, saveSettings } from '@/utils/settings'
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { format } from "date-fns"
import { cs } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { DatePickerWithPresets } from '@/components/ui/calendar';

interface Auto {
  id: string;
  spz: string;
  znacka: string;
  model: string;
  rokVyroby: number;
  najezd: number;
  stav: 'Aktivní' | 'Neaktivní' | 'V servisu';
  datumSTK?: string | null;
  thumbnailUrl?: string;
  thumbnailFotoId?: string;
  poznamka?: string;
  fotky?: {
    id: string;
    data: string;
    mimeType: string;
    autoId?: number | null;
    positionX?: number | null;
    positionY?: number | null;
    scale?: number | null;
  }[];
}

interface AutoTableProps {
  auta: Auto[]
  onRefresh: () => void | Promise<void>
}

const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " km"
}

const getStatusColor = (stav: string): string => {
  switch (stav) {
    case 'Aktivní':
      return 'bg-green-100 text-green-800'
    case 'Neaktivní':
      return 'bg-gray-100 text-gray-800'
    case 'V servisu':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-black'
  }
}

type SortField = 'spz' | 'znacka' | 'model' | 'rokVyroby' | 'najezd' | 'stav' | 'datumSTK' | 'poznamka'
type SortOrder = 'asc' | 'desc'

const ITEMS_PER_PAGE = 10

const exportToCSV = (auta: Auto[]) => {
  const headers = ['SPZ', 'Značka', 'Model', 'Rok výroby', 'Nájezd (km)', 'Stav', 'STK']
  
  const rows = auta.map(auto => [
    auto.spz,
    auto.znacka,
    auto.model,
    auto.rokVyroby.toString(),
    auto.najezd.toString(),
    auto.stav,
    auto.datumSTK ? new Date(auto.datumSTK).toLocaleDateString('cs-CZ') : 'Není zadáno'
  ])

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  const date = new Date().toISOString().split('T')[0]
  link.setAttribute('href', url)
  link.setAttribute('download', `auta-export-${date}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const MAX_POZNAMKA_LENGTH = 300;

type STKStatus = 'expired' | 'upcoming' | 'normal' | 'missing';

function getSTKStatus(datumSTK: string | null | undefined): STKStatus {
  if (!datumSTK) return 'missing';
  
  const stk = new Date(datumSTK);
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
  
  // Reset time to compare only dates
  const stkDate = new Date(stk.getFullYear(), stk.getMonth(), stk.getDate());
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const thirtyDaysDate = new Date(thirtyDaysFromNow.getFullYear(), thirtyDaysFromNow.getMonth(), thirtyDaysFromNow.getDate());
  
  if (stkDate < todayDate) {
    return 'expired';
  } else if (stkDate <= thirtyDaysDate) {
    return 'upcoming';
  } else {
    return 'normal';
  }
}

function isSTKExpiring(datumSTK: string | undefined) {
  if (!datumSTK) return false
  const stk = new Date(datumSTK)
  const today = new Date()
  const oneMonthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
  return stk <= oneMonthFromNow
}

// Validation schema for inline editing
const inlineEditSchema = z.object({
  najezd: z.coerce.number()
    .int("Nájezd musí být celé číslo")
    .min(0, "Nájezd nemůže být záporný")
    .max(999999, "Nájezd je příliš vysoký (max. 999 999 km)"),
  datumSTK: z.string().optional().nullable(),
})

type InlineEditValues = z.infer<typeof inlineEditSchema>

// Inline editing components
const InlineMileageEditor = ({ 
  auto, 
  onSave, 
  onCancel 
}: { 
  auto: Auto; 
  onSave: (value: number) => Promise<void>; 
  onCancel: () => void; 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  const [localValue, setLocalValue] = useState(auto.najezd);
  
  const form = useForm<{ najezd: number }>({
    resolver: zodResolver(z.object({ 
      najezd: z.coerce.number()
        .int("Nájezd musí být celé číslo")
        .min(0, "Nájezd nemůže být záporný")
        .max(999999, "Nájezd je příliš vysoký (max. 999 999 km)")
    })),
    defaultValues: { najezd: auto.najezd },
    mode: "onChange"
  });

  // Reset form when auto changes to ensure proper isolation
  useEffect(() => {
    form.reset({ najezd: auto.najezd });
    setLocalValue(auto.najezd);
    setHasChanged(false);
  }, [auto.id, auto.najezd, form]);

  const onSubmit = async (data: { najezd: number }) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSave(data.najezd);
    } catch (error) {
      console.error('Error saving mileage:', error);
      // Revert local value on error
      setLocalValue(auto.najezd);
      form.reset({ najezd: auto.najezd });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlur = () => {
    // Only save on blur if the form is valid and has changed
    if (form.formState.isValid && hasChanged) {
      form.handleSubmit(onSubmit)();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Revert to original value on cancel
      setLocalValue(auto.najezd);
      form.reset({ najezd: auto.najezd });
      setHasChanged(false);
      onCancel();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (form.formState.isValid) {
        form.handleSubmit(onSubmit)();
      }
    }
  };

  // Use useEffect to handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const formElement = document.querySelector(`[data-mileage-editor="${auto.id}"]`);
      if (formElement && !formElement.contains(target)) {
        // Revert to original value on outside click
        setLocalValue(auto.najezd);
        form.reset({ najezd: auto.najezd });
        setHasChanged(false);
        onCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCancel, auto.id, auto.najezd, form]);

  return (
    <div data-mileage-editor={auto.id} className="flex items-center gap-2">
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
        <Controller
          name="najezd"
          control={form.control}
          render={({ field, fieldState }) => (
            <div className="relative">
              <Input
                {...field}
                type="number"
                min="0"
                max="999999"
                step="100"
                className={cn(
                  "w-28 h-8 text-sm transition-all duration-200",
                  "focus:ring-2 focus:ring-purple-500 focus:border-purple-500",
                  fieldState.error && "border-red-500 focus:ring-red-500 focus:border-red-500"
                )}
                autoFocus
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : Number(e.target.value);
                  field.onChange(value);
                  setLocalValue(value);
                  setHasChanged(true);
                }}
                disabled={isSubmitting}
                aria-label="Nájezd vozidla v kilometrech"
                placeholder="0"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                km
              </div>
              {fieldState.error && (
                <div className="absolute -bottom-6 left-0 text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200 z-10 shadow-sm">
                  {fieldState.error.message}
                </div>
              )}
            </div>
          )}
        />
        <div className="flex gap-1">
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 hover:bg-green-50 transition-colors"
            disabled={isSubmitting || !form.formState.isValid || !hasChanged}
            aria-label="Uložit nájezd"
          >
            {isSubmitting ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
            ) : (
              <Check className="h-3 w-3 text-green-600" />
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 hover:bg-red-50 transition-colors"
            onClick={() => {
              setLocalValue(auto.najezd);
              form.reset({ najezd: auto.najezd });
              setHasChanged(false);
              onCancel();
            }}
            disabled={isSubmitting}
            aria-label="Zrušit úpravu"
          >
            <X className="h-3 w-3 text-red-600" />
          </Button>
        </div>
      </form>
    </div>
  );
};

const InlineSTKEditor = ({ 
  auto, 
  onSave, 
  onCancel 
}: { 
  auto: Auto; 
  onSave: (value: string | null) => Promise<void>; 
  onCancel: () => void; 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [localDate, setLocalDate] = useState<Date | null>(
    auto.datumSTK ? new Date(auto.datumSTK) : null
  );
  
  // Use form for STK date management to ensure proper isolation
  const form = useForm<{ datumSTK?: Date | null }>({
    resolver: zodResolver(z.object({
      datumSTK: z.date().optional().nullable()
    })),
    defaultValues: { 
      datumSTK: auto.datumSTK ? new Date(auto.datumSTK) : null 
    },
    mode: "onChange"
  });

  // Reset form when auto changes to ensure proper isolation
  // But don't reset if we're currently submitting (saving)
  useEffect(() => {
    if (isSubmitting) return; // Don't reset during save operation
    
    const newDate = auto.datumSTK ? new Date(auto.datumSTK) : null;
    const currentFormDate = form.getValues("datumSTK");
    
    // Only reset if the date actually changed (to avoid unnecessary resets)
    const formDateStr = currentFormDate ? currentFormDate.toISOString() : null;
    const autoDateStr = auto.datumSTK || null;
    
    if (formDateStr !== autoDateStr) {
      form.reset({ datumSTK: newDate });
      setLocalDate(newDate);
      setHasChanged(false);
    }
  }, [auto.id, auto.datumSTK, form, isSubmitting]);

  // Get today's date for minimum validation
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const currentDate = form.getValues("datumSTK");
      const dateValue = currentDate ? currentDate.toISOString() : null;
      await onSave(dateValue);
      // Close editor after successful save
      setHasChanged(false);
    } catch (error) {
      console.error('Error saving STK date:', error);
      // Revert local value on error
      const originalDate = auto.datumSTK ? new Date(auto.datumSTK) : null;
      setLocalDate(originalDate);
      form.reset({ datumSTK: originalDate });
      setHasChanged(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isOpen) {
        setIsOpen(false);
      } else {
        // Revert to original value on cancel
        const originalDate = auto.datumSTK ? new Date(auto.datumSTK) : null;
        setLocalDate(originalDate);
        form.reset({ datumSTK: originalDate });
        setHasChanged(false);
        onCancel();
      }
    }
    if (e.key === 'Enter' && !isOpen) {
      handleSave();
    }
  };

  const handleDateSelect = async (date: Date | undefined) => {
    if (isSubmitting) {
      console.log('Already submitting, ignoring date select');
      return; // Prevent multiple simultaneous saves
    }
    
    const newDate = date || null;
    console.log('handleDateSelect called with date:', newDate, 'for auto:', auto.id);
    setIsSubmitting(true);
    
    try {
      // Update form state immediately for visual feedback
      form.setValue("datumSTK", newDate, { shouldDirty: true, shouldValidate: true });
      setLocalDate(newDate);
      setHasChanged(true);
      
      // Convert to ISO string for API
      const dateValue = newDate ? newDate.toISOString() : null;
      console.log('Saving date value:', dateValue, 'for auto:', auto.id);
      
      // Save to server
      await onSave(dateValue);
      console.log('Date saved successfully for auto:', auto.id);
      
      // Success - close popover and reset flags
      setHasChanged(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving STK date:', error);
      // Revert to original value on error
      const originalDate = auto.datumSTK ? new Date(auto.datumSTK) : null;
      setLocalDate(originalDate);
      form.reset({ datumSTK: originalDate });
      setHasChanged(false);
      // Show error to user
      alert('Chyba při ukládání data STK. Zkuste to znovu.');
      // Keep popover open on error so user can try again
    } finally {
      setIsSubmitting(false);
    }
  };

  // Use useEffect to handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const formElement = document.querySelector(`[data-stk-editor="${auto.id}"]`);
      if (formElement && !formElement.contains(target) && !isOpen) {
        // Revert to original value on outside click
        const originalDate = auto.datumSTK ? new Date(auto.datumSTK) : null;
        setLocalDate(originalDate);
        form.reset({ datumSTK: originalDate });
        setHasChanged(false);
        onCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCancel, isOpen, auto.id, auto.datumSTK, form]);

  const selectedDate = form.watch("datumSTK");

  return (
    <div data-stk-editor={auto.id} className="flex items-center gap-2 min-w-0 relative z-10 isolate">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 min-w-[140px] max-w-[160px] justify-start text-left font-normal transition-all duration-200",
              "focus:ring-2 focus:ring-purple-500 focus:border-purple-500",
              "hover:bg-gray-50 overflow-hidden relative z-10 pointer-events-auto"
            )}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
            aria-label="Vybrat datum STK"
            type="button"
          >
            <span className="truncate flex-1 text-left">
              {selectedDate ? (
                format(selectedDate, "d.M.yyyy", { locale: cs })
              ) : (
                <span className="text-muted-foreground">Vyberte datum</span>
              )}
            </span>
            <CalendarIcon className="ml-2 h-3 w-3 opacity-50 flex-shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 z-[9999]" 
          align="start" 
          side="bottom" 
          sideOffset={4} 
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            // Prevent closing when clicking inside the calendar
            const target = e.target as HTMLElement;
            const calendarBox = target.closest('.calendar-box');
            const dayButton = target.closest('[role="gridcell"]') || target.closest('button');
            
            // If clicking inside calendar, prevent popover from closing
            if (calendarBox || (dayButton && calendarBox?.contains(dayButton))) {
              e.preventDefault();
              return;
            }
          }}
          onEscapeKeyDown={(e) => {
            // Allow escape to close
            setIsOpen(false);
          }}
        >
          <div 
            onClick={(e) => {
              // Stop propagation to prevent any parent handlers
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              // Prevent mousedown from closing popover
              e.stopPropagation();
            }}
          >
            <DatePickerWithPresets
              date={selectedDate || undefined}
              setDate={handleDateSelect}
              fromYear={2020}
              toYear={new Date().getFullYear() + 10}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

const AutoTable = ({ auta, onRefresh }: AutoTableProps) => {
  const router = useRouter()
  const [editedAuto, setEditedAuto] = useState<Auto | null | undefined>(null)
  const [deleteModalData, setDeleteModalData] = useState<{ auto: Auto | null; isOpen: boolean } | null>(null);
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStav, setFilterStav] = useState<string>('vse')
  const [filterSTK, setFilterSTK] = useState<string>('vse')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [mileageFrom, setMileageFrom] = useState<string>('')
  const [mileageTo, setMileageTo] = useState<string>('')
  const [sortField, setSortField] = useState<SortField>('spz')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [editedNote, setEditedNote] = useState<{ id: string; note: string } | null>(null)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showPoznamky, setShowPoznamky] = useState(false)
  const [novaPoznamka, setNovaPoznamka] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedToArchive, setSelectedToArchive] = useState<Auto[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Auto | null>(null);

  const [showPictureUploadModal, setShowPictureUploadModal] = useState(false)
  const [selectedAuto, setSelectedAuto] = useState<Auto | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [showPicturesModal, setShowPicturesModal] = useState(false)
  const [currentPictures, setCurrentPictures] = useState<{ id: string }[]>([])

  const [isEditOpen, setIsEditOpen] = useState(false)

  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);

  // Add a state to track thumbnail updates
  const [thumbnailVersion, setThumbnailVersion] = useState(0);

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'najezd' | 'datumSTK' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // STK warning filter state
  const [showSTKWarningFilter, setShowSTKWarningFilter] = useState(false);

  // Load saved settings on component mount
  const savedSettings = useMemo(() => loadSettings(), []);
  
  // Update existing state with saved settings (not creating new ones)
  useEffect(() => {
    setItemsPerPage(savedSettings.itemsPerPage || 10);
    setSortField((savedSettings.sortField || 'spz') as SortField);
    setSortOrder((savedSettings.sortOrder || 'asc') as SortOrder);
    setFilterStav(savedSettings.filterStav || 'vse');
    setFilterSTK(savedSettings.filterSTK || 'vse');
    setDateFrom(savedSettings.dateFrom || '');
    setDateTo(savedSettings.dateTo || '');
    setMileageFrom(savedSettings.mileageFrom || '');
    setMileageTo(savedSettings.mileageTo || '');
  }, [savedSettings]);

  // Save settings when they change
  useEffect(() => {
    saveSettings({
      itemsPerPage,
      sortField,
      sortOrder,
      filterStav,
      filterSTK,
      dateFrom,
      dateTo,
      mileageFrom,
      mileageTo
    });
  }, [
    itemsPerPage,
    sortField,
    sortOrder,
    filterStav,
    filterSTK,
    dateFrom,
    dateTo,
    mileageFrom,
    mileageTo
  ]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [notification])

  // Define filteredAuta first
  const [selectedModels, setSelectedModels] = useState<string[]>([])

  // Generate unique model options only
  const modelOptions = useMemo(() => Array.from(new Set(auta.map(a => a.model))).sort(), [auta])

  // Count vehicles with expiring STK
  const expiringSTKCount = useMemo(() => {
    return auta.filter(auto => auto.datumSTK && getSTKStatus(auto.datumSTK) === 'upcoming').length;
  }, [auta]);

  const filteredAuta = useMemo(() => {
    return auta.filter(auto => {
      // Search term filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        auto.znacka.toLowerCase().includes(searchLower) ||
        auto.model.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = filterStav === 'vse' || auto.stav === filterStav;

      // Date range filter
      const matchesDate = (!dateFrom || !dateTo) || 
        (auto.datumSTK && new Date(auto.datumSTK) >= new Date(dateFrom) && 
         new Date(auto.datumSTK) <= new Date(dateTo));

      // Mileage range filter
      const matchesMileage = (!mileageFrom || !mileageTo) ||
        (auto.najezd >= Number(mileageFrom) && auto.najezd <= Number(mileageTo));

      // Model filter
      const matchesModel = selectedModels.length === 0 || selectedModels.includes(auto.model);

      // STK warning filter
      const matchesSTKWarning = !showSTKWarningFilter || 
        (auto.datumSTK && getSTKStatus(auto.datumSTK) === 'upcoming');

      return matchesSearch && matchesStatus && matchesDate && matchesMileage && matchesModel && matchesSTKWarning;
    }).sort((a, b) => {
      // Sorting logic
      const order = sortOrder === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'spz':
          return order * a.spz.localeCompare(b.spz);
        case 'znacka':
          return order * a.znacka.localeCompare(b.znacka);
        case 'model':
          return order * a.model.localeCompare(b.model);
        case 'rokVyroby':
          return order * (a.rokVyroby - b.rokVyroby);
        case 'najezd':
          return order * (a.najezd - b.najezd);
        case 'stav':
          return order * a.stav.localeCompare(b.stav);
        case 'datumSTK':
          if (!a.datumSTK && !b.datumSTK) return 0;
          if (!a.datumSTK) return order;
          if (!b.datumSTK) return -order;
          return order * (new Date(a.datumSTK).getTime() - new Date(b.datumSTK).getTime());
        case 'poznamka':
          const aNote = a.poznamka || '';
          const bNote = b.poznamka || '';
          return order * aNote.localeCompare(bNote);
        default:
          return 0;
      }
    });
  }, [auta, searchTerm, filterStav, dateFrom, dateTo, mileageFrom, mileageTo, sortField, sortOrder, selectedModels, showSTKWarningFilter]);

  useEffect(() => {
    // Reset filters if no cars are showing
    if (filteredAuta.length === 0 && auta.length > 0) {
      setFilterStav('vse');
      setFilterSTK('vse');
      setDateFrom('');
      setDateTo('');
      setSearchTerm('');
    }
  }, [auta, filteredAuta]);

  const handleDelete = async (auto: Auto) => {
    try {
      console.log('Deleting auto:', auto.id, typeof auto.id);
      
      const response = await fetch(`/api/auta/${auto.id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      console.log('Delete response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Chyba při vyřazení vozidla');
      }
      
      setNotification({ 
        type: 'success', 
        message: data.message || 'Vozidlo bylo úspěšně vyřazeno' 
      });
      setDeleteModalData(null);
      
      // Force a refresh of the data
      setTimeout(() => {
        onRefresh();
      }, 500);
    } catch (error) {
      console.error('Chyba při mazání:', error);
      setNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Chyba při vyřazení vozidla'
      });
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const paginatedAuta = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredAuta.slice(start, end);
  }, [filteredAuta, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredAuta.length / itemsPerPage);
  }, [filteredAuta.length, itemsPerPage]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = paginatedAuta.map(auto => auto.id.toString());
      setSelectedRows(new Set(allIds));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  // Improved checkbox state management
  const isAllSelected = paginatedAuta.length > 0 && paginatedAuta.every(auto => selectedRows.has(auto.id.toString()));
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < paginatedAuta.length;

  const handleBulkDelete = async () => {
    try {
      const deleteIds = Array.from(selectedRows);
      console.log('Attempting to delete cars:', deleteIds);

      const response = await fetch('/api/auta/bulk-update', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          ids: deleteIds 
        })
      });

      const data = await response.json();
      console.log('Delete response:', data);
      
      if (!response.ok) {
        console.error('Delete error response:', data);
        throw new Error(data.error || 'Chyba při vyřazení vozidel');
      }

      setShowBulkDeleteModal(false);
      setSelectedRows(new Set());
      onRefresh();
      setNotification({ 
        type: 'success', 
        message: `${data.count} vozidel bylo úspěšně vyřazeno` 
      });
    } catch (error) {
      console.error('Chyba při hromadném vyřazení:', error);
      setNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Chyba při vyřazení vozidel'
      });
    }
  };

  const handleBulkStateChange = async (newState: string) => {
    try {
      const response = await fetch('/api/auta/bulk-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selectedRows),
          stav: newState,
          datumSTK: 'N/A'  // Set STK date to 'N/A' when changing status
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Bulk state change error:', errorText);
        throw new Error(errorText || 'Chyba při změně stavu vozidel');
      }

      setSelectedRows(new Set());
      onRefresh();
      setNotification({ type: 'success', message: 'Stav vozidel byl úspěšně změněn' });
    } catch (error) {
      console.error('Bulk state change error:', error);
      setNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Chyba při změně stavu vozidel' 
      });
      throw error; // Re-throw to let the toolbar handle the error
    }
  };

  const handleBulkSTKChange = async (newDate: Date | null) => {
    try {
      const response = await fetch('/api/auta/bulk-update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: Array.from(selectedRows),
          datumSTK: newDate ? newDate.toISOString() : 'N/A',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Bulk STK update error:', errorText);
        throw new Error(errorText || 'Chyba při aktualizaci STK');
      }

      setSelectedRows(new Set());
      onRefresh();
      setNotification({
        message: 'Datum STK bylo úspěšně změněno',
        type: 'success'
      });
    } catch (error) {
      console.error('Chyba při hromadné aktualizaci STK:', error);
      setNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Chyba při aktualizaci STK'
      });
      throw error; // Re-throw to let the toolbar handle the error
    }
  };

  const handleBulkExport = () => {
    const selectedVehicles = auta.filter(auto => Array.from(selectedRows).includes(auto.id.toString()));
    exportToCSV(selectedVehicles);
  };

  const handlePrint = () => {
    const selectedVehicles = auta.filter(auto => selectedRows.has(auto.id.toString()));
    const printContent = selectedVehicles.map(auto => ({
      SPZ: auto.spz,
      Značka: auto.znacka,
      Model: auto.model,
      "Rok výroby": auto.rokVyroby,
      "Nájezd": `${formatNumber(auto.najezd)} km`,
      Stav: auto.stav,
      Poznámka: auto.poznamka || '-'
    }));

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Seznam vozidel</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8f9fa; }
            .header { margin-bottom: 20px; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Seznam vozidel</h1>
            <p>Datum tisku: ${new Date().toLocaleString('cs-CZ')}</p>
          </div>
          <table>
            <thead>
              <tr>
                ${Object.keys(printContent[0]).map(key => `<th>${key}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${printContent.map(vehicle => `
                <tr>
                  ${Object.values(vehicle).map(value => `<td>${value}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <button class="no-print" onclick="window.print()">Vytisknout</button>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleSaveNote = async () => {
    if (!editedNote) return;
    
    try {
      const response = await fetch(`/api/auta/${editedNote.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ poznamka: editedNote.note })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Chyba při ukládání poznámky');
      }

      setShowNoteModal(false);
      setEditedNote(null);
      onRefresh();
      setNotification({
        message: 'Poznámka byla uložena',
        type: 'success'
      });
    } catch (error) {
      console.error('Chyba:', error);
      setNotification({
        message: 'Chyba při ukládání poznámky',
        type: 'error'
      });
    }
  };

  const handleArchive = async () => {
    if (selectedRows.size === 0) {
      toast({
        title: "Chyba",
        description: "Nebyla vybrána žádná vozidla k archivaci",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the selected vehicle IDs
      const selectedIds = Array.from(selectedRows);
      
      // Optimistic update - remove selected vehicles from the local state
      const originalAuta = [...auta];
      const updatedAuta = auta.filter(auto => !selectedIds.includes(auto.id.toString()));
      
      // Store original state for rollback in case of error
      const originalSelectedRows = new Set(selectedRows);
      
      // Optimistically clear selection
      setSelectedRows(new Set());
      
      const response = await fetch('/api/auta/bulk-archivovat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedIds })
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Rollback optimistic update on error
        setSelectedRows(originalSelectedRows);
        throw new Error(data.error || 'Chyba při archivaci vozidel');
      }

      // Success - refresh data to get updated state from server
      onRefresh();
      
      toast({
        title: "Archivace úspěšná",
        description: `${selectedIds.length} vozidel bylo úspěšně archivováno`,
      });
    } catch (error) {
      console.error('Chyba při archivaci vozidel:', error);
      toast({
        title: "Chyba při archivaci",
        description: error instanceof Error ? error.message : 'Nepodařilo se archivovat vybraná vozidla',
        variant: "destructive",
      });
      throw error; // Re-throw to let the toolbar handle the error
    }
  }

  const handleCarDetail = (autoId: string) => {
    router.push(`/dashboard/auta/${autoId}`)
  }

  const handleUpdateSTK = async () => {
    if (!editedAuto) return;

    try {
      // Ensure the datumSTK is properly formatted if it exists
      const datumSTKFormatted = editedAuto.datumSTK ? 
        new Date(editedAuto.datumSTK).toISOString() : null;
      
      const response = await fetch(`/api/auta/${editedAuto.id}?_t=${Date.now()}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spz: editedAuto.spz,
          znacka: editedAuto.znacka,
          model: editedAuto.model,
          rokVyroby: editedAuto.rokVyroby,
          najezd: editedAuto.najezd,
          stav: editedAuto.stav,
          datumSTK: datumSTKFormatted,  
          poznamka: editedAuto.poznamka
        }),
        cache: 'no-store'
      });

      if (!response.ok) {
        const responseData = await response.json();
        
        // Handle specific error cases
        if (response.status === 409 && responseData.error === 'SPZ již existuje') {
          toast({
            title: "Chyba při aktualizaci",
            description: responseData.message || "SPZ je již použita u jiného vozidla.",
            variant: "destructive"
          });
          return; // Don't close the modal so the user can fix the SPZ
        }
        
        throw new Error(responseData.error || 'Failed to update vehicle');
      }

      onRefresh();
      handleCloseEditModal();
      
      toast({
        title: "Vozidlo aktualizováno",
        description: "Údaje o vozidle byly úspěšně aktualizovány"
      });
    } catch (error) {
      console.error('Error updating vehicle:', error);
      toast({
        title: "Chyba při aktualizaci",
        description: error instanceof Error ? error.message : "Nepodařilo se aktualizovat vozidlo",
        variant: "destructive"
      });
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedVehicle(null);
  };

  // Defensive: debounce handleEdit to prevent race conditions
  const handleEdit = useCallback((auto: Auto) => {
    setSelectedVehicle({ ...JSON.parse(JSON.stringify(auto)), id: String(auto.id), datumSTK: auto.datumSTK ? new Date(auto.datumSTK).toISOString().split('T')[0] : undefined });
    setIsEditModalOpen(true);
  }, []);

  const handleEditSubmit = async (data: AutoDetailValues) => {
    if (!selectedVehicle) return;
    
    try {
      console.log('Original form data:', data);
      console.log('Current editing auto:', selectedVehicle);
      
      // Format the data for the API with proper type handling
      const formattedData = {
        ...data,
        id: selectedVehicle.id,
        // Convert string values to numbers where needed
        rokVyroby: typeof data.rokVyroby === 'string' ? parseInt(data.rokVyroby) : data.rokVyroby,
        najezd: typeof data.najezd === 'string' ? parseInt(data.najezd) : data.najezd,
        // Ensure datumSTK is properly formatted
        datumSTK: data.datumSTK ? new Date(data.datumSTK).toISOString() : null,
      };
      
      console.log('Submitting updated vehicle data:', formattedData);
      console.log('API endpoint:', `/api/auta/${selectedVehicle.id}`);
      
      const response = await fetch(`/api/auta/${selectedVehicle.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedData),
        cache: 'no-store'
      });

      const responseData = await response.json();
      console.log('API response:', responseData);

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 409 && responseData.error === 'SPZ již existuje') {
          toast({
            title: "Chyba při aktualizaci",
            description: responseData.message || "SPZ je již použita u jiného vozidla.",
            variant: "destructive"
          });
          return; // Exit early, don't close the form
        }
        
        throw new Error(responseData.error || 'Failed to update vehicle');
      }

      // Show success message
      toast({
        title: "Vozidlo aktualizováno",
        description: "Údaje o vozidle byly úspěšně aktualizovány",
      });

      // Reset state and close the form
      setIsEditModalOpen(false);
      setSelectedVehicle(null);
      
      // Refresh data
      onRefresh();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      toast({
        title: "Chyba při aktualizaci",
        description: error instanceof Error ? error.message : "Nepodařilo se aktualizovat vozidlo",
        variant: "destructive"
      });
    }
  };

  const handleSingleCarDelete = async () => {
    if (!deleteModalData || !deleteModalData.auto) return;

    try {
      const response = await fetch('/api/auta/bulk-archivovat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          ids: [deleteModalData.auto.id] 
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Chyba při archivaci vozidla');
      }

      setDeleteModalData({ auto: null, isOpen: false });
      onRefresh();
      setNotification({ 
        type: 'success', 
        message: 'Vozidlo bylo úspěšně archivováno' 
      });
    } catch (error) {
      console.error('Chyba při archivaci vozidla:', error);
      setNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Chyba při archivaci vozidla'
      });
    }
  };

  const handlePictureUpload = async () => {
    if (!selectedAuto || !selectedFile) return;

    try {
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(selectedFile.type)) {
        setUploadError('Podporované formáty jsou JPEG, PNG a GIF');
        return;
      }

      if (selectedFile.size > maxSize) {
        setUploadError('Maximální velikost souboru je 10 MB');
        return;
      }

      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        
        const response = await fetch(`/api/auta/${selectedAuto.id}/upload-foto`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: base64Data.split(',')[1], // Remove data URL prefix
            mimeType: selectedFile.type
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Nepodařilo se nahrát fotografii');
        }

        // Refresh the list
        onRefresh();

        // Reset state
        setShowPictureUploadModal(false);
        setSelectedFile(null);
        setUploadError(null);
        setNotification({
          type: 'success',
          message: 'Fotografie byla úspěšně nahrána'
        });
      };
    } catch (error) {
      console.error('Chyba při nahrávání fotografie:', error);
      setUploadError(error instanceof Error ? error.message : 'Chyba při nahrávání fotografie');
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
    }
  }

  const openPictureUploadModal = (auto: Auto) => {
    setSelectedAuto(auto);
    setShowPictureUploadModal(true);
  }

  const openPicturesModal = async (auto: Auto) => {
    try {
      // Fetch pictures for the auto
      const response = await fetch(`/api/auta/${auto.id}`)
      const autoDetails = await response.json()
      
      setCurrentPictures(autoDetails.fotky || [])
      setShowPicturesModal(true)
    } catch (error) {
      console.error('Chyba při načítání fotografií:', error)
      setNotification({
        type: 'error',
        message: 'Nepodařilo se načíst fotografie'
      })
    }
  }

  const handleDeletePicture = async (fotoId: string) => {
    try {
      const response = await fetch(`/api/auta/${selectedAuto?.id}/upload-foto?fotoId=${fotoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Nepodařilo se smazat fotografii');
      }

      // Remove the picture from the list
      setCurrentPictures(prev => prev.filter(foto => foto.id !== fotoId));
      
      setNotification({
        type: 'success',
        message: 'Fotografie byla úspěšně smazána'
      });
    } catch (error) {
      console.error('Chyba při mazání fotografie:', error);
      setNotification({
        type: 'error',
        message: 'Nepodařilo se smazat fotografii'
      });
    }
  }

  const handleRefreshThumbnails = () => {
    // Force refresh of thumbnails
    setThumbnailVersion(prev => prev + 1);
    // Also trigger parent refresh to get updated data from the server
    onRefresh();
  };

  // Update the getThumbnailUrl function to use the version
  const getThumbnailUrl = (auto: Auto) => {
    // Add the version to force cache busting
    const cacheBuster = `${thumbnailVersion}_${new Date().getTime()}`;
    
    if (auto.thumbnailUrl) {
      return `${auto.thumbnailUrl}?v=${cacheBuster}`;
    }
    
    if (auto.thumbnailFotoId && auto.id) {
      return `/api/auta/${auto.id}/fotky/${auto.thumbnailFotoId}?v=${cacheBuster}`;
    }
    
    return null;
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
  };
  
  const handleSortChange = (field: string) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field as SortField);
      setSortOrder('asc');
    }
  };

  // Inline editing handlers
  const handleInlineSave = async (autoId: string, field: 'najezd' | 'datumSTK', value: number | string | null) => {
    console.log('handleInlineSave called:', { autoId, field, value });
    setIsSaving(true);
    try {
      // Find the current auto to preserve all existing data
      const currentAuto = auta.find(a => a.id === autoId);
      if (!currentAuto) {
        throw new Error('Vehicle not found');
      }

      // Create update payload with all existing data plus the updated field
      const updatePayload = {
        spz: currentAuto.spz,
        znacka: currentAuto.znacka,
        model: currentAuto.model,
        rokVyroby: currentAuto.rokVyroby,
        najezd: currentAuto.najezd,
        stav: currentAuto.stav,
        datumSTK: currentAuto.datumSTK,
        poznamka: currentAuto.poznamka,
        // Override only the specific field being updated
        [field]: value
      };

      console.log('Sending PATCH request to /api/auta/' + autoId, updatePayload);

      const response = await fetch(`/api/auta/${autoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to update vehicle: ${response.status} ${errorText}`);
      }

      const updatedData = await response.json();
      console.log('Vehicle updated successfully:', updatedData);

      // Refresh data from server first to ensure consistency
      if (typeof onRefresh === 'function') {
        try {
          console.log('Calling onRefresh...');
          const refreshResult = onRefresh();
          if (refreshResult instanceof Promise) {
            await refreshResult;
            console.log('onRefresh completed');
          }
        } catch (error) {
          console.error('Error refreshing data:', error);
        }
      }
      
      // Close editor after refresh completes
      setEditingCell(null);
      
      toast({
        title: "Úspěšně aktualizováno",
        description: `${field === 'najezd' ? 'Nájezd' : 'Datum STK'} bylo úspěšně změněno`,
      });
    } catch (error) {
      console.error('Error updating vehicle:', error);
      toast({
        title: "Chyba při aktualizaci",
        description: "Nepodařilo se aktualizovat vozidlo",
        variant: "destructive",
      });
      // Re-throw error so InlineSTKEditor can handle it
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleInlineCancel = () => {
    setEditingCell(null);
  };
  <AutoDetailForm
    open={isEditModalOpen}
    onOpenChangeAction={(open: boolean) => {
      if (!open) handleCloseEditModal();
    }}
    initialData={selectedVehicle as unknown as AutoDetailValues & { id: string }}
    onSubmit={handleEditSubmit}
  />

  return (
    <div className="w-full h-full p-2">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Existing table code */}
        
        {/* STK Edit Modal */}
        {isEditModalOpen && editedAuto && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-96">
              <h2 className="text-xl font-bold mb-4">Upravit vozidlo</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between">
                    <label className="block text-sm font-medium text-gray-700">SPZ</label>
                    <span className="text-xs text-gray-500">
                      {editedAuto.spz.length}/8 znaků
                    </span>
                  </div>
                  <input 
                    type="text" 
                    maxLength={8}
                    value={editedAuto.spz}
                    onChange={(e) => setEditedAuto(prev => prev ? {...prev, spz: e.target.value} : null)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <div className="flex justify-between">
                    <label className="block text-sm font-medium text-gray-700">Značka</label>
                    <span className="text-xs text-gray-500">
                      {editedAuto.znacka.length}/50 znaků
                    </span>
                  </div>
                  <input 
                    type="text" 
                    maxLength={50}
                    value={editedAuto.znacka}
                    onChange={(e) => setEditedAuto(prev => prev ? {...prev, znacka: e.target.value} : null)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <div className="flex justify-between">
                    <label className="block text-sm font-medium text-gray-700">Model</label>
                    <span className="text-xs text-gray-500">
                      {editedAuto.model.length}/50 znaků
                    </span>
                  </div>
                  <input 
                    type="text" 
                    maxLength={50}
                    value={editedAuto.model}
                    onChange={(e) => setEditedAuto(prev => prev ? {...prev, model: e.target.value} : null)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rok výroby</label>
                  <input 
                    type="number" 
                    value={editedAuto.rokVyroby}
                    onChange={(e) => setEditedAuto(prev => prev ? {...prev, rokVyroby: Number(e.target.value) || new Date().getFullYear()} : null)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Najezdy (km)</label>
                  <input 
                    type="number" 
                    value={editedAuto.najezd}
                    onChange={(e) => setEditedAuto(prev => prev ? {...prev, najezd: Number(e.target.value) || 0} : null)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stav</label>
                  <select 
                    value={editedAuto.stav}
                    onChange={(e) => setEditedAuto(prev => prev ? {...prev, stav: e.target.value as "Aktivní" | "Neaktivní" | "V servisu"} : null)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    <option value="Aktivní">Aktivní</option>
                    <option value="Neaktivní">Neaktivní</option>
                    <option value="V servisu">V servisu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Datum STK</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "flex w-full justify-between rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 shadow-sm",
                          !editedAuto.datumSTK && "text-muted-foreground"
                        )}
                      >
                        {editedAuto.datumSTK ? (
                          format(new Date(editedAuto.datumSTK), "d. MMMM yyyy", { locale: cs })
                        ) : (
                          <span>Vyberte datum STK</span>
                        )}
                        <CalendarIcon className="h-4 w-4 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <DatePickerWithPresets
                        date={editedAuto.datumSTK ? new Date(editedAuto.datumSTK) : undefined}
                        setDate={(date) => setEditedAuto(prev => prev ? {...prev, datumSTK: date ? date.toISOString() : undefined} : null)}
                        fromYear={2020}
                        toYear={new Date().getFullYear() + 10}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <div className="flex justify-between">
                    <label className="block text-sm font-medium text-gray-700">Poznámka</label>
                    <span className="text-xs text-gray-500">
                      {(editedAuto.poznamka || '').length}/300 znaků
                    </span>
                  </div>
                  <textarea 
                    value={editedAuto.poznamka || ''}
                    onChange={(e) => setEditedAuto(prev => prev ? {...prev, poznamka: e.target.value || undefined} : null)}
                    maxLength={300}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    placeholder="Zde můžete napsat poznámky k vozidlu..."
                  />
                </div>
                <div className="flex justify-between space-x-4">
                  <button 
                    onClick={handleCloseEditModal}
                    className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition-colors"
                  >
                    Zrušit
                  </button>
                  <button 
                    onClick={handleUpdateSTK}
                    className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors"
                  >
                    Aktualizovat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Filters Card */}
        <Card className="m-4">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtry a vyhledávání
              </CardTitle>
              {(searchTerm || filterStav !== 'vse' || dateFrom || dateTo || mileageFrom || mileageTo || selectedModels.length > 0 || showSTKWarningFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('')
                    setFilterStav('vse')
                    setDateFrom('')
                    setDateTo('')
                    setMileageFrom('')
                    setMileageTo('')
                    setSelectedModels([])
                    setShowSTKWarningFilter(false)
                  }}
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
                  placeholder="Hledat podle značky, modelu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            </div>

            {/* Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="filter-stav" className="text-sm font-medium">
                  Stav
                </Label>
                <Select value={filterStav} onValueChange={setFilterStav}>
                  <SelectTrigger id="filter-stav" className="h-10">
                    <SelectValue placeholder="Všechny stavy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vse">Všechny stavy</SelectItem>
                    <SelectItem value="Aktivní">Aktivní</SelectItem>
                    <SelectItem value="Neaktivní">Neaktivní</SelectItem>
                    <SelectItem value="V servisu">V servisu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <Label htmlFor="date-from" className="text-sm font-medium">
                  STK od
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
                  STK do
                </Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Mileage From */}
              <div className="space-y-2">
                <Label htmlFor="mileage-from" className="text-sm font-medium">
                  Nájezd od (km)
                </Label>
                <Input
                  id="mileage-from"
                  type="number"
                  placeholder="Od"
                  value={mileageFrom}
                  onChange={(e) => setMileageFrom(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            {/* Second Row of Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Mileage To */}
              <div className="space-y-2">
                <Label htmlFor="mileage-to" className="text-sm font-medium">
                  Nájezd do (km)
                </Label>
                <Input
                  id="mileage-to"
                  type="number"
                  placeholder="Do"
                  value={mileageTo}
                  onChange={(e) => setMileageTo(e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Model Filter - Compact Multi-Select */}
              <div className="space-y-2">
                <Label htmlFor="model-filter" className="text-sm font-medium">
                  Model
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full h-10 justify-between text-left font-normal"
                      id="model-filter"
                    >
                      <span className="truncate">
                        {selectedModels.length === 0
                          ? 'Všechny modely'
                          : selectedModels.length === 1
                          ? selectedModels[0]
                          : `${selectedModels.length} modelů`}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0" align="start">
                    <div className="max-h-[300px] overflow-y-auto p-2">
                      <div className="space-y-1">
                        <div
                          className="flex items-center space-x-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                          onClick={() => setSelectedModels([])}
                        >
                          <Checkbox
                            checked={selectedModels.length === 0}
                            onCheckedChange={() => setSelectedModels([])}
                          />
                          <span>Všechny modely</span>
                        </div>
                        {modelOptions.map((model) => {
                          const isSelected = selectedModels.includes(model)
                          return (
                            <div
                              key={model}
                              className="flex items-center space-x-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedModels(selectedModels.filter((m) => m !== model))
                                } else {
                                  setSelectedModels([...selectedModels, model])
                                }
                              }}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedModels([...selectedModels, model])
                                  } else {
                                    setSelectedModels(selectedModels.filter((m) => m !== model))
                                  }
                                }}
                              />
                              <span>{model}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                {selectedModels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedModels.slice(0, 2).map((m) => (
                      <Badge key={m} variant="secondary" className="text-xs h-5 px-1.5">
                        {m}
                      </Badge>
                    ))}
                    {selectedModels.length > 2 && (
                      <Badge variant="secondary" className="text-xs h-5 px-1.5">
                        +{selectedModels.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* STK Warning Filter */}
            {expiringSTKCount > 0 && (
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={showSTKWarningFilter ? "default" : "outline"}
                          size="sm"
                          onClick={() => setShowSTKWarningFilter(!showSTKWarningFilter)}
                          className={cn(
                            "flex items-center gap-2",
                            showSTKWarningFilter 
                              ? "bg-orange-500 hover:bg-orange-600 text-white" 
                              : "border-orange-300 text-orange-700 hover:bg-orange-50"
                          )}
                        >
                          <CircleDot className="h-4 w-4" />
                          STK vyprší ({expiringSTKCount})
                          {showSTKWarningFilter && (
                            <Badge variant="secondary" className="ml-1 bg-white/20 text-white">
                              Aktivní
                            </Badge>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-medium">
                            {showSTKWarningFilter ? "Zrušit filtr STK" : "Zobrazit vozidla s končícím STK (do 30 dnů)"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {showSTKWarningFilter 
                              ? "Klikněte pro zobrazení všech vozidel" 
                              : `Klikněte pro zobrazení ${expiringSTKCount} vozidel s STK končícím do 30 dnů`
                            }
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}

            {/* Results count */}
            <div className="pt-2 border-t">
              <div className="text-sm text-muted-foreground">
                Zobrazeno <span className="font-semibold text-foreground">{paginatedAuta.length}</span> z{' '}
                <span className="font-semibold text-foreground">{filteredAuta.length}</span> vozidel
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selection Indicator - only show when items are selected */}
        {selectedRows.size > 0 && (
          <div className="bg-purple-50 border-b border-purple-200 px-4 py-2 shadow-sm sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="text-sm">
                  {selectedRows.size} vybráno
                </Badge>
                <span className="text-sm text-gray-600">
                  z {filteredAuta.length} vozidel
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRows(new Set())}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <X className="h-4 w-4 mr-1" />
                  Zrušit výběr
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop table */}
        <div className="w-full overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle px-4 sm:px-0">
            <div className="hidden sm:block overflow-visible max-h-[calc(100vh-16rem)]">
              <Table className="w-full min-w-[960px] table-fixed divide-y divide-gray-200">
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[50px] text-center">
                  <div className="flex justify-center">
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isIndeterminate}
                      onCheckedChange={(checked) => handleSelectAll(checked === true)}
                      aria-label={isAllSelected ? "Odznačit vše" : "Označit vše"}
                    />
                  </div>
                </TableHead>
                <TableHead className="w-[80px] text-left">Foto</TableHead>
                <TableHead className="w-[20px] text-left"></TableHead>
                <TableHead 
                  className="text-left cursor-pointer hover:bg-gray-100 transition-colors px-4"
                  onClick={() => handleSortChange('spz')}
                >
                  <div className="flex items-center gap-1">
                    SPZ
                    {sortField === 'spz' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-left">Značka</TableHead>
                <TableHead className="text-left">Model</TableHead>
                <TableHead className="text-left">Rok výroby</TableHead>
                <TableHead className="text-left">Nájezd</TableHead>
                <TableHead className="text-left">Stav</TableHead>
                <TableHead className="text-left">STK</TableHead>
                <TableHead className="text-left">Akce</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAuta.map((auto) => {
                const stkStatus = getSTKStatus(auto.datumSTK);
                const getRowBackgroundClass = () => {
                  switch (stkStatus) {
                    case 'expired':
                      return 'bg-red-50 hover:bg-red-100';
                    case 'upcoming':
                      return 'bg-yellow-50 hover:bg-yellow-100';
                    default:
                      return 'hover:bg-gray-50';
                  }
                };

                return (
                  <TableRow 
                    key={auto.id}
                    className={`transition-colors ${getRowBackgroundClass()}`}
                  >
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={selectedRows.has(auto.id.toString())}
                          onCheckedChange={(checked) => handleSelectRow(auto.id.toString(), checked === true)}
                          aria-label={`Označit vozidlo ${auto.spz}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-left">
                      {(() => {
                        // Get the thumbnail URL with a timestamp to prevent caching
                        const timestamp = new Date().getTime();
                        const thumbnailUrl = auto.thumbnailUrl 
                          ? `${auto.thumbnailUrl}?t=${timestamp}` 
                          : auto.thumbnailFotoId 
                            ? `/api/auta/${auto.id}/fotky/${auto.thumbnailFotoId}?t=${timestamp}`
                            : null;
                        
                        return thumbnailUrl ? (
                          <>
                            <div 
                              className="relative h-16 w-16 overflow-hidden rounded-md bg-gray-100 cursor-pointer hover:opacity-90 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
                              onClick={() => setFullscreenPhoto(thumbnailUrl)}
                            >
                              <img 
                                src={thumbnailUrl}
                                alt={`${auto.znacka} ${auto.model}`}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  console.error('Image failed to load:', thumbnailUrl);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
                            </div>
                            
                            {/* Fullscreen Photo Dialog */}
                            <Dialog open={!!fullscreenPhoto} onOpenChange={(open) => !open && setFullscreenPhoto(null)}>
                              <DialogContent className="sm:max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-black/95 border-none">
                                <div className="relative w-full h-full flex items-center justify-center">
                                  <button 
                                    onClick={() => setFullscreenPhoto(null)}
                                    className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-white/20 z-10 transition-all duration-200 backdrop-blur-sm"
                                    aria-label="Close"
                                  >
                                    <X className="h-6 w-6" />
                                  </button>
                                  
                                  <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/50 to-transparent pointer-events-none"></div>
                                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
                                  
                                  {fullscreenPhoto && (
                                    <div className="transition-all duration-300 ease-out transform scale-100">
                                      <img 
                                        src={fullscreenPhoto}
                                        alt={`${auto.znacka} ${auto.model}`}
                                        className="max-w-full max-h-[80vh] object-contain shadow-2xl"
                                      />
                                      <div className="mt-4 text-center text-white/80 text-sm">
                                        {auto.znacka} {auto.model} • {auto.spz}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        ) : (
                          <div 
                            className="flex h-16 w-16 items-center justify-center rounded-md bg-gray-100 shadow-sm"
                          >
                            <ImageIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-left"></TableCell>
                    <TableCell className="text-left font-medium">{auto.spz}</TableCell>
                    <TableCell className="text-left">{auto.znacka}</TableCell>
                    <TableCell className="text-left">{auto.model}</TableCell>
                    <TableCell className="text-left">{auto.rokVyroby}</TableCell>
                    <TableCell className="text-left">
                      {editingCell?.id === auto.id && editingCell?.field === 'najezd' ? (
                        <InlineMileageEditor
                          auto={auto}
                          onSave={async (value) => {
                            await handleInlineSave(auto.id, 'najezd', value);
                          }}
                          onCancel={handleInlineCancel}
                        />
                      ) : (
                        <TooltipProvider>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <div 
                                className={cn(
                                  "group flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-all duration-200 focus-within:bg-gray-50 focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-opacity-50",
                                  editingCell && editingCell.id === auto.id && editingCell.field === 'najezd' && "bg-purple-50 ring-2 ring-purple-200"
                                )}
                                onClick={() => {
                                  if (editingCell && editingCell.id !== auto.id) {
                                    handleInlineCancel();
                                  }
                                  setEditingCell({ id: auto.id, field: 'najezd' });
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    if (editingCell && editingCell.id !== auto.id) {
                                      handleInlineCancel();
                                    }
                                    setEditingCell({ id: auto.id, field: 'najezd' });
                                  }
                                }}
                                tabIndex={0}
                                role="button"
                                aria-label="Klikněte pro úpravu nájezdu"
                              >
                                <span className="font-medium">{formatNumber(auto.najezd)}</span>
                                <Edit3 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-medium">Upravit nájezd</p>
                                <p className="text-xs text-gray-400">
                                  Klikněte pro úpravu nájezdu vozidla
                                </p>
                                <div className="text-xs text-gray-400 space-y-1">
                                  <p>• Enter = uložit změny</p>
                                  <p>• Esc = zrušit úpravu</p>
                                  <p>• Tab = přepnout na další pole</p>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </TableCell>
                    <TableCell className="text-left">
                      <Badge className={getStatusColor(auto.stav)}>
                        {auto.stav}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left relative">
                      {editingCell?.id === auto.id && editingCell?.field === 'datumSTK' ? (
                        <InlineSTKEditor
                          auto={auto}
                          onSave={async (value) => {
                            await handleInlineSave(auto.id, 'datumSTK', value);
                          }}
                          onCancel={handleInlineCancel}
                        />
                      ) : (
                        <TooltipProvider>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <div 
                                className={cn(
                                  "group flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-all duration-200 focus-within:bg-gray-50 focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-opacity-50",
                                  editingCell && editingCell.id === auto.id && editingCell.field === 'datumSTK' && "bg-purple-50 ring-2 ring-purple-200"
                                )}
                                onClick={() => {
                                  if (editingCell && editingCell.id !== auto.id) {
                                    handleInlineCancel();
                                  }
                                  setEditingCell({ id: auto.id, field: 'datumSTK' });
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    if (editingCell && editingCell.id !== auto.id) {
                                      handleInlineCancel();
                                    }
                                    setEditingCell({ id: auto.id, field: 'datumSTK' });
                                  }
                                }}
                                tabIndex={0}
                                role="button"
                                aria-label="Klikněte pro úpravu data STK"
                              >
                                <div className="flex items-center gap-2">
                                  {stkStatus === 'expired' && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="flex items-center">
                                            <CircleDot className="h-4 w-4 text-red-600 mr-2" aria-hidden="true" />
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">STK vypršela</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                  {stkStatus === 'upcoming' && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="flex items-center">
                                            <CircleDot className="h-4 w-4 text-yellow-600 mr-2" aria-hidden="true" />
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">STK brzy vyprší</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                  {stkStatus === 'normal' && auto.datumSTK && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="flex items-center">
                                            <Check className="h-4 w-4 text-green-600" />
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">STK platná</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                  {auto.datumSTK ? (
                                    <span className={cn(
                                      "font-medium",
                                      stkStatus === 'expired' && 'text-red-600',
                                      stkStatus === 'upcoming' && 'text-yellow-700'
                                    )}>
                                      {new Date(auto.datumSTK).toLocaleDateString('cs-CZ')}
                                    </span>
                                  ) : (
                                    <Badge className="bg-amber-100 text-amber-800 border-amber-200">Není zadáno</Badge>
                                  )}
                                </div>
                                <Edit3 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-medium">Upravit datum STK</p>
                                <p className="text-xs text-gray-400">
                                  Klikněte pro úpravu data technické kontroly
                                </p>
                                {stkStatus === 'expired' && (
                                  <p className="text-xs text-red-600 font-medium">
                                    ⚠️ STK vypršelo
                                  </p>
                                )}
                                {stkStatus === 'upcoming' && (
                                  <p className="text-xs text-yellow-600 font-medium">
                                    ⚠️ STK brzy vyprší
                                  </p>
                                )}
                                <div className="text-xs text-gray-400 space-y-1">
                                  <p>• Enter = uložit změny</p>
                                  <p>• Esc = zrušit úpravu</p>
                                  <p>• Tab = přepnout na další pole</p>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </TableCell>
                    <TableCell className="text-left">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Otevřít menu akcí"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => handleEdit(auto)}
                            className="cursor-pointer"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Upravit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleCarDetail(auto.id)}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Detail
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteModalData({ auto, isOpen: true })}
                            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Vyřadit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
            </div>
          </div>
        </div>

        {/* Mobile card layout */}
        <div className="sm:hidden space-y-4 px-4 pb-4">
          {paginatedAuta.map((auto) => {
            const stkStatus = getSTKStatus(auto.datumSTK);
            const getRowBackgroundClass = () => {
              switch (stkStatus) {
                case 'expired':
                  return 'bg-red-50';
                case 'upcoming':
                  return 'bg-yellow-50';
                default:
                  return 'bg-white';
              }
            };

            const thumbnailUrl = (() => {
              const timestamp = new Date().getTime();
              if (auto.thumbnailUrl) return `${auto.thumbnailUrl}?t=${timestamp}`;
              if (auto.thumbnailFotoId) return `/api/auta/${auto.id}/fotky/${auto.thumbnailFotoId}?t=${timestamp}`;
              return null;
            })();

            return (
              <div
                key={auto.id}
                className={`rounded-2xl border border-gray-200 shadow-sm ${getRowBackgroundClass()} p-4 space-y-4`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Checkbox
                        checked={selectedRows.has(auto.id.toString())}
                        onCheckedChange={(checked) => handleSelectRow(auto.id.toString(), checked === true)}
                        aria-label={`Označit vozidlo ${auto.spz}`}
                      />
                    </div>
                    <div>
                      <p className="text-sm uppercase tracking-wide text-gray-500">{auto.spz}</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {auto.znacka} {auto.model}
                      </p>
                      <Badge className={`mt-2 ${getStatusColor(auto.stav)}`}>{auto.stav}</Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => handleEdit(auto)}>Upravit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCarDetail(auto.id)}>Detail</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteModalData({ auto, isOpen: true })}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        Vyřadit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex gap-3">
                  {thumbnailUrl ? (
                    <button
                      type="button"
                      onClick={() => setFullscreenPhoto(thumbnailUrl)}
                      className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100"
                      aria-label="Zvětšit fotografii"
                    >
                      <img src={thumbnailUrl} alt={`${auto.znacka} ${auto.model}`} className="h-full w-full object-cover" />
                    </button>
                  ) : (
                    <div className="h-24 w-24 flex items-center justify-center rounded-xl bg-gray-100 flex-shrink-0">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-sm w-full">
                    <div>
                      <p className="text-xs uppercase text-gray-500">Rok výroby</p>
                      <p className="font-medium text-gray-900">{auto.rokVyroby}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-500">Nájezd</p>
                      {editingCell?.id === auto.id && editingCell?.field === 'najezd' ? (
                        <InlineMileageEditor
                          auto={auto}
                          onSave={(value) => handleInlineSave(auto.id, 'najezd', value)}
                          onCancel={handleInlineCancel}
                        />
                      ) : (
                        <button
                          type="button"
                          className="font-semibold text-gray-900 underline-offset-2 hover:underline"
                          onClick={() => setEditingCell({ id: auto.id, field: 'najezd' })}
                        >
                          {formatNumber(auto.najezd)}
                        </button>
                      )}
                    </div>
                    <div className="col-span-2 relative z-10">
                      <p className="text-xs uppercase text-gray-500">Datum STK</p>
                      {editingCell?.id === auto.id && editingCell?.field === 'datumSTK' ? (
                        <InlineSTKEditor
                          auto={auto}
                          onSave={async (value) => {
                            await handleInlineSave(auto.id, 'datumSTK', value);
                          }}
                          onCancel={handleInlineCancel}
                        />
                      ) : auto.datumSTK ? (
                        <button
                          type="button"
                          className="flex items-center gap-2 font-semibold text-gray-900 underline-offset-2 hover:underline"
                          onClick={() => setEditingCell({ id: auto.id, field: 'datumSTK' })}
                        >
                          {new Date(auto.datumSTK).toLocaleDateString('cs-CZ')}
                          {stkStatus === 'expired' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          {stkStatus === 'upcoming' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingCell({ id: auto.id, field: 'datumSTK' })}
                          className="text-sm text-amber-700 underline underline-offset-2"
                        >
                          Není zadáno
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <span className="text-sm text-gray-700 whitespace-nowrap">
                Zobrazeno {paginatedAuta.length} z {filteredAuta.length} vozidel
              </span>
              <div className="flex items-center gap-2">
                <Label htmlFor="items-per-page" className="text-sm text-gray-700 whitespace-nowrap">
                  Záznamů na stránku:
                </Label>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger id="items-per-page" className="h-9 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-1 flex-wrap gap-1 min-w-0">
              {(() => {
                const totalPages = Math.ceil(filteredAuta.length / itemsPerPage);
                const maxVisiblePages = 7;
                const pages: (number | string)[] = [];
                
                if (totalPages <= maxVisiblePages) {
                  // Show all pages if total is less than max
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  // Always show first page
                  pages.push(1);
                  
                  let startPage = Math.max(2, currentPage - 1);
                  let endPage = Math.min(totalPages - 1, currentPage + 1);
                  
                  // Adjust range to show more pages around current
                  if (currentPage <= 3) {
                    endPage = Math.min(totalPages - 1, 5);
                  } else if (currentPage >= totalPages - 2) {
                    startPage = Math.max(2, totalPages - 4);
                  }
                  
                  // Add ellipsis after first page if needed
                  if (startPage > 2) {
                    pages.push('ellipsis-start');
                  }
                  
                  // Add pages around current
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(i);
                  }
                  
                  // Add ellipsis before last page if needed
                  if (endPage < totalPages - 1) {
                    pages.push('ellipsis-end');
                  }
                  
                  // Always show last page
                  pages.push(totalPages);
                }
                
                return pages.map((page, index) => {
                  if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                    return (
                      <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                        ...
                      </span>
                    );
                  }
                  
                  const pageNum = page as number;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded text-sm whitespace-nowrap ${
                        currentPage === pageNum
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <AutoForm 
          open={showForm}
          onOpenChangeClientAction={async (open: boolean) => {
            setShowForm(open);
            return Promise.resolve();
          }}
          onSubmit={async (data) => {
            // Handle form submission
            try {
              const response = await fetch('/api/auta', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              });
              
              if (!response.ok) {
                throw new Error('Failed to add vehicle');
              }
              
              setShowForm(false);
              onRefresh();
              toast({
                title: "Vozidlo přidáno",
                description: `${data.znacka} ${data.model} (${data.spz}) bylo úspěšně přidáno.`,
              });
            } catch (error) {
              console.error('Error adding vehicle:', error);
              toast({
                title: "Chyba",
                description: "Nepodařilo se přidat vozidlo",
                variant: "destructive",
              });
            }
          }}
        />
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-0">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-white">Potvrdit vyřazení</h2>
            <p className="mb-6 text-white">Opravdu chcete vyřadit vybraná vozidla? ({selectedRows.size} položek)</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 text-gray-300 hover:text-gray-500 w-full"
              >
                Zrušit
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 w-full"
              >
                Vyřadit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Old archive modal - removed since we now use bulk toolbar */}
      {selectedToArchive.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl max-h-full">
            <div className="relative bg-white rounded-lg shadow">
              <div className="flex items-start justify-between p-4 border-b rounded-t">
                <h1 className="text-2xl font-bold">Potvrdit archivaci</h1>
                <button 
                  type="button" 
                  onClick={() => setSelectedToArchive([])}
                  className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-6">
                <p>Opravdu chcete archivovat vybraná vozidla? ({selectedToArchive.length} položek)</p>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setSelectedToArchive([])}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 w-full"
                  >
                    Zrušit
                  </button>
                  <button
                    onClick={handleArchive}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 w-full "
                  >
                    Archivovat
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {deleteModalData && deleteModalData.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
          <div className="relative w-full max-w-md max-h-full">
            <div className="relative bg-white rounded-lg shadow">
              <div className="flex items-start justify-between p-4 border-b rounded-t">
                <h1 className="text-2xl font-bold w-full text-center">Potvrdit vyřazení</h1>
                <button 
                  type="button" 
                  onClick={() => setDeleteModalData({ auto: null, isOpen: false })}
                  className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-6">
                <p>{deleteModalData.auto ? `Opravdu chcete vyřadit vozidlo ${deleteModalData.auto.spz}?` : 'Vyberte vozidlo k vyřazení'}</p>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setDeleteModalData({ auto: null, isOpen: false })}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 w-full"
                  >
                    Zrušit
                  </button>
                  <button
                    onClick={handleSingleCarDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 w-full"
                  >
                    Vyřadit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add back the AutoDetailForm component */}
      <AutoDetailForm
        open={isEditModalOpen}
        onOpenChangeAction={(open: boolean) => {
          if (!open) handleCloseEditModal();
        }}
        initialData={selectedVehicle as unknown as AutoDetailValues & { id: string }}
        onSubmit={handleEditSubmit}
      />

      {/* Inline Editing Legend */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Edit3 className="h-3 w-3 text-gray-400" />
            <span>Klikněte na nájezd nebo datum STK pro úpravu</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono bg-gray-100 px-1 rounded">Enter</span>
            <span>uložit změny</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono bg-gray-100 px-1 rounded">Esc</span>
            <span>zrušit úpravu</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono bg-gray-100 px-1 rounded">Tab</span>
            <span>přepínat mezi poli</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3 w-3 text-red-500" />
            <span>STK vypršelo</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3 w-3 text-yellow-500" />
            <span>STK brzy vyprší</span>
          </div>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selectedRows.size}
        totalCount={filteredAuta.length}
        onClearSelectionAction={() => setSelectedRows(new Set())}
        onBulkDelete={handleBulkDelete}
        onBulkStateChange={handleBulkStateChange}
        onBulkSTKChange={handleBulkSTKChange}
        onBulkExport={handleBulkExport}
        onBulkPrint={handlePrint}
        onBulkArchive={handleArchive}
        isLoading={isSaving}
      />
    </div>
  )
}

export default AutoTable