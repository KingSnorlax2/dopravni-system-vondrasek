"use client"

import { useState, useTransition, useCallback, useMemo, useEffect } from 'react'
import AutoTable from '@/components/dashboard/AutoTable'
import { AutoForm } from "@/components/forms/AutoForm"
import { Button } from "@/components/ui/button"
import { Plus, AlertTriangle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { generateRandomVehicleData } from "@/lib/mock-data"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DatePickerWithPresets } from '@/components/ui/date-picker-with-presets'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { cs } from "date-fns/locale"
import React from "react"
import { useRouter } from "next/navigation"
import { Calendar } from "lucide-react"

// Validation schema for STK date updates
const stkUpdateSchema = z.object({
  vehicles: z.array(z.object({
    id: z.string(),
    spz: z.string(),
    znacka: z.string(),
    model: z.string(),
    currentSTK: z.string().nullable(),
    newSTK: z.date().nullable().optional(),
  }))
})

type STKUpdateFormData = z.infer<typeof stkUpdateSchema>

// Vehicle type matching Prisma Auto model
type Vehicle = {
  id: number
  spz: string
  znacka: string
  model: string
  rokVyroby: number
  najezd: number
  stav: string
  poznamka: string | null
  datumSTK: string | null
  aktivni: boolean
  createdAt: string
  updatedAt: string
}

interface AutoPageClientProps {
  initialVehicles: Vehicle[]
}

function isSTKExpiring(datumSTK: string | null) {
  if (!datumSTK) return false
  const stk = new Date(datumSTK)
  const today = new Date()
  const monthBeforeExpiration = new Date(stk)
  monthBeforeExpiration.setMonth(monthBeforeExpiration.getMonth() - 1)
  return today >= monthBeforeExpiration && today <= stk
}

export function AutoPageClient({ initialVehicles }: AutoPageClientProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [auta, setAuta] = useState<Vehicle[]>(initialVehicles)
  
  // Update local state when props change (after router.refresh())
  useEffect(() => {
    setAuta(initialVehicles)
  }, [initialVehicles])
  const [isPending, startTransition] = useTransition()
  const [showExpiringSTKDialog, setShowExpiringSTKDialog] = useState(false)
  const [isSavingSTK, setIsSavingSTK] = useState(false)
  const [savingVehicleId, setSavingVehicleId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const expiringSTKVehicles = auta.filter(auto => isSTKExpiring(auto.datumSTK))

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 250)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // Filter vehicles by SPZ or brand (znacka)
  const filteredVehicles = useMemo(() => {
    if (!debouncedSearch.trim()) return expiringSTKVehicles
    const term = debouncedSearch.trim().toLowerCase()
    return expiringSTKVehicles.filter(auto =>
      auto.spz?.toLowerCase().includes(term) ||
      auto.znacka?.toLowerCase().includes(term)
    )
  }, [expiringSTKVehicles, debouncedSearch])

  // Form for STK updates
  const stkForm = useForm<STKUpdateFormData>({
    resolver: zodResolver(stkUpdateSchema),
    defaultValues: {
      vehicles: []
    }
  })

  // Memoize the form data to prevent unnecessary resets
  const formVehiclesData = useMemo(() => {
    return expiringSTKVehicles.map(auto => ({
      id: auto.id.toString(),
      spz: auto.spz,
      znacka: auto.znacka,
      model: auto.model,
      currentSTK: auto.datumSTK,
      newSTK: auto.datumSTK ? new Date(auto.datumSTK) : null
    }))
  }, [expiringSTKVehicles])

  // Update form when vehicles change, but only if the data actually changed
  useEffect(() => {
    if (formVehiclesData.length > 0) {
      const currentFormData = stkForm.getValues('vehicles')
      const hasChanged = JSON.stringify(currentFormData) !== JSON.stringify(formVehiclesData)
      
      if (hasChanged) {
        stkForm.reset({
          vehicles: formVehiclesData
        })
      }
    }
  }, [formVehiclesData, stkForm])

  const handleSuccess = () => {
    router.refresh() // Refresh server component data
    setShowForm(false)
  }

  const handleOpenChange = async (open: boolean) => {
    startTransition(() => {
      setShowForm(open)
    })
    return Promise.resolve()
  }

  const refreshData = useCallback(async () => {
    try {
      router.refresh() // Refresh server component data
    } catch (error) {
      console.error('Error refreshing vehicles:', error)
      toast({
        title: "Chyba při načítání",
        description: "Nepodařilo se načíst seznam vozidel",
        variant: "destructive"
      })
    }
  }, [router])

  const handleAutoSubmit = async (newAuto: any) => {
    router.refresh() // Refresh server component data
    const znacka = newAuto.znacka || 'Vozidlo'
    const model = newAuto.model || ''
    const spz = newAuto.spz || ''
    const rokVyroby = newAuto.rokVyroby || ''
    toast({
      title: "Vozidlo přidáno",
      description: `${znacka} ${model} ${rokVyroby ? `(${rokVyroby})` : ''} ${spz ? `- ${spz}` : ''} bylo úspěšně přidáno.`.replace(/\s+/g, ' ').trim(),
    })
  }

  async function addRandomVehicles() {
    try {
      const randomVehicles = generateRandomVehicleData(5)
      
      for (const vehicle of Array.isArray(randomVehicles) ? randomVehicles : [randomVehicles]) {
        const response = await fetch('/api/auta', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(vehicle),
        })
        
        if (!response.ok) {
          throw new Error('Failed to add random vehicle')
        }
      }
      
      toast({
        title: "Úspěch",
        description: "Náhodná vozidla byla přidána",
      })
      
      router.refresh() // Refresh server component data
    } catch (error) {
      console.error('Error adding random vehicles:', error)
      toast({
        title: "Chyba",
        description: "Nepodařilo se přidat náhodná vozidla",
        variant: "destructive",
      })
    }
  }

  // Handle individual STK date save
  const handleIndividualSTKSave = async (vehicleId: string, newDate: Date | null) => {
    setSavingVehicleId(vehicleId)
    try {
      const response = await fetch(`/api/auta/${vehicleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          datumSTK: newDate ? newDate.toISOString() : null
        }),
      })

      if (response.ok) {
        toast({
          title: "STK datum aktualizováno",
          description: "Datum technické kontroly bylo úspěšně změněno",
        })
        router.refresh() // Refresh server component data
      } else {
        throw new Error('Failed to update STK date')
      }
    } catch (error) {
      console.error('Error updating STK date:', error)
      toast({
        title: "Chyba",
        description: "Nepodařilo se aktualizovat datum STK",
        variant: "destructive",
      })
    } finally {
      setSavingVehicleId(null)
    }
  }

  const handleDateSelect = async (vehicleId: string, newDate: Date | null) => {
    await handleIndividualSTKSave(vehicleId, newDate)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="unified-section-header space-y-2 text-center sm:text-left">
        <h1 className="unified-section-title text-3xl">Správa vozidel</h1>
        <p className="unified-section-description text-base text-muted-foreground">
          Spravujte svůj vozový park, přidávejte nová vozidla a sledujte technické kontroly.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto unified-button-primary">
            <Plus className="mr-2 h-4 w-4" />
            Přidat auto
          </Button>
          <Button 
            onClick={addRandomVehicles} 
            variant="outline" 
            size="sm" 
            className="w-full sm:w-auto unified-button-outline"
          >
            Přidat náhodná vozidla
          </Button>
        </div>

        {/* STK Alert Button */}
        <div className="flex items-center justify-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Expiring STK"
                  tabIndex={0}
                  className="flex items-center rounded-full px-4 py-2 border border-yellow-300 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition text-yellow-700"
                  onClick={() => setShowExpiringSTKDialog(true)}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Blížící se STK
                  {expiringSTKVehicles.length > 0 && (
                    <span className="ml-2 text-xs font-semibold rounded-full bg-yellow-200 px-2 py-0.5">
                      {expiringSTKVehicles.length}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Seznam vozidel se STK &lt; 30 dní</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* STK Dialog */}
      <Dialog open={showExpiringSTKDialog} onOpenChange={setShowExpiringSTKDialog}>
        <DialogContent className="max-w-4xl w-full h-[85vh] sm:h-[70vh] flex flex-col p-0">
          <DialogHeader className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 z-10 pr-12">
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Vozidla s blížícím se STK
            </DialogTitle>
            <DialogDescription>
              Seznam vozidel, kterým vyprší STK během 30 dnů. Změny se ukládají automaticky.
            </DialogDescription>
          </DialogHeader>
          {/* Search input */}
          <div className="px-4 sm:px-6 pt-4 pb-2 bg-white sticky top-[72px] z-10">
            <label htmlFor="expiring-stk-search" className="unified-form-label">
              Hledat podle SPZ nebo značky
            </label>
            <Input
              id="expiring-stk-search"
              placeholder="Zadejte SPZ nebo značku..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="unified-form-input"
              autoFocus={showExpiringSTKDialog}
              aria-label="Hledat vozidlo podle SPZ nebo značky"
            />
          </div>
          <div className="flex-1 overflow-y-auto px-0 py-0">
            {filteredVehicles.length === 0 ? (
              <div className="text-center text-gray-500 py-8">Žádná vozidla s blížícím se STK</div>
            ) : (
              <div className="space-y-3">
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-white sticky top-0 z-20 border-b shadow-sm font-semibold text-sm text-gray-700">
                  <div className="col-span-2">SPZ</div>
                  <div className="col-span-3">Vozidlo</div>
                  <div className="col-span-2">Aktuální STK</div>
                  <div className="col-span-5">Nové STK</div>
                </div>
                {/* Table rows */}
                <Controller
                  name="vehicles"
                  control={stkForm.control}
                  render={({ field }) => (
                    <div className="space-y-3 px-4 sm:px-6 pb-4">
                      {field.value
                        .filter((vehicle: any) =>
                          filteredVehicles.some(v => v.id.toString() === vehicle.id)
                        )
                        .map((vehicle: any, index: number) => (
                          <div 
                            key={vehicle.id} 
                            className="flex flex-col gap-4 md:grid md:grid-cols-12 md:items-center md:gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                          >
                            <div className="flex flex-col gap-1 md:col-span-2 min-w-0">
                              <p className="text-xs uppercase tracking-wide text-muted-foreground md:hidden">SPZ</p>
                              <span className="font-mono text-base text-gray-900 truncate">{vehicle.spz}</span>
                            </div>
                            <div className="flex flex-col gap-1 md:col-span-3 min-w-0">
                              <p className="text-xs uppercase tracking-wide text-muted-foreground md:hidden">Vozidlo</p>
                              <span className="text-gray-800 text-sm truncate">{vehicle.znacka} {vehicle.model}</span>
                            </div>
                            <div className="flex flex-col gap-1 md:col-span-2 min-w-0">
                              <p className="text-xs uppercase tracking-wide text-muted-foreground md:hidden">Aktuální STK</p>
                              <span className="text-sm text-gray-600 truncate">
                                {vehicle.currentSTK ? format(new Date(vehicle.currentSTK), "d.M.yyyy", { locale: cs }) : 'Není zadáno'}
                              </span>
                            </div>
                            <div className="md:col-span-5 min-w-0">
                              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 md:hidden">Nové STK</p>
                              <Controller
                                name={`vehicles.${index}.newSTK`}
                                control={stkForm.control}
                                render={({ field: dateField }) => {
                                  const [open, setOpen] = React.useState(false)
                                  return (
                                    <Popover open={open} onOpenChange={setOpen}>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          disabled={savingVehicleId === vehicle.id}
                                          className={cn(
                                            "w-full justify-start text-left font-normal h-8 min-w-0",
                                            !dateField.value && "text-muted-foreground",
                                            savingVehicleId === vehicle.id && "opacity-50 cursor-not-allowed"
                                          )}
                                        >
                                          {savingVehicleId === vehicle.id ? (
                                            <>
                                              <div className="h-3 w-3 mr-2 animate-spin rounded-full border-2 border-gray-600 border-t-transparent flex-shrink-0" />
                                              <span className="truncate">Ukládám...</span>
                                            </>
                                          ) : (
                                            <>
                                              <Calendar className="mr-2 h-3 w-3 flex-shrink-0" />
                                              <span>
                                                {dateField.value ? (
                                                  format(dateField.value, "d.M.yyyy", { locale: cs })
                                                ) : (
                                                  "Vyberte datum"
                                                )}
                                              </span>
                                            </>
                                          )}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                        <DatePickerWithPresets
                                          date={dateField.value || undefined}
                                          setDate={(date) => {
                                            dateField.onChange(date)
                                            if (date !== undefined) {
                                              handleDateSelect(vehicle.id, date)
                                              setOpen(false)
                                            }
                                          }}
                                          fromYear={2020}
                                          toYear={new Date().getFullYear() + 10}
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  )
                                }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="unified-card p-6">
        <AutoTable 
          auta={auta}
          onRefresh={refreshData}
        />
      </div>

      {/* Auto Form */}
      <AutoForm 
        open={showForm} 
        onOpenChangeClientAction={handleOpenChange}
        onSubmit={handleAutoSubmit}
      />
    </div>
  )
}

