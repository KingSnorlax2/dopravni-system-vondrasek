'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Building2, Mail, Shield, Loader2, Save } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  systemSettingsSchema,
  type SystemSettings,
} from '@/features/settings/validations'
import { updateSystemSettings } from '@/features/settings/actions'

interface ServerSettingsClientProps {
  initialData: SystemSettings
}

export default function ServerSettingsClient({
  initialData,
}: ServerSettingsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<SystemSettings>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      maintenanceMode: initialData.maintenanceMode ?? false,
      defaultPageSize: initialData.defaultPageSize ?? 10,
      stkWarningDays: initialData.stkWarningDays ?? 30,
      smtpHost: initialData.smtpHost ?? '',
      allowDriverLogin: initialData.allowDriverLogin ?? true,
    },
  })

  const onSubmit = (data: SystemSettings) => {
    startTransition(async () => {
      const result = await updateSystemSettings(data)
      if (result.success) {
        toast.success('Nastavení bylo úspěšně uloženo.')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Nepodařilo se uložit nastavení.')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nastavení systému</CardTitle>
        <CardDescription>
          Globální konfigurace aplikace (uloženo na serveru)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">
                  <Building2 className="mr-2 h-4 w-4" />
                  Obecné
                </TabsTrigger>
                <TabsTrigger value="email">
                  <Mail className="mr-2 h-4 w-4" />
                  E-mail
                </TabsTrigger>
                <TabsTrigger value="security">
                  <Shield className="mr-2 h-4 w-4" />
                  Zabezpečení
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-6 mt-6">
                <FormField
                  control={form.control}
                  name="maintenanceMode"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Režim údržby
                        </FormLabel>
                        <FormDescription>
                          Zapne údržbový režim – aplikace může zobrazit informační stránku místo běžného obsahu
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
                <FormField
                  control={form.control}
                  name="defaultPageSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Výchozí počet položek na stránku</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(Number(v))}
                        value={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte počet" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Kolik položek se zobrazí v tabulkách na jedné stránce
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stkWarningDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upozornění na STK (dny dopředu)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={90}
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value) || 30)}
                        />
                      </FormControl>
                      <FormDescription>
                        Kolik dní předem upozornit na blížící se STK
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="email" className="space-y-6 mt-6">
                <FormField
                  control={form.control}
                  name="smtpHost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP host</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="smtp.example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Adresa SMTP serveru pro odesílání e-mailů
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="security" className="space-y-6 mt-6">
                <FormField
                  control={form.control}
                  name="allowDriverLogin"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Povolit přihlášení řidičů
                        </FormLabel>
                        <FormDescription>
                          Když je vypnuto, řidiči se nemohou přihlásit přes stránku přihlášení řidičů
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
              </TabsContent>
            </Tabs>

            <div className="pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ukládám...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Uložit nastavení
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
