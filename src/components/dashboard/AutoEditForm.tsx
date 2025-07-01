import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Auto } from '@prisma/client';
import { useEffect } from 'react';
import React from 'react';
import { CustomDatePicker } from '@/components/ui/calendar';

const formSchema = z.object({
  spz: z.string().min(1, "SPZ je povinná").max(8, "SPZ může mít maximálně 8 znaků"),
  znacka: z.string().min(1, "Značka je povinná").max(50, "Značka může mít maximálně 50 znaků"),
  model: z.string().min(1, "Model je povinný").max(50, "Model může mít maximálně 50 znaků"),
  rokVyroby: z.number().min(1900, "Rok výroby musí být po roce 1900").max(new Date().getFullYear(), "Rok výroby nemůže být v budoucnosti"),
  najezd: z.number().min(0, "Nájezd nemůže být záporný"),
  stav: z.enum(["aktivní", "servis", "vyřazeno"] as const),
  datumSTK: z.date().optional(),
  poznamka: z.string().max(300, "Poznámka může mít maximálně 300 znaků").optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AutoEditForm({ auto, onSubmit, onCancel }: { 
  auto: Auto, 
  onSubmit: (data: FormValues) => void,
  onCancel: () => void 
}) {
  // Helper function to parse the date properly
  const parseDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date;
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      spz: auto.spz || '',
      znacka: auto.znacka || '',
      model: auto.model || '',
      rokVyroby: auto.rokVyroby || new Date().getFullYear(),
      najezd: auto.najezd || 0,
      stav: (auto.stav as "aktivní" | "servis" | "vyřazeno") || 'aktivní',
      datumSTK: parseDate(auto.datumSTK),
      poznamka: auto.poznamka || '',
    }
  });

  // Reset form when auto prop changes
  useEffect(() => {
    console.log("Auto data changed, resetting form:", auto);
    form.reset({
      spz: auto.spz || '',
      znacka: auto.znacka || '',
      model: auto.model || '',
      rokVyroby: auto.rokVyroby || new Date().getFullYear(),
      najezd: auto.najezd || 0,
      stav: (auto.stav as "aktivní" | "servis" | "vyřazeno") || 'aktivní',
      datumSTK: parseDate(auto.datumSTK),
      poznamka: auto.poznamka || '',
    });
  }, [auto, form]);

  const [open, setOpen] = React.useState(false);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="spz"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SPZ</FormLabel>
                <FormControl>
                  <Input placeholder="Zadejte SPZ" {...field} maxLength={8} />
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

        <div className="grid grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="znacka"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Značka</FormLabel>
                <FormControl>
                  <Input placeholder="Zadejte značku" {...field} maxLength={50} />
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
                  <Input placeholder="Zadejte model" {...field} maxLength={50} />
                </FormControl>
                <FormDescription className="text-xs">
                  {field.value?.length || 0}/50 znaků
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="rokVyroby"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rok výroby</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Zadejte rok výroby" 
                    {...field} 
                    onChange={e => field.onChange(parseInt(e.target.value) || new Date().getFullYear())}
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
                    placeholder="Zadejte nájezd" 
                    {...field} 
                    onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="datumSTK"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Datum STK</FormLabel>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "dd.MM.yyyy", { locale: cs })
                      ) : (
                        <span>Vyberte datum STK</span>
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
                      if (date) setOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="poznamka"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Poznámka</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Zde můžete napsat poznámky k vozidlu..." 
                  {...field} 
                  maxLength={300}
                />
              </FormControl>
              <FormDescription className="text-xs">
                {field.value?.length || 0}/300 znaků
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Zrušit
          </Button>
          <Button type="submit">
            Uložit změny
          </Button>
        </div>
      </form>
    </Form>
  );
} 