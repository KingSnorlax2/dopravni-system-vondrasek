'use client'

import { useState, useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import cs from 'date-fns/locale/cs'
import { CalendarIcon } from 'lucide-react'

import {
  Form,
  FormControl,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CustomDatePicker } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { createRepair, type CreateRepairInput } from '@/app/actions/repairs'
import { toast } from '@/components/ui/use-toast'

// Repair categories
const REPAIR_CATEGORIES = [
  'Běžný servis',
  'Výměna oleje',
  'Pneuservis',
  'STK',
  'Porucha',
  'Ostatní',
] as const

// Zod schema
const repairFormSchema = z.object({
  autoId: z.number().int().positive('Vozidlo je povinné'),
  kategorie: z.string().min(1, 'Kategorie je povinná'),
  popis: z.string().min(1, 'Popis je povinný'),
  datum: z.date({
    required_error: 'Datum je povinné',
  }),
  najezd: z.coerce.number().int().min(0, 'Nájezd nemůže být záporný'),
  poznamka: z.string().optional(),
  cena: z.coerce.number().min(0, 'Cena nemůže být záporná').optional(),
})

type RepairFormValues = z.infer<typeof repairFormSchema>

interface RepairFormProps {
  preselectedCarId?: number
  onSuccess?: () => void
}

interface Car {
  id: number
  spz: string
  znacka: string
  model: string
  najezd: number
}

export function RepairForm({ preselectedCarId, onSuccess }: RepairFormProps) {
  const [isPending, startTransition] = useTransition()
  const [cars, setCars] = useState<Car[]>([])
  const [selectedCar, setSelectedCar] = useState<Car | null>(null)
  const [loadingCars, setLoadingCars] = useState(false)

  const form = useForm<RepairFormValues>({
    resolver: zodResolver(repairFormSchema),
    defaultValues: {
      autoId: preselectedCarId,
      kategorie: '',
      popis: '',
      datum: new Date(),
      najezd: 0,
      poznamka: '',
      cena: undefined,
    },
  })

  // Fetch cars if no preselected car
  useEffect(() => {
    if (!preselectedCarId) {
      fetchCars()
    } else {
      fetchCarDetails(preselectedCarId)
    }
  }, [preselectedCarId])

  // Update najezd when car changes
  useEffect(() => {
    if (selectedCar) {
      form.setValue('najezd', selectedCar.najezd)
    }
  }, [selectedCar, form])

  const fetchCars = async () => {
    setLoadingCars(true)
    try {
      const response = await fetch('/api/auta?showAll=true')
      if (response.ok) {
        const data = await response.json()
        setCars(data)
      }
    } catch (error) {
      console.error('Error fetching cars:', error)
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se načíst seznam vozidel',
        variant: 'destructive',
      })
    } finally {
      setLoadingCars(false)
    }
  }

  const fetchCarDetails = async (carId: number) => {
    try {
      const response = await fetch(`/api/auta/${carId}`)
      if (response.ok) {
        const car = await response.json()
        setSelectedCar({
          id: car.id,
          spz: car.spz,
          znacka: car.znacka,
          model: car.model,
          najezd: car.najezd,
        })
        form.setValue('najezd', car.najezd)
      }
    } catch (error) {
      console.error('Error fetching car details:', error)
    }
  }

  const onSubmit = async (values: RepairFormValues) => {
    startTransition(async () => {
      try {
        const result = await createRepair({
          autoId: values.autoId,
          kategorie: values.kategorie,
          popis: values.popis,
          datum: values.datum,
          najezd: values.najezd,
          poznamka: values.poznamka || null,
          cena: values.cena || null,
        })

        if (result.success) {
          toast({
            title: 'Úspěch',
            description: 'Oprava byla úspěšně vytvořena',
          })
          form.reset()
          if (onSuccess) {
            onSuccess()
          }
        } else {
          toast({
            title: 'Chyba',
            description: result.error || 'Nastala chyba při vytváření opravy',
            variant: 'destructive',
          })
        }
      } catch (error) {
        console.error('Error submitting repair form:', error)
        toast({
          title: 'Chyba',
          description: 'Nastala chyba při vytváření opravy',
          variant: 'destructive',
        })
      }
    })
  }

  const handleCarChange = (carId: string) => {
    const car = cars.find((c) => c.id === Number(carId))
    if (car) {
      setSelectedCar(car)
      form.setValue('autoId', car.id)
      form.setValue('najezd', car.najezd)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Car Selection - only show if no preselected car */}
        {!preselectedCarId && (
          <FormField
            control={form.control}
            name="autoId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vozidlo</FormLabel>
                <Select
                  value={field.value?.toString()}
                  onValueChange={handleCarChange}
                  disabled={loadingCars}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte vozidlo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cars.map((car) => (
                      <SelectItem key={car.id} value={car.id.toString()}>
                        {car.spz} - {car.znacka} {car.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Kategorie */}
        <FormField
          control={form.control}
          name="kategorie"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kategorie</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte kategorii" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {REPAIR_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Popis */}
        <FormField
          control={form.control}
          name="popis"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Popis</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Co se opravovalo"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nájezd */}
        <FormField
          control={form.control}
          name="najezd"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nájezd (km)
                {selectedCar && (
                  <span className="text-muted-foreground ml-2 text-sm font-normal">
                    Aktuální: {selectedCar.najezd.toLocaleString('cs-CZ')} km
                  </span>
                )}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Zadejte nájezd"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Datum */}
        <FormField
          control={form.control}
          name="datum"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Datum</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP', { locale: cs })
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
                    onChange={field.onChange}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Poznámka */}
        <FormField
          control={form.control}
          name="poznamka"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Poznámka (volitelné)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Další poznámky"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cena */}
        <FormField
          control={form.control}
          name="cena"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cena (volitelné)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Zadejte cenu"
                  {...field}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Ukládání...' : 'Uložit'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
