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
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import cs from 'date-fns/locale/cs'

const formSchema = z.object({
  spz: z.string().min(1).max(8),
  znacka: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  rokVyroby: z.number().min(1900).max(new Date().getFullYear()),
  najezd: z.number().min(0),
  stav: z.enum(["aktivní", "servis", "vyřazeno"]),
  datumSTK: z.date().optional(),
  poznamka: z.string().max(300).optional()
})

interface AutoDetailFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData: z.infer<typeof formSchema> & { id: string }
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>
}

export function AutoDetailForm({ open, onOpenChange, initialData, onSubmit }: AutoDetailFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...initialData,
      datumSTK: initialData.datumSTK ? new Date(initialData.datumSTK) : undefined
    }
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
                      <Input placeholder="Zadejte SPZ" {...field} />
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
                  <FormItem>
                    <FormLabel>Datum STK</FormLabel>
                    <Popover>
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
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
              <Button variant="outline" onClick={() => onOpenChange(false)}>
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