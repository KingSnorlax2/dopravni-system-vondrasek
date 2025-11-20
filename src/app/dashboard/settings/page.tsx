'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2, Save, Settings2 } from 'lucide-react'
import { AppSettings, loadSettings, saveSettings } from '@/utils/settings'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

const dateFields: Array<keyof AppSettings> = ['dateFrom', 'dateTo']
const numberFields: Array<keyof AppSettings> = ['itemsPerPage', 'stkWarningDays']

export default function SettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    const field = name as keyof AppSettings

    setSettings((prev) => {
      if (!prev) return prev

      if (dateFields.includes(field)) {
        return {
          ...prev,
          [field]: value || null,
        }
      }

      if (numberFields.includes(field)) {
        return {
          ...prev,
          [field]: Number(value) || 0,
        }
      }

      if (field === 'mileageFrom' || field === 'mileageTo') {
        return {
          ...prev,
          [field]: value || null,
        }
      }

      return {
        ...prev,
        [field]:
          value === '' && (field === 'filterStav' || field === 'filterSTK')
            ? 'vse'
            : value,
      }
    })
  }

  const handleSelectChange = (name: keyof AppSettings, value: string) => {
    setSettings((prev) => (prev ? { ...prev, [name]: value } : prev))
  }

  const handleSwitchChange = (name: keyof AppSettings, checked: boolean) => {
    setSettings((prev) => (prev ? { ...prev, [name]: checked } : prev))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!settings) return

    setIsLoading(true)
    try {
      saveSettings(settings)
      await new Promise((resolve) => setTimeout(resolve, 400))
      toast({
        title: 'Nastavení uloženo',
        description: 'Vaše preference budou použity v celé aplikaci.',
      })
    } catch (error) {
      toast({
        title: 'Chyba',
        description: 'Nastavení se nepodařilo uložit. Zkuste to prosím znovu.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isAdmin = session?.user?.role === 'ADMIN'

  if (!isAdmin) {
    return (
      <div className="container py-6 text-center">
        <h1 className="text-2xl font-semibold">Přístup odepřen</h1>
        <p className="text-muted-foreground">
          Tato sekce je dostupná pouze administrátorům systému.
        </p>
      </div>
    )
  }

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-8 flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Settings2 className="h-4 w-4" />
          Přizpůsobte si vzhled aplikace i výchozí filtry
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Webové nastavení</h1>
        <p className="text-muted-foreground">
          Všechna níže uvedená nastavení se ukládají do vašeho prohlížeče a okamžitě se
          aplikují na tabulky a přehledy v rámci systému.
        </p>
      </div>

      {!settings ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-1/2" />
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Zobrazení tabulek</CardTitle>
                <CardDescription>
                  Jak budou data ve výchozím stavu prezentována.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="itemsPerPage">Počet položek na stránku</Label>
                    <Input
                      id="itemsPerPage"
                      name="itemsPerPage"
                      type="number"
                      min={5}
                      max={100}
                      disabled={isLoading}
                      value={settings.itemsPerPage}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sortOrder">Řazení</Label>
                    <Select
                      value={settings.sortOrder}
                      onValueChange={(value) => handleSelectChange('sortOrder', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="sortOrder">
                        <SelectValue placeholder="Vyberte směr" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Vzestupně</SelectItem>
                        <SelectItem value="desc">Sestupně</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortField">Výchozí sloupec pro řazení</Label>
                  <Select
                    value={settings.sortField}
                    onValueChange={(value) => handleSelectChange('sortField', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="sortField">
                      <SelectValue placeholder="Vyberte sloupec" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spz">SPZ</SelectItem>
                      <SelectItem value="stav">Stav vozidla</SelectItem>
                      <SelectItem value="stk">Platnost STK</SelectItem>
                      <SelectItem value="najeto">Najeté km</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Výchozí filtry</CardTitle>
                <CardDescription>
                  Přednastavené pohledy pro rychlou orientaci.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="filterStav">Stav vozidla</Label>
                    <Select
                      value={settings.filterStav}
                      onValueChange={(value) => handleSelectChange('filterStav', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="filterStav">
                        <SelectValue placeholder="Vyberte stav" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vse">Vše</SelectItem>
                        <SelectItem value="aktivni">Aktivní</SelectItem>
                        <SelectItem value="servis">V servisu</SelectItem>
                        <SelectItem value="odstavene">Odstavené</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="filterSTK">Platnost STK</Label>
                    <Select
                      value={settings.filterSTK}
                      onValueChange={(value) => handleSelectChange('filterSTK', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="filterSTK">
                        <SelectValue placeholder="Vyberte filtr" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vse">Vše</SelectItem>
                        <SelectItem value="platna">Platná</SelectItem>
                        <SelectItem value="expiruje">Blíží se konec</SelectItem>
                        <SelectItem value="po_terminu">Po termínu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dateFrom">Datum od</Label>
                    <Input
                      id="dateFrom"
                      name="dateFrom"
                      type="date"
                      disabled={isLoading}
                      value={settings.dateFrom ?? ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateTo">Datum do</Label>
                    <Input
                      id="dateTo"
                      name="dateTo"
                      type="date"
                      disabled={isLoading}
                      value={settings.dateTo ?? ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="mileageFrom">Najeto od (km)</Label>
                    <Input
                      id="mileageFrom"
                      name="mileageFrom"
                      type="number"
                      min={0}
                      disabled={isLoading}
                      value={settings.mileageFrom ?? ''}
                      onChange={handleInputChange}
                      placeholder="např. 50 000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mileageTo">Najeto do (km)</Label>
                    <Input
                      id="mileageTo"
                      name="mileageTo"
                      type="number"
                      min={0}
                      disabled={isLoading}
                      value={settings.mileageTo ?? ''}
                      onChange={handleInputChange}
                      placeholder="např. 250 000"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Upozornění na STK</CardTitle>
                <CardDescription>
                  E-mailová upozornění na expiraci technické kontroly.
                </CardDescription>
              </div>
              <Badge variant={settings.enableNotifications ? 'default' : 'secondary'}>
                {settings.enableNotifications ? 'Aktivní' : 'Vypnuté'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border bg-slate-50 px-4 py-3">
                <div>
                  <p className="font-medium">Zapnout upozornění</p>
                  <p className="text-sm text-muted-foreground">
                    Upozorníme vás na expirující STK u vozového parku.
                  </p>
                </div>
                <Switch
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) => handleSwitchChange('enableNotifications', checked)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stkWarningDays">Předstih upozornění (dny)</Label>
                <Input
                  id="stkWarningDays"
                  name="stkWarningDays"
                  type="number"
                  min={1}
                  max={120}
                  disabled={isLoading || !settings.enableNotifications}
                  value={settings.stkWarningDays}
                  onChange={handleInputChange}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
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
      )}
    </div>
  )
}

