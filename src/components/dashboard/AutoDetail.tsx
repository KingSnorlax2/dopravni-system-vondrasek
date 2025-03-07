"use client"

import { Button } from "@/components/ui/button"
import { QRCodeSVG } from "qrcode.react"
import { 
  ArrowLeft, 
  Camera, 
  X, 
  CalendarCheck, 
  Wrench,
  Clock, 
  Plus, 
  FileText,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { AutoDetailForm } from "@/components/forms/AutoDetailForm"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { cs } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { ServiceForm } from '@/components/forms/ServiceForm'
import { MaintenanceForm } from '@/components/forms/MaintenanceForm'

interface AutoDetailProps {
  auto: {
    id: string
    spz: string
    znacka: string
    model: string
    rokVyroby: number
    najezd: number
    stav: string
    datumSTK?: string
    fotky?: Array<{
      id: string
      url: string
    }>
  }
}

// Intentionally empty for initial state - will be fetched from API endpoints
interface ServiceRecord {
  id: string
  date: Date
  description: string
  cost: number
  type: string
  status: string
  service?: string
  mileage: number
  note?: string
}

// Intentionally empty for initial state - will be fetched from API endpoints
interface MaintenanceRecord {
  id: string
  type: string
  description: string
  completionDate: Date
  nextDate?: Date
  mileage: number
  cost: number
  completed: boolean
  documents?: string
  note?: string
}

export function AutoDetail({ auto }: AutoDetailProps) {
  const router = useRouter()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [qrUrl, setQrUrl] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([])
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false)
  const [isAddMaintenanceModalOpen, setIsAddMaintenanceModalOpen] = useState(false)

  // fetch service records
  useEffect(() => {
    const fetchServiceRecords = async () => {
      try {
        const response = await fetch(`/api/auta/${auto.id}/opravy`)
        
        if (!response.ok) throw new Error('Failed to fetch service records')
        
        const data = await response.json()
        setServiceRecords(data.map((record: any) => ({
          ...record,
          date: new Date(record.datumOpravy),
          cost: record.cena,
          description: record.popis,
          type: record.typOpravy,
          status: record.stav,
          mileage: record.najezdKm || auto.najezd,
          note: record.poznamka
        })))
      } catch (error) {
        console.error('Error fetching service records:', error)
      }
    }

    // fetch maintenance records
    const fetchMaintenanceRecords = async () => {
      try {
        const response = await fetch(`/api/auta/${auto.id}/udrzba`)
        
        if (!response.ok) throw new Error('Failed to fetch maintenance records')
        
        const data = await response.json()
        setMaintenanceRecords(data.map((record: any) => ({
          ...record,
          completionDate: new Date(record.datumProvedeni),
          nextDate: record.datumPristi ? new Date(record.datumPristi) : undefined,
          mileage: record.najezdKm,
          cost: record.nakladyCelkem,
          completed: record.provedeno,
          description: record.popis
        })))
      } catch (error) {
        console.error('Error fetching maintenance records:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchServiceRecords()
    fetchMaintenanceRecords()
  }, [auto.id, auto.najezd])

  const handleEdit = async (data: any) => {
    try {
      const response = await fetch(`/api/auta/${auto.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) throw new Error('Failed to update')
      window.location.reload()
    } catch (error) {
      console.error('Update failed:', error)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return

    setIsUploading(true)
    const file = e.target.files[0]
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`/api/auta/${auto.id}/fotky`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')
      window.location.reload()
    } catch (error) {
      console.error('Photo upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const response = await fetch(`/api/auta/${auto.id}/fotky/${photoId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Delete failed')
      window.location.reload()
    } catch (error) {
      console.error('Photo delete failed:', error)
    }
  }

  // Handle adding new service record
  const handleAddService = () => {
    setIsAddServiceModalOpen(true)
  }

  // Handle adding new maintenance record
  const handleAddMaintenance = () => {
    setIsAddMaintenanceModalOpen(true)
  }

  useEffect(() => {
    setQrUrl(`${window.location.origin}/dashboard/auta/${auto.id}`)
  }, [auto.id])

  // Sort records by date (newest first)
  const sortedServiceRecords = [...serviceRecords].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const sortedMaintenanceRecords = [...maintenanceRecords].sort((a, b) => 
    new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime()
  )

  // Get upcoming maintenance
  const upcomingMaintenance = maintenanceRecords
    .filter(record => !record.completed && record.nextDate && new Date(record.nextDate) > new Date())
    .sort((a, b) => new Date(a.nextDate!).getTime() - new Date(b.nextDate!).getTime())

  // Calculate days until next STK
  const daysUntilSTK = auto.datumSTK 
    ? Math.ceil((new Date(auto.datumSTK).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  // Handle submitting a new service record
  const handleServiceSubmit = async (data: any) => {
    try {
      const response = await fetch(`/api/auta/${auto.id}/opravy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) throw new Error('Failed to create service record')
      
      // Refresh the data
      const newServiceRecords = await fetch(`/api/auta/${auto.id}/opravy`).then(res => res.json())
      setServiceRecords(newServiceRecords.map((record: any) => ({
        ...record,
        date: new Date(record.datumOpravy),
        cost: record.cena,
        description: record.popis,
        type: record.typOpravy,
        status: record.stav,
        mileage: record.najezdKm,
        note: record.poznamka
      })))
      
      setIsAddServiceModalOpen(false)
    } catch (error) {
      console.error('Error creating service record:', error)
    }
  }

  // Handle submitting a new maintenance record
  const handleMaintenanceSubmit = async (data: any) => {
    try {
      const response = await fetch(`/api/auta/${auto.id}/udrzba`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) throw new Error('Failed to create maintenance record')
      
      // Refresh the data
      const newMaintenanceRecords = await fetch(`/api/auta/${auto.id}/udrzba`).then(res => res.json())
      setMaintenanceRecords(newMaintenanceRecords.map((record: any) => ({
        ...record,
        completionDate: new Date(record.datumProvedeni),
        nextDate: record.datumPristi ? new Date(record.datumPristi) : undefined,
        mileage: record.najezdKm,
        cost: record.nakladyCelkem,
        completed: record.provedeno,
        description: record.popis
      })))
      
      setIsAddMaintenanceModalOpen(false)
    } catch (error) {
      console.error('Error creating maintenance record:', error)
    }
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex items-center justify-between mb-6">
        <Link 
          href="/dashboard/auta" 
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Zpět na seznam aut
        </Link>
        <div className="flex space-x-2">
          <Button 
            onClick={() => router.push(`/dashboard/auta/servis/${auto.id}`)}
            variant="outline"
          >
            <Wrench className="h-4 w-4 mr-2" />
            Zaznamenat servis
          </Button>
          <Button 
            onClick={() => setIsEditOpen(true)}
            variant="default"
          >
            Upravit auto
          </Button>
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-4">
        {auto.znacka} {auto.model} - {auto.spz}
      </h1>
      
      {/* Status Badges */}
      <div className="flex space-x-2 mb-6">
        <Badge variant={auto.stav === 'aktivní' ? 'success' : (auto.stav === 'servis' ? 'warning' : 'destructive')}>
          {auto.stav === 'aktivní' ? 'Aktivní' : (auto.stav === 'servis' ? 'V servisu' : 'Vyřazeno')}
        </Badge>
        
        {daysUntilSTK !== null && (
          <Badge variant={daysUntilSTK < 30 ? (daysUntilSTK < 0 ? 'destructive' : 'warning') : 'outline'}>
            STK: {daysUntilSTK < 0 ? 'Propadlá' : `${daysUntilSTK} dní`}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="overview">Přehled</TabsTrigger>
          <TabsTrigger value="service">Opravy a servis</TabsTrigger>
          <TabsTrigger value="maintenance">Údržba</TabsTrigger>
          <TabsTrigger value="photos">Fotogalerie</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Základní údaje</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">SPZ</p>
                  <p className="font-medium">{auto.spz}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rok výroby</p>
                  <p className="font-medium">{auto.rokVyroby}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nájezd</p>
                  <p className="font-medium">{auto.najezd.toLocaleString()} km</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Datum STK</p>
                  <p className="font-medium">
                    {auto.datumSTK ? format(new Date(auto.datumSTK), 'dd. MM. yyyy', { locale: cs }) : "Nenastaveno"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>QR kód vozidla</CardTitle>
                <CardDescription>Naskenujte pro rychlý přístup k vozidlu</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                {qrUrl && <QRCodeSVG value={qrUrl} size={150} />}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Maintenance Alerts */}
          {upcomingMaintenance.length > 0 && (
            <Card className="mt-6 border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-amber-800 flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Nadcházející údržba
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {upcomingMaintenance.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-yellow-100">
                      <div>
                        <h4 className="font-medium text-amber-900">{item.type}</h4>
                        <p className="text-sm text-amber-700">{item.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-amber-900 font-medium">
                          {item.nextDate ? format(new Date(item.nextDate), 'dd. MM. yyyy', { locale: cs }) : ''}
                        </p>
                        <p className="text-xs text-amber-700">
                          {item.nextDate ? `za ${Math.ceil((new Date(item.nextDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dní` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full text-amber-800 border-amber-300 hover:bg-amber-100" onClick={() => setActiveTab("maintenance")}>
                  Zobrazit vše
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Recent Service History */}
          <Card className="mt-6">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Poslední opravy</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("service")}>
                  Zobrazit vše
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-4 text-center text-muted-foreground">Načítání...</div>
              ) : sortedServiceRecords.length > 0 ? (
                <div className="space-y-4">
                  {sortedServiceRecords.slice(0, 3).map((record) => (
                    <div key={record.id} className="flex justify-between border-b pb-3">
                      <div>
                        <h4 className="font-medium">{record.type}</h4>
                        <p className="text-sm text-muted-foreground">{record.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{record.cost.toLocaleString()} Kč</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(record.date), 'dd. MM. yyyy', { locale: cs })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-muted-foreground">Žádné záznamy o opravách</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Tab */}
        <TabsContent value="service" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Opravy a servis</h2>
            <Button onClick={handleAddService}>
              <Plus className="h-4 w-4 mr-2" />
              Přidat opravu
            </Button>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Načítání historie oprav...
            </div>
          ) : (
            <div className="space-y-6">
              {sortedServiceRecords.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-9 top-0 bottom-0 w-px bg-border"></div>
                  
                  {sortedServiceRecords.map((record, index) => (
                    <div key={record.id} className="relative pl-12 pb-8">
                      <div className="absolute left-0 rounded-full w-7 h-7 bg-background border-2 border-primary flex items-center justify-center">
                        <Wrench className="h-3 w-3 text-primary" />
                      </div>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div>
                              <CardTitle>{record.type}</CardTitle>
                              <CardDescription>
                                {format(new Date(record.date), 'dd. MMMM yyyy', { locale: cs })}
                              </CardDescription>
                            </div>
                            <Badge 
                              variant={
                                record.status === 'dokončeno' ? 'success' :
                                record.status === 'probíhá' ? 'warning' : 'default'
                              }
                            >
                              {record.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Náklady</p>
                              <p className="font-medium">{record.cost.toLocaleString()} Kč</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Nájezd</p>
                              <p className="font-medium">{record.mileage.toLocaleString()} km</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Servis</p>
                              <p className="font-medium">{record.service || "Nespecifikováno"}</p>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-1">Popis opravy</h4>
                            <p className="text-sm">{record.description}</p>
                          </div>
                          
                          {record.note && (
                            <div className="mt-4 border-t pt-2">
                              <h4 className="text-sm font-medium mb-1">Poznámka</h4>
                              <p className="text-sm text-muted-foreground">{record.note}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center border rounded-lg">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                  <h3 className="mt-4 text-lg font-medium">Žádné záznamy o opravách</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    U tohoto vozidla zatím nejsou žádné záznamy o opravách nebo servisu.
                  </p>
                  <Button onClick={handleAddService} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Přidat první záznam
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Údržba vozidla</h2>
            <Button onClick={handleAddMaintenance}>
              <Plus className="h-4 w-4 mr-2" />
              Naplánovat údržbu
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Upcoming Maintenance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarCheck className="h-5 w-5 mr-2" />
                  Plánovaná údržba
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-4 text-center text-muted-foreground">Načítání...</div>
                ) : upcomingMaintenance.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingMaintenance.map((item) => (
                      <div key={item.id} className="flex justify-between items-start border-b pb-4">
                        <div>
                          <h4 className="font-medium">{item.type}</h4>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {item.nextDate ? format(new Date(item.nextDate), 'dd. MM. yyyy', { locale: cs }) : ''}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.nextDate ? `za ${Math.ceil((new Date(item.nextDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dní` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    Žádná plánovaná údržba
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Completed Maintenance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Historie údržby
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-4 text-center text-muted-foreground">Načítání...</div>
                ) : sortedMaintenanceRecords.filter(r => r.completed).length > 0 ? (
                  <div className="space-y-4">
                    {sortedMaintenanceRecords
                      .filter(r => r.completed)
                      .slice(0, 5)
                      .map((item) => (
                        <div key={item.id} className="flex justify-between items-start border-b pb-4">
                          <div>
                            <h4 className="font-medium">{item.type}</h4>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{item.cost.toLocaleString()} Kč</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(item.completionDate), 'dd. MM. yyyy', { locale: cs })}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    Žádné záznamy o údržbě
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* All Maintenance Records */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Kompletní záznamy o údržbě</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-4 text-center text-muted-foreground">Načítání...</div>
              ) : maintenanceRecords.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-9 top-0 bottom-0 w-px bg-border"></div>
                  
                  {sortedMaintenanceRecords.map((record) => (
                    <div key={record.id} className="relative pl-12 pb-8">
                      <div className={`absolute left-0 rounded-full w-7 h-7 ${record.completed ? 'bg-green-100 border-green-500' : 'bg-background border-muted'} border-2 flex items-center justify-center`}>
                        <Wrench className={`h-3 w-3 ${record.completed ? 'text-green-600' : 'text-muted-foreground'}`} />
                      </div>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div>
                              <CardTitle>{record.type}</CardTitle>
                              <CardDescription>
                                {format(new Date(record.completionDate), 'dd. MMMM yyyy', { locale: cs })}
                              </CardDescription>
                            </div>
                            <Badge variant={record.completed ? 'success' : 'outline'}>
                              {record.completed ? 'Dokončeno' : 'Plánováno'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Náklady</p>
                              <p className="font-medium">{record.cost.toLocaleString()} Kč</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Nájezd</p>
                              <p className="font-medium">{record.mileage.toLocaleString()} km</p>
                            </div>
                            {record.nextDate && (
                              <div>
                                <p className="text-sm text-muted-foreground">Příští termín</p>
                                <p className="font-medium">
                                  {format(new Date(record.nextDate), 'dd. MM. yyyy', { locale: cs })}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-1">Popis údržby</h4>
                            <p className="text-sm">{record.description}</p>
                          </div>
                          
                          {record.note && (
                            <div className="mt-4 border-t pt-2">
                              <h4 className="text-sm font-medium mb-1">Poznámka</h4>
                              <p className="text-sm text-muted-foreground">{record.note}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center border rounded-lg">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                  <h3 className="mt-4 text-lg font-medium">Žádné záznamy o údržbě</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    U tohoto vozidla zatím nejsou žádné záznamy o údržbě.
                  </p>
                  <Button onClick={handleAddMaintenance} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Naplánovat údržbu
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Fotogalerie</h2>
            <div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="photo-upload"
                onChange={handlePhotoUpload}
              />
              <label htmlFor="photo-upload">
                <Button variant="outline" disabled={isUploading} asChild>
                  <span>
                    <Camera className="h-4 w-4 mr-2" />
                    {isUploading ? "Nahrávání..." : "Nahrát fotografii"}
                  </span>
                </Button>
              </label>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {auto.fotky?.map((photo) => (
              <div key={photo.id} className="relative group aspect-square">
                <Image
                  src={photo.url}
                  alt="Fotka auta"
                  fill
                  className="object-cover rounded-lg"
                />
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            
            {auto.fotky?.length === 0 && (
              <div className="col-span-full py-12 text-center border rounded-lg">
                <Camera className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                <h3 className="mt-4 text-lg font-medium">Žádné fotografie</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Pro toto vozidlo zatím nejsou nahrány žádné fotografie.
                </p>
                <div className="mt-4">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="photo-upload-empty"
                    onChange={handlePhotoUpload}
                  />
                  <label htmlFor="photo-upload-empty">
                    <Button disabled={isUploading} asChild>
                      <span>
                        <Camera className="h-4 w-4 mr-2" />
                        Nahrát první fotografii
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {isEditOpen && (
        <AutoDetailForm
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          initialData={{
            ...auto,
            datumSTK: auto.datumSTK ? new Date(auto.datumSTK) : undefined,
            stav: auto.stav as "aktivní" | "servis" | "vyřazeno"
          }}
          onSubmit={handleEdit}
        />
      )}

      {/* Add modals at the end of the component */}
      {isAddServiceModalOpen && (
        <ServiceForm
          open={isAddServiceModalOpen}
          onOpenChange={setIsAddServiceModalOpen}
          autoId={auto.id}
          currentMileage={auto.najezd}
          onSubmit={handleServiceSubmit}
        />
      )}
      
      {isAddMaintenanceModalOpen && (
        <MaintenanceForm
          open={isAddMaintenanceModalOpen}
          onOpenChange={setIsAddMaintenanceModalOpen}
          autoId={auto.id}
          currentMileage={auto.najezd}
          onSubmit={handleMaintenanceSubmit}
        />
      )}
    </div>
  )
} 