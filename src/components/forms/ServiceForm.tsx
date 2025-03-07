'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { cs } from 'date-fns/locale'
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
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { toast } from '@/components/ui/use-toast'

// Form schema validation
const serviceFormSchema = z.object({
  datumOpravy: z.date({
    required_error: 'Datum je povinné',
  }),
  typOpravy: z.string({
    required_error: 'Typ opravy je povinný',
  }),
  popis: z.string({
    required_error: 'Popis je povinný',
  }).min(3, {
    message: 'Popis musí mít alespoň 3 znaky',
  }),
  stav: z.string({
    required_error: 'Stav je povinný',
  }),
  cena: z.coerce.number({
    required_error: 'Cena je povinná',
    invalid_type_error: 'Cena musí být číslo',
  }).min(0, {
    message: 'Cena nemůže být záporná',
  }),
  najezdKm: z.coerce.number({
    required_error: 'Nájezd je povinný',
    invalid_type_error: 'Nájezd musí být číslo',
  }).min(0, {
    message: 'Nájezd nemůže být záporný',
  }),
  servis: z.string().optional(),
  poznamka: z.string().optional(),
})

type ServiceFormValues = z.infer<typeof serviceFormSchema>

// Define form props
interface ServiceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  autoId: string
  currentMileage: number
  onSubmit: (data: ServiceFormValues) => void
  initialData?: ServiceFormValues
}

// Service types and statuses for dropdown options
const serviceTypes = [
  { value: 'běžný servis', label: 'Běžný servis' },
  { value: 'oprava', label: 'Oprava' },
  { value: 'výměna oleje', label: 'Výměna oleje' },
  { value: 'výměna filtrů', label: 'Výměna filtrů' },
  { value: 'výměna brzd', label: 'Výměna brzd' },
  { value: 'výměna pneu', label: 'Výměna pneumatik' },
  { value: 'geometrie', label: 'Geometrie' },
  { value: 'diagnostika', label: 'Diagnostika' },
  { value: 'karoserie', label: 'Karoserie' },
  { value: 'lak', label: 'Lakování' },
  { value: 'elektrika', label: 'Elektrika' },
  { value: 'klimatizace', label: 'Klimatizace' },
  { value: 'jiný', label: 'Jiný' },
]

const serviceStatuses = [
  { value: 'dokončeno', label: 'Dokončeno' },
  { value: 'probíhá', label: 'Probíhá' },
  { value: 'plánováno', label: 'Plánováno' },
  { value: 'zrušeno', label: 'Zrušeno' },
]

export function ServiceForm({
  open,
  onOpenChange,
  autoId,
  currentMileage,
  onSubmit,
  initialData,
}: ServiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Default values for the form
  const defaultValues: Partial<ServiceFormValues> = initialData || {
    datumOpravy: new Date(),
    najezdKm: currentMileage,
    stav: 'dokončeno',
  }

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues,
  })

  const handleSubmit = async (values: ServiceFormValues) => {
    setIsSubmitting(true)

    try {
      await onSubmit(values)
      toast({
        title: 'Servis byl úspěšně přidán',
        description: 'Záznam o servisu byl úspěšně uložen',
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting service form:', error)
      toast({
        title: 'Chyba při přidání servisu',
        description: 'Nastala chyba při ukládání záznamu o servisu',
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
          <DialogTitle>{initialData ? 'Upravit záznam o servisu' : 'Přidat nový servis'}</DialogTitle>
          <DialogDescription>
            Vyplňte údaje o provedeném nebo plánovaném servisu
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Service Date */}
              <FormField
                control={form.control}
                name="datumOpravy"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Datum servisu</FormLabel>
                    <Popover>
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
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Service Type */}
              <FormField
                control={form.control}
                name="typOpravy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typ servisu</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Vyberte typ servisu" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {serviceTypes.map((type) => (
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
            </div>

            {/* Service Description */}
            <FormField
              control={form.control}
              name="popis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Popis servisu</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Popište provedené práce a použité díly"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status */}
              <FormField
                control={form.control}
                name="stav"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stav</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Vyberte stav" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {serviceStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Service Provider */}
              <FormField
                control={form.control}
                name="servis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Servis</FormLabel>
                    <FormControl>
                      <Input placeholder="Jméno servisu" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cost */}
              <FormField
                control={form.control}
                name="cena"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cena</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Cena v Kč</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="poznamka"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poznámka</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Volitelná poznámka k servisu"
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