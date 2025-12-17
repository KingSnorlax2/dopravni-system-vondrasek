"use client"

import React, { useState, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Fuel, 
  Battery, 
  Gauge, 
  Settings, 
  FileText, 
  Calendar,
  Car,
  Hash,
  Loader2,
  X
} from "lucide-react"
import { vehicleFormSchema, VehicleFormValues, VehicleStatus } from '@/lib/schemas/vehicle'
import { cn } from '@/lib/utils'

export interface VehicleFormProps {
  open: boolean
  onOpenChangeClientAction: (open: boolean) => Promise<void>
  onSubmit?: (data: VehicleFormValues) => void
  initialData?: Partial<VehicleFormValues> & { id?: string }
}

const STATUS_OPTIONS = [
  { value: VehicleStatus.AKTIVNI, label: "Aktivní" },
  { value: VehicleStatus.SERVIS, label: "V servisu" },
  { value: VehicleStatus.VYRAZENO, label: "Vyřazeno" }
]

const FUEL_OPTIONS = [
  { value: 'BENZIN', label: 'Benzín' },
  { value: 'NAFTA', label: 'Nafta' },
  { value: 'LPG', label: 'LPG' },
  { value: 'CNG', label: 'CNG' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'ELEKTRO', label: 'Elektro' },
]

const EMISSION_STANDARDS = [
  { value: 'EURO1', label: 'EURO 1' },
  { value: 'EURO2', label: 'EURO 2' },
  { value: 'EURO3', label: 'EURO 3' },
  { value: 'EURO4', label: 'EURO 4' },
  { value: 'EURO5', label: 'EURO 5' },
  { value: 'EURO6', label: 'EURO 6' },
  { value: 'EURO6D', label: 'EURO 6D' },
]

export function VehicleForm({ 
  open, 
  onOpenChangeClientAction, 
  onSubmit, 
  initialData 
}: VehicleFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSpzError, setShowSpzError] = useState(false)

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      spz: initialData?.spz || '',
      znacka: initialData?.znacka || '',
      model: initialData?.model || '',
      rokVyroby: initialData?.rokVyroby || new Date().getFullYear(),
      najezd: initialData?.najezd || 0,
      stav: initialData?.stav || VehicleStatus.AKTIVNI,
      poznamka: initialData?.poznamka || '',
      datumSTK: initialData?.datumSTK || '',
      palivo: initialData?.palivo || null,
      kapacita_baterie: initialData?.kapacita_baterie || null,
      dojezd: initialData?.dojezd || null,
      objem_motoru: initialData?.objem_motoru || null,
      emisni_norma: initialData?.emisni_norma || null,
      vin: initialData?.vin || '',
    }
  })

  // Watch palivo field for dynamic form logic
  const selectedFuel = useWatch({
    control: form.control,
    name: "palivo",
  })

  const isElectric = selectedFuel === 'ELEKTRO'
  const isCombustion = selectedFuel && selectedFuel !== 'ELEKTRO' && selectedFuel !== 'HYBRID'

  // Clear dependent fields when fuel type changes
  useEffect(() => {
    if (selectedFuel === 'ELEKTRO') {
      form.setValue('objem_motoru', null)
      form.setValue('emisni_norma', null)
    } else if (selectedFuel && selectedFuel !== 'ELEKTRO') {
      form.setValue('kapacita_baterie', null)
      form.setValue('dojezd', null)
    }
  }, [selectedFuel, form])

  const checkSPZExists = async (spz: string, excludeId?: string): Promise<boolean> => {
    try {
      let url = `/api/auta/check-spz?spz=${encodeURIComponent(spz)}`
      if (excludeId) {
        url += `&excludeId=${encodeURIComponent(excludeId)}`
      }
      const response = await fetch(url)
      const data = await response.json()
      return data.exists
    } catch (error) {
      console.error('Error checking SPZ:', error)
      return false
    }
  }

  const handleSubmit = async (data: VehicleFormValues) => {
    setLoading(true)
    setError(null)
    
    try {
      // Check SPZ uniqueness
      if (!initialData || (initialData && initialData.spz !== data.spz)) {
        const exists = await checkSPZExists(data.spz, initialData?.id)
        if (exists) {
          setShowSpzError(true)
          setLoading(false)
          return
        }
      }

      // Prepare submit data (only include fields that exist in DB)
      const submitData: any = {
        spz: data.spz,
        znacka: data.znacka,
        model: data.model,
        rokVyroby: data.rokVyroby,
        najezd: data.najezd,
        stav: data.stav,
        poznamka: data.poznamka || null,
      }
      
      // Handle datumSTK
      if (data.datumSTK) {
        if (data.datumSTK instanceof Date) {
          submitData.datumSTK = data.datumSTK.toISOString()
        } else if (typeof data.datumSTK === 'string') {
          submitData.datumSTK = data.datumSTK
        }
      } else {
        submitData.datumSTK = null
      }

      // Note: palivo, kapacita_baterie, dojezd, objem_motoru, emisni_norma, vin
      // are not in DB schema yet, so we'll store them in poznamka as JSON for now
      // or you can add them to DB schema later
      const additionalData = {
        palivo: data.palivo,
        kapacita_baterie: data.kapacita_baterie,
        dojezd: data.dojezd,
        objem_motoru: data.objem_motoru,
        emisni_norma: data.emisni_norma,
        vin: data.vin,
      }
      
      // Store additional data in poznamka if needed (or extend DB schema)
      // For now, we'll just include it in the submit data
      // You can modify the API to handle these fields

      const url = initialData ? `/api/auta/${initialData.id}` : '/api/auta'
      const response = await fetch(url, {
        method: initialData ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        throw new Error('Nastala chyba při vytváření/úpravě vozidla')
      }

      if (onSubmit) {
        await onSubmit(await response.json())
      }

      form.reset()
      handleClose()
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'Nastala chyba při vytváření/úpravě vozidla')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    form.reset()
    onOpenChangeClientAction(false)
  }

  const handleCancel = () => {
    handleClose()
    router.back()
  }

  // Auto-uppercase SPZ input handler
  const handleSpzChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/\s/g, '')
    form.setValue('spz', value, { shouldValidate: true })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) handleClose()
      }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Car className="h-6 w-6" />
              {initialData ? 'Upravit vozidlo' : 'Nové vozidlo'}
            </DialogTitle>
            <DialogDescription>
              {initialData ? 'Upravte údaje o vozidle' : 'Vyplňte údaje o novém vozidle'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Card 1: Základní údaje */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5" />
                    Základní údaje
                  </CardTitle>
                  <CardDescription>
                    Identifikační údaje vozidla
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="spz"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Hash className="h-4 w-4" />
                            SPZ *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="1A2 3456"
                              {...field}
                              onChange={handleSpzChange}
                              maxLength={8}
                              className="uppercase"
                              disabled={loading}
                            />
                          </FormControl>
                          <FormDescription>
                            Státní poznávací značka
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Hash className="h-4 w-4" />
                            VIN
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="17 znaků"
                              {...field}
                              maxLength={17}
                              className="uppercase"
                              disabled={loading}
                            />
                          </FormControl>
                          <FormDescription>
                            Identifikační číslo vozidla (volitelné)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="znacka"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            Značka *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Např. Škoda"
                              {...field}
                              maxLength={50}
                              disabled={loading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            Model *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Např. Octavia"
                              {...field}
                              maxLength={50}
                              disabled={loading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rokVyroby"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Rok výroby *
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
                              min={1900}
                              max={new Date().getFullYear() + 1}
                              disabled={loading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stav"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Stav *
                          </FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                            disabled={loading}
                          >
                            <FormControl>
                              <SelectTrigger />
                            </FormControl>
                            <SelectContent>
                              {STATUS_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Specifikace & Pohon */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Fuel className="h-5 w-5" />
                    Specifikace & Pohon
                  </CardTitle>
                  <CardDescription>
                    Typ paliva a technické parametry
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="palivo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Fuel className="h-4 w-4" />
                          Typ paliva
                        </FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || ''}
                          disabled={loading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Vyberte typ paliva" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {FUEL_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Typ paliva nebo pohonu vozidla
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Dynamic Section: Electric Vehicle Fields */}
                  <div 
                    className={cn(
                      "space-y-4 transition-all duration-300",
                      isElectric ? "opacity-100 max-h-[500px]" : "opacity-0 max-h-0 overflow-hidden"
                    )}
                  >
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                        <Battery className="h-4 w-4" />
                        Parametry elektromobilu
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="kapacita_baterie"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Kapacita baterie (kWh) *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Např. 75"
                                  {...field}
                                  onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                  min={0}
                                  max={200}
                                  step="0.1"
                                  disabled={loading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="dojezd"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dojezd (km) *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Např. 500"
                                  {...field}
                                  onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                  min={0}
                                  max={1000}
                                  disabled={loading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Section: Combustion Engine Fields */}
                  <div 
                    className={cn(
                      "space-y-4 transition-all duration-300",
                      isCombustion ? "opacity-100 max-h-[500px]" : "opacity-0 max-h-0 overflow-hidden"
                    )}
                  >
                    <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                      <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-4 flex items-center gap-2">
                        <Gauge className="h-4 w-4" />
                        Parametry spalovacího motoru
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="objem_motoru"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Objem motoru (l) *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Např. 1.6"
                                  {...field}
                                  onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                  min={0}
                                  max={10}
                                  step="0.1"
                                  disabled={loading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="emisni_norma"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Emisní norma</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value || ''}
                                disabled={loading}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Vyberte emisní normu" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {EMISSION_STANDARDS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Provozní stav */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Gauge className="h-5 w-5" />
                    Provozní stav
                  </CardTitle>
                  <CardDescription>
                    Nájezd a technická kontrola
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="najezd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Gauge className="h-4 w-4" />
                            Nájezd (km) *
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                              min={0}
                              disabled={loading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="datumSTK"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            STK platnost do
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value ? (field.value instanceof Date 
                                ? field.value.toISOString().split('T')[0] 
                                : typeof field.value === 'string' 
                                  ? field.value.split('T')[0] 
                                  : '') : ''}
                              disabled={loading}
                            />
                          </FormControl>
                          <FormDescription>
                            Datum platnosti technické kontroly
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="poznamka"
                    render={({ field }) => (
                      <FormItem className="mt-6">
                        <FormLabel>Poznámka</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            maxLength={300}
                            placeholder="Zde můžete napsat poznámku k vozidlu..."
                            className="resize-none min-h-[100px]"
                            value={field.value || ''}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormDescription>
                          {(field.value?.length || 0)}/300 znaků
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Zrušit
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="min-w-[140px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Ukládání...
                    </>
                  ) : (
                    <>
                      {initialData ? 'Uložit změny' : 'Vytvořit vozidlo'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* SPZ Duplicate Error Dialog */}
      <Dialog open={showSpzError} onOpenChange={setShowSpzError}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Duplicitní SPZ</DialogTitle>
            <DialogDescription>
              Vozidlo s touto SPZ již existuje. Zadejte prosím jinou SPZ.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setShowSpzError(false)} autoFocus>
              Zavřít
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default VehicleForm
