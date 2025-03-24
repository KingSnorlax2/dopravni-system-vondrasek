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
  AlertCircle,
  PencilIcon,
  Trash2Icon,
  CropIcon,
  Image as ImageIcon,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { AutoDetailForm } from "@/components/forms/AutoDetailForm"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import cs from 'date-fns/locale/cs'
import { useRouter } from "next/navigation"
import { ServiceForm } from '@/components/forms/ServiceForm'
import { MaintenanceForm } from '@/components/forms/MaintenanceForm'
import { toast } from "@/components/ui/use-toast"
import { PhotoPositionModal } from "@/components/photo-positioning/PhotoPositionModal"
import { PhotoGallery } from "@/components/dashboard/PhotoGallery"

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
    thumbnailFotoId?: string
    fotky?: Array<{
      id: string
      url: string
      positionX?: number
      positionY?: number
      scale?: number
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
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [currentEditPhotoId, setCurrentEditPhotoId] = useState<string | null>(null)
  const [photoSize, setPhotoSize] = useState<'small' | 'medium' | 'large'>('medium')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const [isPositioningModalOpen, setIsPositioningModalOpen] = useState(false)
  const [currentPositioningPhotoId, setCurrentPositioningPhotoId] = useState<string | null>(null)

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
          note: record.poznamka,
          service: record.servis
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
    if (!e.target.files?.[0]) return;

    setIsUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/auta/${auto.id}/fotky`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      // Reload photos after successful upload
      const photosResponse = await fetch(`/api/auta/${auto.id}/fotky`);
      if (photosResponse.ok) {
        const photosData = await photosResponse.json();
        // Update auto.fotky with the new photos data
        auto.fotky = photosData.map((foto: any) => ({
          id: foto.id,
          url: `data:${foto.mimeType};base64,${foto.data}`,
          positionX: foto.positionX,
          positionY: foto.positionY,
          scale: foto.scale
        }));
        // Force re-render
        setRefreshTrigger(prev => prev + 1);
      } else {
        // Just reload the page if we can't fetch updated photos
        window.location.reload();
      }
      
      toast({
        title: "Fotografie nahrána",
        description: "Fotografie byla úspěšně nahrána.",
      });
    } catch (error) {
      console.error('Photo upload failed:', error);
      toast({
        title: "Chyba při nahrávání fotografie",
        description: error instanceof Error ? error.message : "Nastala neočekávaná chyba.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleEditPhoto = async (photoId: string) => {
    setCurrentEditPhotoId(photoId)
    // Trigger the file input click
    if (editFileInputRef.current) {
      editFileInputRef.current.click()
    }
  }

  const handleEditPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentEditPhotoId) return
    
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', files[0])

      const response = await fetch(`/api/auta/${auto.id}/fotky/${currentEditPhotoId}`, {
        method: 'PUT',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to update photo')
      }

      // Refresh the photos by incrementing the refresh trigger
      setRefreshTrigger(prev => prev + 1)
      toast({
        title: "Fotografie aktualizována",
        description: "Fotografie byla úspěšně aktualizována",
      })
    } catch (error) {
      console.error('Error updating photo:', error)
      toast({
        title: "Chyba při aktualizaci fotografie",
        description: "Nepodařilo se aktualizovat fotografii",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
      setCurrentEditPhotoId(null)
      if (editFileInputRef.current) {
        editFileInputRef.current.value = ''
      }
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const response = await fetch(`/api/auta/${auto.id}/fotky/${photoId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }
      
      // Check if the deleted photo was the thumbnail
      const wasThumbnail = photoId === auto.thumbnailFotoId;
      
      // If it was the thumbnail, clear the thumbnailFotoId
      if (wasThumbnail) {
        auto.thumbnailFotoId = undefined;
        
        // Also update on the server
        try {
          await fetch(`/api/auta/${auto.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ thumbnailFotoId: null })
          });
        } catch (thumbnailError) {
          console.error('Failed to clear thumbnail reference:', thumbnailError);
        }
      }
      
      // Update the UI by removing the deleted photo
      if (auto.fotky) {
        auto.fotky = auto.fotky.filter(foto => foto.id !== photoId);
        // Force re-render
        setRefreshTrigger(prev => prev + 1);
      }
      
      toast({
        title: "Fotografie odstraněna",
        description: wasThumbnail 
          ? "Fotografie byla odstraněna a reference na miniaturu byla zrušena."
          : "Fotografie byla úspěšně odstraněna.",
      });
    } catch (error) {
      console.error('Photo delete failed:', error);
      toast({
        title: "Chyba při odstraňování fotografie",
        description: error instanceof Error ? error.message : "Nastala neočekávaná chyba.",
        variant: "destructive",
      });
    }
  };

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

  const handleSetAsThumbnail = async (photoId: string) => {
    try {
      const response = await fetch(`/api/auta/${auto.id}/fotky/${photoId}/thumbnail`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set thumbnail');
      }
      
      // Update the local auto object to reflect the change
      auto.thumbnailFotoId = photoId;
      
      // Force re-render
      setRefreshTrigger(prev => prev + 1);
      
      toast({
        title: "Miniatura nastavena",
        description: "Fotografie byla nastavena jako miniatura vozidla",
      });
    } catch (error) {
      console.error('Setting thumbnail failed:', error);
      toast({
        title: "Chyba při nastavení miniatury",
        description: error instanceof Error ? error.message : "Nastala neočekávaná chyba.",
        variant: "destructive",
      });
    }
  };

  // Function to get photo height based on selected size
  const getPhotoHeight = () => {
    switch (photoSize) {
      case 'small': return 'h-32';
      case 'large': return 'h-64';
      case 'medium':
      default: return 'h-48';
    }
  };

  const handleOpenPositioning = (photoId: string) => {
    setCurrentPositioningPhotoId(photoId)
    setIsPositioningModalOpen(true)
  }

  const handlePositionSaved = (photoId: string, position: { positionX: number, positionY: number, scale: number }) => {
    // Update the local state with the new position
    if (auto.fotky) {
      auto.fotky = auto.fotky.map(photo => {
        if (photo.id === photoId) {
          return {
            ...photo,
            positionX: position.positionX,
            positionY: position.positionY,
            scale: position.scale
          }
        }
        return photo
      })
      
      // Force re-render
      setRefreshTrigger(prev => prev + 1)
    }
  }

  // Function to apply position styling to a photo
  const getPhotoStyle = (photo: any) => {
    if (photo.positionX !== undefined && photo.positionY !== undefined && photo.scale !== undefined) {
      return {
        objectPosition: `${photo.positionX}% ${photo.positionY}%`,
        transform: `scale(${photo.scale})`,
        transformOrigin: `${photo.positionX}% ${photo.positionY}%`
      }
    }
    return {} // Default empty style if no position data
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
                  <p className="font-medium">{(auto.najezd || 0).toLocaleString()} km</p>
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
                              <p className="font-medium">{(record.mileage || auto.najezd).toLocaleString()} km</p>
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
                              <p className="font-medium">{(record.mileage || auto.najezd).toLocaleString()} km</p>
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
        <TabsContent value="photos" className="mt-4">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Fotogalerie</h3>
              <div className="flex items-center space-x-2">
                {/* Photo size controls */}
                <div className="flex items-center border rounded-md overflow-hidden mr-2">
                  <Button 
                    variant={photoSize === 'small' ? "default" : "ghost"}
                    size="sm"
                    className="rounded-none h-8 px-2"
                    onClick={() => setPhotoSize('small')}
                  >
                    <ImageIcon className="h-3 w-3" />
                    <span className="ml-1">S</span>
                  </Button>
                  <Button 
                    variant={photoSize === 'medium' ? "default" : "ghost"}
                    size="sm"
                    className="rounded-none h-8 px-2"
                    onClick={() => setPhotoSize('medium')}
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span className="ml-1">M</span>
                  </Button>
                  <Button 
                    variant={photoSize === 'large' ? "default" : "ghost"}
                    size="sm"
                    className="rounded-none h-8 px-2"
                    onClick={() => setPhotoSize('large')}
                  >
                    <ImageIcon className="h-5 w-5" />
                    <span className="ml-1">L</span>
                  </Button>
                </div>
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  ref={fileInputRef}
                />
                <input
                  type="file"
                  id="photo-edit"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleEditPhotoChange}
                  ref={editFileInputRef}
                />
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Nahrávám...
                    </>
                  ) : "Nahrát fotografii"}
                </Button>
              </div>
            </div>

            <PhotoGallery
              photos={auto.fotky || []}
              autoId={auto.id}
              thumbnailId={auto.thumbnailFotoId}
              onUpdateAction={(updates) => {
                if (updates?.newThumbnailId) {
                  auto.thumbnailFotoId = updates.newThumbnailId;
                  setRefreshTrigger(prev => prev + 1);
                } else {
                  setRefreshTrigger(prev => prev + 1);
                }
              }}
            />
          </div>

          {/* Photo positioning modal */}
          {currentPositioningPhotoId && auto.fotky && (
            <PhotoPositionModal
              open={isPositioningModalOpen}
              onOpenChange={setIsPositioningModalOpen}
              photoId={currentPositioningPhotoId}
              photoUrl={auto.fotky.find(p => p.id === currentPositioningPhotoId)?.url || ""}
              autoId={auto.id}
              initialPosition={{
                positionX: auto.fotky.find(p => p.id === currentPositioningPhotoId)?.positionX || 50,
                positionY: auto.fotky.find(p => p.id === currentPositioningPhotoId)?.positionY || 50,
                scale: auto.fotky.find(p => p.id === currentPositioningPhotoId)?.scale || 1
              }}
              onPositionSaved={handlePositionSaved}
            />
          )}
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