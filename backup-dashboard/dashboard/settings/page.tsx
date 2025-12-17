'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Save } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export default function SettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState({
    // System Settings
    systemName: 'Dopravní Systém',
    maintenanceMode: false,
    debugMode: false,
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    notificationEmail: '',
    
    // Display Settings
    theme: 'system',
    language: 'cs',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    
    // Map Settings
    defaultMapCenter: '50.0755,14.4378', // Prague
    defaultZoomLevel: '12',
    showTrafficInfo: true,
    
    // Transport Settings
    maxActiveRoutes: '100',
    routeUpdateInterval: '30',
    gpsTrackingEnabled: true,
    
    // Backup Settings
    autoBackupEnabled: true,
    backupInterval: 'daily',
    backupRetentionDays: '30',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // TODO: Implement API endpoint for saving settings
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulated API call

      toast({
        title: 'Nastavení uloženo',
        description: 'Vaše změny byly úspěšně uloženy.',
      })
    } catch (error) {
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se uložit nastavení.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-4">Přístup odepřen</h1>
        <p>Nemáte oprávnění pro přístup k této stránce.</p>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-6">
      <h1 className="text-3xl font-bold mb-6">Nastavení systému</h1>
      
      <form onSubmit={handleSubmit}>
        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="system">
            <Card>
              <CardHeader className="cursor-pointer">
                <AccordionTrigger>
                  <div>
                    <CardTitle>Systémové nastavení</CardTitle>
                    <CardDescription>
                      Základní konfigurace systému
                    </CardDescription>
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="systemName">Název systému</Label>
                    <Input
                      id="systemName"
                      name="systemName"
                      value={settings.systemName}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Režim údržby</Label>
                      <p className="text-sm text-muted-foreground">
                        Systém bude dostupný pouze pro administrátory
                      </p>
                    </div>
                    <Switch
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) => handleSwitchChange('maintenanceMode', checked)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Debug mód</Label>
                      <p className="text-sm text-muted-foreground">
                        Zobrazí rozšířené informace pro vývojáře
                      </p>
                    </div>
                    <Switch
                      checked={settings.debugMode}
                      onCheckedChange={(checked) => handleSwitchChange('debugMode', checked)}
                      disabled={isLoading}
                    />
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="notifications">
            <Card>
              <CardHeader className="cursor-pointer">
                <AccordionTrigger>
                  <div>
                    <CardTitle>Notifikace</CardTitle>
                    <CardDescription>
                      Nastavení systémových upozornění
                    </CardDescription>
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Emailové notifikace</Label>
                      <p className="text-sm text-muted-foreground">
                        Zasílání důležitých upozornění emailem
                      </p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => handleSwitchChange('emailNotifications', checked)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS notifikace</Label>
                      <p className="text-sm text-muted-foreground">
                        Zasílání kritických upozornění přes SMS
                      </p>
                    </div>
                    <Switch
                      checked={settings.smsNotifications}
                      onCheckedChange={(checked) => handleSwitchChange('smsNotifications', checked)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notificationEmail">Notifikační email</Label>
                    <Input
                      id="notificationEmail"
                      name="notificationEmail"
                      type="email"
                      value={settings.notificationEmail}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      placeholder="admin@example.com"
                    />
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="display">
            <Card>
              <CardHeader className="cursor-pointer">
                <AccordionTrigger>
                  <div>
                    <CardTitle>Zobrazení</CardTitle>
                    <CardDescription>
                      Nastavení vzhledu a formátování
                    </CardDescription>
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Motiv</Label>
                    <Select
                      value={settings.theme}
                      onValueChange={(value) => handleSelectChange('theme', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte motiv" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Světlý</SelectItem>
                        <SelectItem value="dark">Tmavý</SelectItem>
                        <SelectItem value="system">Systémový</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Jazyk</Label>
                    <Select
                      value={settings.language}
                      onValueChange={(value) => handleSelectChange('language', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte jazyk" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cs">Čeština</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Formát data</Label>
                    <Select
                      value={settings.dateFormat}
                      onValueChange={(value) => handleSelectChange('dateFormat', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte formát data" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD.MM.YYYY">DD.MM.YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeFormat">Formát času</Label>
                    <Select
                      value={settings.timeFormat}
                      onValueChange={(value) => handleSelectChange('timeFormat', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte formát času" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">24 hodin</SelectItem>
                        <SelectItem value="12h">12 hodin (AM/PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="map">
            <Card>
              <CardHeader className="cursor-pointer">
                <AccordionTrigger>
                  <div>
                    <CardTitle>Nastavení mapy</CardTitle>
                    <CardDescription>
                      Konfigurace mapových podkladů
                    </CardDescription>
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultMapCenter">Výchozí střed mapy</Label>
                    <Input
                      id="defaultMapCenter"
                      name="defaultMapCenter"
                      value={settings.defaultMapCenter}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      placeholder="50.0755,14.4378"
                    />
                    <p className="text-sm text-muted-foreground">
                      Zadejte souřadnice ve formátu šířka,délka
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultZoomLevel">Výchozí přiblížení</Label>
                    <Input
                      id="defaultZoomLevel"
                      name="defaultZoomLevel"
                      type="number"
                      min="1"
                      max="20"
                      value={settings.defaultZoomLevel}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Zobrazovat dopravní informace</Label>
                      <p className="text-sm text-muted-foreground">
                        Aktuální stav dopravy na mapě
                      </p>
                    </div>
                    <Switch
                      checked={settings.showTrafficInfo}
                      onCheckedChange={(checked) => handleSwitchChange('showTrafficInfo', checked)}
                      disabled={isLoading}
                    />
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="transport">
            <Card>
              <CardHeader className="cursor-pointer">
                <AccordionTrigger>
                  <div>
                    <CardTitle>Nastavení dopravy</CardTitle>
                    <CardDescription>
                      Konfigurace dopravního systému
                    </CardDescription>
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxActiveRoutes">Maximum aktivních tras</Label>
                    <Input
                      id="maxActiveRoutes"
                      name="maxActiveRoutes"
                      type="number"
                      value={settings.maxActiveRoutes}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="routeUpdateInterval">Interval aktualizace tras (sekundy)</Label>
                    <Input
                      id="routeUpdateInterval"
                      name="routeUpdateInterval"
                      type="number"
                      value={settings.routeUpdateInterval}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>GPS sledování</Label>
                      <p className="text-sm text-muted-foreground">
                        Sledování polohy vozidel v reálném čase
                      </p>
                    </div>
                    <Switch
                      checked={settings.gpsTrackingEnabled}
                      onCheckedChange={(checked) => handleSwitchChange('gpsTrackingEnabled', checked)}
                      disabled={isLoading}
                    />
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="backup">
            <Card>
              <CardHeader className="cursor-pointer">
                <AccordionTrigger>
                  <div>
                    <CardTitle>Zálohování</CardTitle>
                    <CardDescription>
                      Nastavení automatického zálohování
                    </CardDescription>
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Automatické zálohování</Label>
                      <p className="text-sm text-muted-foreground">
                        Pravidelné zálohování databáze
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoBackupEnabled}
                      onCheckedChange={(checked) => handleSwitchChange('autoBackupEnabled', checked)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="backupInterval">Interval zálohování</Label>
                    <Select
                      value={settings.backupInterval}
                      onValueChange={(value) => handleSelectChange('backupInterval', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Každou hodinu</SelectItem>
                        <SelectItem value="daily">Denně</SelectItem>
                        <SelectItem value="weekly">Týdně</SelectItem>
                        <SelectItem value="monthly">Měsíčně</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="backupRetentionDays">Doba uchování záloh (dny)</Label>
                    <Input
                      id="backupRetentionDays"
                      name="backupRetentionDays"
                      type="number"
                      value={settings.backupRetentionDays}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>

        <div className="mt-6 flex justify-end">
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
    </div>
  )
} 