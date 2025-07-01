"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import cs from 'date-fns/locale/cs'
import React from "react"
import { CustomDatePicker } from "@/components/ui/calendar"

const formSchema = z.object({
  spz: z.string().min(1, "SPZ je povinná").max(8, "SPZ může mít maximálně 8 znaků"),
  znacka: z.string().min(1, "Značka je povinná").max(50, "Značka může mít maximálně 50 znaků"),
  model: z.string().min(1, "Model je povinný").max(50, "Model může mít maximálně 50 znaků"),
  rokVyroby: z.number().min(1900, "Rok výroby musí být od 1900").max(new Date().getFullYear(), "Rok výroby nemůže být v budoucnosti"),
  najezd: z.number().min(0, "Nájezd nemůže být záporný"),
  stav: z.enum(["aktivní", "servis", "vyřazeno"]),
  datumSTK: z.date().optional(),
  poznamka: z.string().max(300, "Poznámka může mít maximálně 300 znaků").optional()
})

interface AutoDetailFormProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  initialData: z.infer<typeof formSchema> & { id: string }
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>
}

export function AutoDetailForm({
  open,
  onOpenChangeAction = () => {},
  initialData,
  onSubmit
}: AutoDetailFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...initialData,
      datumSTK: initialData.datumSTK ? new Date(initialData.datumSTK) : undefined
    }
  })

  const [popoverOpen, setPopoverOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChangeAction}>
      <SheetContent className="w-full sm:max-w-[540px] h-full flex flex-col">
        <SheetHeader className="mb-4">
          <SheetTitle>Upravit vozidlo</SheetTitle>
        </SheetHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2">
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="spz"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SPZ</FormLabel>
                    <FormControl>
                      <Input placeholder="Zadejte SPZ" {...field} maxLength={8} value={field.value || ''} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      {field.value?.length || 0}/8 znaků
                    </FormDescription>
                    <FormMessage />
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
                    <FormMessage />
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
                  <FormMessage />
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
                  <FormMessage />
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
                      onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
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
                      onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="col-span-2">
              <FormField
                control={form.control}
                name="datumSTK"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Datum STK</FormLabel>
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd.MM.yyyy")
                            ) : (
                              <span>dd.mm.rrrr</span>
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
                            if (date) setPopoverOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
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
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      {field.value?.length || 0}/300 znaků
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-2 flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => onOpenChangeAction(false)} type="button">
                Zrušit
              </Button>
              <Button type="submit">
                Aktualizovat
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}