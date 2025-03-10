"use client";

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { loadSettings, saveSettings, AppSettings } from '@/utils/settings'

const settingsSchema = z.object({
  itemsPerPage: z.preprocess(
    (val) => parseInt(String(val), 10),
    z.number().min(5).max(100)
  ),
  sortField: z.string(),
  sortOrder: z.enum(['asc', 'desc']),
  defaultFilterStav: z.string(),
  defaultFilterSTK: z.string(),
  enableNotifications: z.boolean().default(true),
  stkWarningDays: z.preprocess(
    (val) => parseInt(String(val), 10),
    z.number().min(1).max(90)
  ),
});

type SettingsFormValues = z.infer<typeof settingsSchema>

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      itemsPerPage: 10,
      sortField: 'spz',
      sortOrder: 'asc',
      defaultFilterStav: 'vse',
      defaultFilterSTK: 'vse',
      enableNotifications: true,
      stkWarningDays: 30,
    }
  })
  
  useEffect(() => {
    const settings = loadSettings()
    form.reset({
      itemsPerPage: settings.itemsPerPage || 10,
      sortField: settings.sortField || 'spz',
      sortOrder: settings.sortOrder || 'asc',
      defaultFilterStav: settings.filterStav || 'vse',
      defaultFilterSTK: settings.filterSTK || 'vse',
      enableNotifications: settings.enableNotifications !== false,
      stkWarningDays: settings.stkWarningDays || 30,
    })
    setIsLoading(false)
  }, [form])
  
  const onSubmit = (data: SettingsFormValues) => {
    try {
      saveSettings({
        itemsPerPage: data.itemsPerPage,
        sortField: data.sortField,
        sortOrder: data.sortOrder,
        filterStav: data.defaultFilterStav,
        filterSTK: data.defaultFilterSTK,
        enableNotifications: data.enableNotifications,
        stkWarningDays: data.stkWarningDays,
      })
      
      toast({
        title: "Nastavení uloženo",
        description: "Vaše nastavení bylo úspěšně uloženo.",
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "Chyba při ukládání",
        description: "Nepodařilo se uložit nastavení.",
        variant: "destructive",
      })
    }
  }
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Načítání...</div>
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Nastavení aplikace</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Obecná nastavení</CardTitle>
            <CardDescription>
              Upravte základní nastavení zobrazení a fungování aplikace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="itemsPerPage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Počet položek na stránku</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Vyberte počet položek" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Kolik vozidel se zobrazí na jedné stránce tabulky
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="sortField"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Výchozí řazení podle</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Vyberte pole pro řazení" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="spz">SPZ</SelectItem>
                            <SelectItem value="znacka">Značka</SelectItem>
                            <SelectItem value="model">Model</SelectItem>
                            <SelectItem value="rokVyroby">Rok výroby</SelectItem>
                            <SelectItem value="najezd">Nájezd</SelectItem>
                            <SelectItem value="stav">Stav</SelectItem>
                            <SelectItem value="datumSTK">Datum STK</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Směr řazení</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Vyberte směr řazení" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="asc">Vzestupně</SelectItem>
                            <SelectItem value="desc">Sestupně</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="stkWarningDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Upozornění na STK (dny)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} min={1} max={90} />
                        </FormControl>
                        <FormDescription>
                          Kolik dní předem upozornit na blížící se STK
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="enableNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Povolit upozornění
                        </FormLabel>
                        <FormDescription>
                          Zobrazovat upozornění na blížící se STK a další události
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <Button type="submit">Uložit nastavení</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 