"use client"

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from "@/components/ui/button"
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTransition } from 'react'

const autoSchema = z.object({
  spz: z.string().min(7, "SPZ musí mít minimálně 7 znaků").max(8, "SPZ může mít maximálně 8 znaků"),
  znacka: z.string().min(2, "Značka musí mít alespoň 2 znaky").max(20, "Značka může mít maximálně 20 znaků"),
  model: z.string().min(1, "Model je povinný").max(20, "Model může mít maximálně 20 znaků"),
  rokVyroby: z.number()
    .min(1900, "Rok výroby musí být od roku 1900")
    .max(new Date().getFullYear(), "Rok výroby nemůže být v budoucnosti"),
  najezd: z.number().min(0, "Nájezd nemůže být záporný"),
  stav: z.enum(["aktivní", "servis", "vyřazeno"]),
  poznamka: z.string().max(300, "Poznámka může mít maximálně 300 znaků").optional().or(z.literal('')),
  datumSTK: z.string().optional().or(z.literal(''))
})

type AutoFormData = z.infer<typeof autoSchema>

interface AutoFormProps {
  open: boolean
  onOpenChangeClientAction: (open: boolean) => Promise<void>
  onSubmit?: (data: AutoFormData) => void
  initialData?: Partial<AutoFormData> & { id?: string }
}

const STATUS_OPTIONS = [
  { value: "aktivní", label: "Aktivní" },
  { value: "servis", label: "V servisu" },
  { value: "vyřazeno", label: "Vyřazeno" }
];

export function AutoForm({ open, onOpenChangeClientAction, onSubmit, initialData }: AutoFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSpzError, setShowSpzError] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<AutoFormData>({
    resolver: zodResolver(autoSchema),
    defaultValues: {
      spz: initialData?.spz || '',
      znacka: initialData?.znacka || '',
      model: initialData?.model || '',
      rokVyroby: initialData?.rokVyroby || new Date().getFullYear(),
      najezd: initialData?.najezd || 0,
      stav: initialData?.stav || 'aktivní',
      poznamka: initialData?.poznamka || '',
      datumSTK: initialData?.datumSTK || ''
    }
  })

  const checkSPZExists = async (spz: string, excludeId?: string): Promise<boolean> => {
    try {
      let url = `/api/auta/check-spz?spz=${encodeURIComponent(spz)}`;
      if (excludeId) {
        url += `&excludeId=${encodeURIComponent(excludeId)}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error('Error checking SPZ:', error);
      return false;
    }
  };

  const handleSubmit = async (data: AutoFormData) => {
    setLoading(true)
    setError(null)
    try {
      if (!initialData || (initialData && initialData.spz !== data.spz)) {
        const exists = await checkSPZExists(data.spz, initialData?.id);
        if (exists) {
          setShowSpzError(true);
          setLoading(false);
          return;
        }
      }

      const submitData = {
        ...data,
        rokVyroby: Number(data.rokVyroby),
        najezd: Number(data.najezd),
        poznamka: data.poznamka || '',
        datumSTK: data.datumSTK || null
      }

      const url = initialData ? `/api/auta/${initialData.id}` : '/api/auta';
      const response = await fetch(url, {
        method: initialData ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        throw new Error('Nastala chyba při vytváření/úpravě vozidla');
      }

      if (onSubmit) {
        await onSubmit(await response.json());
      }

      form.reset();
      handleClose();
    } catch (error: any) {
      setError(error.message || 'Nastala chyba při vytváření/úpravě vozidla');
    } finally {
      setLoading(false);
    }
  }

  const handleClose = () => {
    startTransition(() => {
      onOpenChangeClientAction(false)
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => startTransition(() => onOpenChangeClientAction(isOpen))}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Přidat nové vozidlo</DialogTitle>
            <DialogDescription>Vyplňte údaje o novém vozidle</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <FormField
                  control={form.control}
                  name="spz"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm mb-2">SPZ</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Zadejte SPZ"
                          {...field}
                          maxLength={8}
                          className="text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="znacka"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm mb-2">Značka</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Zadejte značku"
                          {...field}
                          maxLength={20}
                          className="text-sm"
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
                      <FormLabel className="text-sm mb-2">Model</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Zadejte model"
                          {...field}
                          maxLength={20}
                          className="text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3">
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="rokVyroby"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm mb-2">Rok výroby</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
                              className="text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="najezd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm mb-2">Nájezd (km)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                              className="text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="stav"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm mb-2">Stav</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-sm" />
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

                <div className="flex gap-3">
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="datumSTK"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm mb-2">Datum STK</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value || ''}
                              className="text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="poznamka"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm mb-2">Poznámka</FormLabel>
                          <FormControl>
                            <textarea
                              {...field}
                              maxLength={300}
                              className="w-full border rounded px-2 py-1 min-h-[60px] text-sm"
                              placeholder="Zde můžete napsat poznámku k vozidlu..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Zrušit
                </Button>
                <Button type="submit" disabled={loading}>
                  {initialData ? 'Aktualizovat' : 'Přidat'}
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

export default AutoForm;