'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from "date-fns"
import cs from 'date-fns/locale/cs'
import { CalendarIcon } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CustomDatePicker } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/components/ui/use-toast'

// Form schema validation
const maintenanceFormSchema = z.object({
  typ: z.string({
    required_error: 'Typ údržby je povinný',
  }),
  popis: z.string({
    required_error: 'Popis je povinný',
  }).min(3, {
    message: 'Popis musí mít alespoň 3 znaky',
  }),
  datumProvedeni: z.date({
    required_error: 'Datum provedení je povinné',
  }),
  datumPristi: z.date().optional(),
  najezdKm: z.coerce.number({
    required_error: 'Nájezd je povinný',
    invalid_type_error: 'Nájezd musí být číslo',
  }).min(0, {
    message: 'Nájezd nemůže být záporný',
  }),
  nakladyCelkem: z.coerce.number({
    required_error: 'Náklady jsou povinné',
    invalid_type_error: 'Náklady musí být číslo',
  }).min(0, {
    message: 'Náklady nemůžou být záporné',
  }),
  provedeno: z.boolean().default(false),
  dokumenty: z.string().optional(),
  poznamka: z.string().optional(),
})

type MaintenanceFormValues = z.infer<typeof maintenanceFormSchema>

// Define form props
interface MaintenanceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  autoId: string
  currentMileage: number
  onSubmit: (data: MaintenanceFormValues) => void
  initialData?: MaintenanceFormValues
}

// Maintenance types for dropdown options
const maintenanceTypes = [
  { value: 'pravidelný servis', label: 'Pravidelný servis' },
  { value: 'výměna oleje', label: 'Výměna oleje' },
  { value: 'výměna filtrů', label: 'Výměna filtrů' },
  { value: 'výměna brzdových destiček', label: 'Výměna brzdových destiček' },
  { value: 'výměna brzdových kotoučů', label: 'Výměna brzdových kotoučů' },
  { value: 'výměna rozvodů', label: 'Výměna rozvodů' },
  { value: 'výměna kapalin', label: 'Výměna kapalin' },
  { value: 'výměna pneumatik', label: 'Výměna pneumatik' },
  { value: 'kontrola geometrie', label: 'Kontrola geometrie' },
  { value: 'kontrola klimatizace', label: 'Kontrola klimatizace' },
  { value: 'STK', label: 'STK' },
  { value: 'emise', label: 'Emise' },
  { value: 'jiný', label: 'Jiný' },
]

export function MaintenanceForm({
  open,
  onOpenChange,
  autoId,
  currentMileage,
  onSubmit,
  initialData,
}: MaintenanceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open1, setOpen1] = useState(false)
  const [open2, setOpen2] = useState(false)

  // Default values for the form
  const defaultValues: Partial<MaintenanceFormValues> = initialData || {
    datumProvedeni: new Date(),
    najezdKm: currentMileage,
    nakladyCelkem: 0,
    provedeno: false,
  }

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues,
  })

  const handleSubmit = async (values: MaintenanceFormValues) => {
    setIsSubmitting(true)

    try {
      await onSubmit(values)
      toast({
        title: 'Údržba byla úspěšně přidána',
        description: 'Záznam o údržbě byl úspěšně uložen',
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting maintenance form:', error)
      toast({
        title: 'Chyba při přidání údržby',
        description: 'Nastala chyba při ukládání záznamu o údržbě',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Upravit záznam o údržbě' : 'Naplánovat údržbu'}</DialogTitle>
          <DialogDescription>
            Vyplňte údaje o provedené nebo plánované údržbě vozidla
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Maintenance Type */}
              <FormField
                control={form.control}
                name="typ"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typ údržby</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Vyberte typ údržby" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {maintenanceTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Completion Date */}
              <FormField
                control={form.control}
                name="datumProvedeni"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Datum provedení</FormLabel>
                    <Popover open={open1} onOpenChange={setOpen1}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, 'P', { locale: cs })
                            ) : (
                              <span>Vyberte datum</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CustomDatePicker
                          value={field.value}
                          onChange={(date) => {
                            field.onChange(date);
                            if (date) setOpen1(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Maintenance Description */}
            <FormField
              control={form.control}
              name="popis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Popis údržby</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Popište prováděnou údržbu"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Next Date */}
              <FormField
                control={form.control}
                name="datumPristi"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Příští datum (volitelné)</FormLabel>
                    <Popover open={open2} onOpenChange={setOpen2}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, 'P', { locale: cs })
                            ) : (
                              <span>Vyberte datum</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CustomDatePicker
                          value={field.value || undefined}
                          onChange={(date) => {
                            field.onChange(date);
                            if (date) setOpen2(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Kdy by měla být údržba provedena příště
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Completed Status */}
              <FormField
                control={form.control}
                name="provedeno"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-8">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Údržba dokončena</FormLabel>
                      <FormDescription>
                        Označte, pokud již byla údržba provedena
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mileage */}
              <FormField
                control={form.control}
                name="najezdKm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nájezd</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Aktuální nájezd v km</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cost */}
              <FormField
                control={form.control}
                name="nakladyCelkem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Náklady</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Náklady v Kč</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Documents */}
            <FormField
              control={form.control}
              name="dokumenty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dokumenty (volitelné)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Odkaz na dokumenty"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Odkaz na dokumenty nebo faktury spojené s údržbou
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="poznamka"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poznámka (volitelná)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Dodatečné informace o údržbě"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Zrušit
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Ukládání...' : initialData ? 'Aktualizovat' : 'Přidat'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 