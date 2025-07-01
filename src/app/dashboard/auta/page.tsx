'use client'

import { useState, useEffect, useTransition, useCallback, useMemo } from 'react'
import AutoTable from '@/components/dashboard/AutoTable'
import { AutoForm } from "@/components/forms/AutoForm"
import { Button } from "@/components/ui/button"
import { Plus, AlertTriangle, Calendar, Save, X, Check } from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { cs } from "date-fns/locale"
import { generateRandomVehicleData } from "@/lib/mock-data"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

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

function isSTKExpiring(datumSTK: string | null) {
  if (!datumSTK) return false
  const stk = new Date(datumSTK)
  const today = new Date()
  const monthBeforeExpiration = new Date(stk)
  monthBeforeExpiration.setMonth(monthBeforeExpiration.getMonth() - 1)
  return today >= monthBeforeExpiration && today <= stk
}

export default function AutoPage() {
  const [showForm, setShowForm] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [auta, setAuta] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)
  const [showExpiringSTKDialog, setShowExpiringSTKDialog] = useState(false)
  const [isSavingSTK, setIsSavingSTK] = useState(false)
  const [savingVehicleId, setSavingVehicleId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const expiringSTKVehicles = auta.filter(auto => isSTKExpiring(auto.datumSTK))

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Filter vehicles by SPZ or brand (znacka)
  const filteredVehicles = useMemo(() => {
    if (!debouncedSearch.trim()) return expiringSTKVehicles;
    const term = debouncedSearch.trim().toLowerCase();
    return expiringSTKVehicles.filter(auto =>
      auto.spz?.toLowerCase().includes(term) ||
      auto.znacka?.toLowerCase().includes(term)
    );
  }, [expiringSTKVehicles, debouncedSearch]);

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
      id: auto.id,
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
    setRefresh(prev => prev + 1)
    setShowForm(false)
  }

  const handleOpenChange = async (open: boolean) => {
    startTransition(() => {
      setShowForm(open)
    })
    return Promise.resolve()
  }

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/auta?_t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        setAuta(data);
      }
    } catch (error) {
      console.error('Error refreshing vehicles:', error);
      toast({
        title: "Chyba při načítání",
        description: "Nepodařilo se načíst seznam vozidel",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleAutoSubmit = async (newAuto: any) => {
    await refreshData() // Refetch the data to update the list
    const znacka = newAuto.znacka || 'Vozidlo';
    const model = newAuto.model || '';
    const spz = newAuto.spz || '';
    const rokVyroby = newAuto.rokVyroby || '';
    toast({
      title: "Vozidlo přidáno",
      description: `${znacka} ${model} ${rokVyroby ? `(${rokVyroby})` : ''} ${spz ? `- ${spz}` : ''} bylo úspěšně přidáno.`.replace(/\s+/g, ' ').trim(),
    })
  }

  async function addRandomVehicles() {
    try {
      const randomVehicles = generateRandomVehicleData(5); // Generate 5 random vehicles
      
      for (const vehicle of Array.isArray(randomVehicles) ? randomVehicles : [randomVehicles]) {
        const response = await fetch('/api/auta', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(vehicle),
        });
        
        if (!response.ok) {
          throw new Error('Failed to add random vehicle');
        }
      }
      
      toast({
        title: "Úspěch",
        description: "Náhodná vozidla byla přidána",
      });
      
      // Refresh the page or data
      window.location.reload();
    } catch (error) {
      console.error('Error adding random vehicles:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se přidat náhodná vozidla",
        variant: "destructive",
      });
    }
  }

  // Handle individual STK date save
  const handleIndividualSTKSave = async (vehicleId: string, newDate: Date | null) => {
    setSavingVehicleId(vehicleId);
    try {
      const response = await fetch(`/api/auta/${vehicleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          datumSTK: newDate?.toISOString() || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update STK date');
      }

      // Optimistically update local state
      const updatedAuta = auta.map(auto => {
        if (auto.id === vehicleId) {
          return { ...auto, datumSTK: newDate?.toISOString() || null };
        }
        return auto;
      });
      setAuta(updatedAuta);

      toast({
        title: "STK aktualizováno",
        description: "Datum STK bylo úspěšně změněno",
      });

      // Refresh data to ensure consistency
      await refreshData();
    } catch (error) {
      console.error('Error updating STK date:', error);
      toast({
        title: "Chyba při aktualizaci",
        description: "Nepodařilo se aktualizovat datum STK",
        variant: "destructive",
      });
      
      // Revert the form value on error
      const vehicle = expiringSTKVehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        stkForm.setValue(`vehicles.${expiringSTKVehicles.findIndex(v => v.id === vehicleId)}.newSTK`, 
          vehicle.datumSTK ? new Date(vehicle.datumSTK) : null
        );
      }
    } finally {
      setSavingVehicleId(null);
    }
  };

  // Handle date selection with immediate save
  const handleDateSelect = async (vehicleId: string, newDate: Date | null) => {
    const vehicle = expiringSTKVehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    const currentDate = vehicle.datumSTK ? new Date(vehicle.datumSTK) : null;
    
    // Only save if the date actually changed
    if (newDate?.getTime() !== currentDate?.getTime()) {
      await handleIndividualSTKSave(vehicleId, newDate);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">Celkem aut</h3>
          <p className="text-2xl font-bold text-black">{auta.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">Aktivní</h3>
          <p className="text-2xl font-bold text-green-600">
            {auta.filter(a => a.stav === 'aktivní').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">V servisu</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {auta.filter(a => a.stav === 'servis').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">Vyřazené</h3>
          <p className="text-2xl font-bold text-red-600">
            {auta.filter(a => a.stav === 'vyřazeno').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">Průměrný nájezd</h3>
          <p className="text-2xl font-bold text-black">
            {auta.length > 0 
              ? Math.round(auta.reduce((acc, auto) => acc + auto.najezd, 0) / auta.length).toLocaleString()
              : 0} km
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Správa vozidel</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Přidat auto
        </Button>
        <Button onClick={addRandomVehicles} variant="outline" size="sm" className="ml-2">
          Přidat náhodná vozidla
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Expiring STK"
                tabIndex={0}
                className="rounded-full p-2 border border-yellow-300 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition text-yellow-700"
                onClick={() => setShowExpiringSTKDialog(true)}
              >
                <AlertTriangle className="h-5 w-5" />
                {expiringSTKVehicles.length > 0 && (
                  <span className="ml-1 text-xs font-semibold">{expiringSTKVehicles.length}</span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Expiring STK</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Dialog open={showExpiringSTKDialog} onOpenChange={setShowExpiringSTKDialog}>
          <DialogContent className="max-w-4xl w-full max-h-[70vh] flex flex-col p-0">
            <DialogHeader className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Vozidla s blížícím se STK
              </DialogTitle>
              <DialogDescription>
                Seznam vozidel, kterým vyprší STK během 30 dnů. Změny se ukládají automaticky.
              </DialogDescription>
            </DialogHeader>
            {/* Search input */}
            <div className="px-6 pt-4 pb-2 bg-white sticky top-[72px] z-10">
              <label htmlFor="expiring-stk-search" className="block text-sm font-medium text-gray-700 mb-1">
                Hledat podle SPZ nebo značky
              </label>
              <Input
                id="expiring-stk-search"
                placeholder="Zadejte SPZ nebo značku..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full"
                autoFocus={showExpiringSTKDialog}
                aria-label="Hledat vozidlo podle SPZ nebo značky"
              />
            </div>
            <div className="flex-1 overflow-y-auto px-0 py-0">
              {filteredVehicles.length === 0 ? (
                <div className="text-center text-gray-500 py-8">Žádná vozidla s blížícím se STK</div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-white sticky top-0 z-20 border-b shadow-sm font-semibold text-sm text-gray-700">
                    <div className="col-span-2">SPZ</div>
                    <div className="col-span-4">Vozidlo</div>
                    <div className="col-span-3">Aktuální STK</div>
                    <div className="col-span-3">Nové STK</div>
                  </div>
                  {/* Table rows */}
                  <Controller
                    name="vehicles"
                    control={stkForm.control}
                    render={({ field }) => (
                      <div className="space-y-2 px-6 pb-4">
                        {field.value
                          .filter((vehicle: any) =>
                            filteredVehicles.some(v => v.id === vehicle.id)
                          )
                          .map((vehicle: any, index: number) => (
                            <div key={vehicle.id} className="grid grid-cols-12 gap-4 items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="col-span-2">
                                <span className="font-mono text-sm text-gray-800">{vehicle.spz}</span>
                              </div>
                              <div className="col-span-4">
                                <span className="text-gray-700 text-sm">{vehicle.znacka} {vehicle.model}</span>
                              </div>
                              <div className="col-span-3">
                                <span className="text-sm text-gray-600">
                                  {vehicle.currentSTK ? format(new Date(vehicle.currentSTK), "d.M.yyyy", { locale: cs }) : 'Není zadáno'}
                                </span>
                              </div>
                              <div className="col-span-3">
                                <Controller
                                  name={`vehicles.${index}.newSTK`}
                                  control={stkForm.control}
                                  render={({ field: dateField }) => (
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          disabled={savingVehicleId === vehicle.id}
                                          className={cn(
                                            "w-full justify-start text-left font-normal h-8",
                                            !dateField.value && "text-muted-foreground",
                                            savingVehicleId === vehicle.id && "opacity-50 cursor-not-allowed"
                                          )}
                                        >
                                          {savingVehicleId === vehicle.id ? (
                                            <>
                                              <div className="h-3 w-3 mr-2 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
                                              Ukládám...
                                            </>
                                          ) : (
                                            <>
                                              <Calendar className="mr-2 h-3 w-3" />
                                              {dateField.value ? (
                                                format(dateField.value, "d.M.yyyy", { locale: cs })
                                              ) : (
                                                <span>Vyberte datum</span>
                                              )}
                                            </>
                                          )}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                        <CalendarComponent
                                          mode="single"
                                          selected={dateField.value || undefined}
                                          onSelect={(date) => {
                                            dateField.onChange(date);
                                            if (date !== undefined) {
                                              handleDateSelect(vehicle.id, date);
                                            }
                                          }}
                                          initialFocus
                                          locale={cs}
                                          className="rounded-md"
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  )}
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
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <AutoTable 
          auta={auta}
          onRefresh={refreshData}
        />
      </div>

      <AutoForm 
        open={showForm} 
        onOpenChangeClientAction={handleOpenChange}
        onSubmit={handleAutoSubmit}
      />
    </div>
  )
}