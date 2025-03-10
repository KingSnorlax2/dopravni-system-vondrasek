'use client'

import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { Checkbox } from '@/components/ui/checkbox'

// Updated schema without manual typ selection
const transactionSchema = z.object({
  datum: z.string().min(1, { message: 'Datum je povinné' }),
  popis: z.string().min(1, { message: 'Popis je povinný' }),
  castka: z.coerce.number().refine(value => value !== 0, {
    message: 'Částka nesmí být nula',
  }),
  kategorie: z.string().min(1, { message: 'Kategorie je povinná' }),
  poznamka: z.string().optional(),
  vztahKVozidlu: z.boolean().default(false),
  idVozidla: z.string().optional(),
})

type TransactionFormValues = z.infer<typeof transactionSchema>

// Combined categories list
const ALL_CATEGORIES = [
  'Prodej vozidla',
  'Pronájem vozidla',
  'Pojistné plnění',
  'Dotace',
  'Ostatní příjem',
  'Nákup vozidla',
  'Palivo',
  'Oprava',
  'Údržba',
  'Pojištění',
  'Silniční daň',
  'Dálniční známka',
  'Parkovné',
  'STK',
  'Mytí vozidla',
  'Ostatní výdaj'
]

interface TransactionFormProps {
  open: boolean
  onOpenChangeClientAction: (open: boolean) => Promise<void>
  onSubmitAction: (data: TransactionFormValues) => Promise<void>
  initialData?: TransactionFormValues
}

export function TransactionForm({
  open,
  onOpenChangeClientAction,
  onSubmitAction,
  initialData,
}: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showVehicleSelection, setShowVehicleSelection] = useState(
    initialData?.vztahKVozidlu || false
  )
  const [vehicles, setVehicles] = useState<any[]>([])

  // Fetch vehicles when form opens
  useEffect(() => {
    if (open) {
      fetchVehicles()
    }
  }, [open])

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/auta')
      if (response.ok) {
        const data = await response.json()
        setVehicles(data)
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    }
  }

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0]

  // Default values for the form
  const defaultValues: Partial<TransactionFormValues> = initialData || {
    datum: today,
    popis: '',
    castka: undefined,
    kategorie: '',
    poznamka: '',
    vztahKVozidlu: false,
    idVozidla: '',
  }

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues,
  })

  const handleSubmit = async (values: TransactionFormValues) => {
    setIsSubmitting(true)
    try {
      if (!values.vztahKVozidlu) {
        values.idVozidla = undefined
      }
      
      // Determine type based on amount with correct diacritics
      const submitData = {
        ...values,
        typ: values.castka > 0 ? 'příjem' : 'výdaj'
      }
      
      await onSubmitAction(submitData)
      form.reset(defaultValues)
      await onOpenChangeClientAction(false)
    } catch (error) {
      console.error('Error creating transaction:', error)
      toast({
        title: 'Chyba při vytváření transakce',
        description: error instanceof Error ? error.message : 'Nastala neočekávaná chyba',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = async (open: boolean) => {
    if (!open && !isSubmitting) {
      form.reset(defaultValues)
    }
    await onOpenChangeClientAction(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Upravit transakci' : 'Přidat novou transakci'}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Upravte údaje o existující transakci'
              : 'Vyplňte detaily nové transakce'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="datum"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Datum</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="castka"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Částka (Kč)</FormLabel>
                    <FormDescription>
                      Použijte kladné hodnoty pro příjmy, záporné pro výdaje
                    </FormDescription>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseFloat(e.target.value)
                          field.onChange(value)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="popis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Popis</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Zadejte popis transakce" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="kategorie"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategorie</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte kategorii" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_CATEGORIES.map((category) => (
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

            <FormField
              control={form.control}
              name="vztahKVozidlu"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked)
                        setShowVehicleSelection(!!checked)
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Vztahuje se k vozidlu</FormLabel>
                    <FormDescription>
                      Označte, pokud se transakce týká konkrétního vozidla
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {showVehicleSelection && (
              <FormField
                control={form.control}
                name="idVozidla"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vozidlo</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte vozidlo" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={String(vehicle.id)}>
                            {vehicle.spz} - {vehicle.znacka} {vehicle.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="poznamka"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poznámka</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Zadejte další poznámky k transakci"
                      className="resize-none"
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
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Zrušit
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                )}
                {initialData ? 'Uložit změny' : 'Vytvořit transakci'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 