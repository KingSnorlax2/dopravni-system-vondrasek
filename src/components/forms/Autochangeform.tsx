"use client"

import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { DatePickerWithPresets } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { cs } from "date-fns/locale"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useTransition, useEffect } from 'react'
import React from 'react'

const autoDetailSchema = z.object({
  spz: z.string().min(7, "SPZ musí mít minimálně 7 znaků").max(8, "SPZ může mít maximálně 8 znaků"),
  znacka: z.string().min(2, "Značka musí mít alespoň 2 znaky").max(50, "Značka může mít maximálně 50 znaků"),
  model: z.string().min(2, "Model musí mít alespoň 2 znaky").max(50, "Model může mít maximálně 50 znaků"),
  rokVyroby: z.number()
    .min(1900, "Rok výroby musí být od roku 1900")
    .max(new Date().getFullYear(), "Rok výroby nemůže být v budoucnosti"),
  najezd: z.number().min(0, "Nájezd nemůže být záporný"),
  stav: z.enum(["aktivní", "servis", "vyřazeno"]),
  datumSTK: z.date().optional(),
  poznamka: z.string().max(300, "Poznámka může mít maximálně 300 znaků").optional()
})

export type AutoDetailValues = z.infer<typeof autoDetailSchema>

interface AutoDetailFormProps {
  open: boolean
  onOpenChangeAction: ((open: boolean) => Promise<void>) | ((open: boolean) => void)
  onSubmit?: (data: AutoDetailValues) => void
  initialData: AutoDetailValues & { id: string }
}

export function AutoDetailForm({ open, onOpenChangeAction, onSubmit, initialData }: AutoDetailFormProps) {
  const [isPending, startTransition] = useTransition()
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false)

  const form = useForm<AutoDetailValues>({
    resolver: zodResolver(autoDetailSchema),
    defaultValues: initialData
  })

  useEffect(() => {
    if (initialData) {
      const formData = {
        ...JSON.parse(JSON.stringify(initialData)),
        datumSTK: initialData.datumSTK ? new Date(initialData.datumSTK) : undefined
      };
      form.reset(formData);
    }
  }, [initialData, form]);

  const handleSubmit = async (data: AutoDetailValues) => {
    try {
      if (onSubmit) {
        await onSubmit(data);
        toast({
          title: "Vozidlo aktualizováno",
          description: "Údaje o vozidle byly úspěšně aktualizovány",
        });
      }
      
      // Safely handle the onOpenChangeAction
      startTransition(() => {
        onOpenChangeAction(false);
      });
    } catch (error) {
      console.error("Error updating vehicle:", error);
      toast({
        title: "Chyba při aktualizaci",
        description: "Nepodařilo se aktualizovat údaje o vozidle",
        variant: "destructive",
      });
    }
  }

  return (
    <Sheet 
      open={open}
      onOpenChange={onOpenChangeAction}
    >
      <SheetContent 
        className="w-full sm:max-w-[540px] h-full flex flex-col"
      >
        <SheetHeader className="mb-4">
          <SheetTitle>Upravit vozidlo</SheetTitle>
          <SheetDescription>
            Upravte údaje o vozidle a klikněte na tlačítko Uložit
          </SheetDescription>
        </SheetHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
            <div className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="spz"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SPZ</FormLabel>
                    <FormControl> 
                      <Input placeholder="Zadejtet SPZ" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      {field.value?.length || 0}/8 znaků
                    </FormDescription>
                  </FormItem>
                )}
              />

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
                        <SelectItem value="aktivní">Aktivní</SelectItem>
                        <SelectItem value="servis">V servisu</SelectItem>
                        <SelectItem value="vyřazeno">Vyřazeno</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="znacka"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Značka</FormLabel>
                  <FormControl>
                    <Input placeholder="Zadejte značku" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    {field.value?.length || 0}/50 znaků
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input placeholder="Zadejte model" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    {field.value?.length || 0}/50 znaků
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rokVyroby"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rok výroby</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="najezd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nájezd (km)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="col-span-2">
              <FormField
                control={form.control}
                name="datumSTK"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-1">
                    <FormLabel>Datum STK</FormLabel>
                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 pr-2 py-2 w-full text-left font-normal flex justify-between items-center border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "d. MMMM yyyy", { locale: cs })
                            ) : (
                              <span>Vyberte datum STK</span>
                            )}
                            <CalendarIcon className="h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white rounded-md shadow-lg border border-gray-200" align="start">
                        <div className="p-2 bg-white rounded-md">
                          <DatePickerWithPresets
                            date={field.value ? new Date(field.value) : undefined}
                            setDate={(date) => {
                              field.onChange(date);
                              if (date) setIsDatePickerOpen(false);
                            }}
                            fromYear={2020}
                            toYear={new Date().getFullYear() + 10}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-2">
              <FormField
                control={form.control}
                name="poznamka"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poznámka</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Zde můžete napsat poznámky k vozidlu..."
                        className="resize-none h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      {field.value?.length || 0}/300 znaků
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-2 flex justify-end gap-2 mt-4">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => {
                  startTransition(() => {
                    onOpenChangeAction(false);
                  });
                }}
              >
                Zrušit
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Ukládám...' : 'Uložit změny'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
} 