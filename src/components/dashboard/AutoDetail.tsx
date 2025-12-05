"use client"

import { Button } from "@/components/ui/button"
import { QRCodeSVG } from "qrcode.react"
import { 
  ArrowLeft, 
  Camera, 
  X, 
  CalendarCheck, 
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
import { toast } from "@/components/ui/use-toast"
import { PhotoPositionModal } from "@/components/photo-positioning/PhotoPositionModal"
import { PhotoGallery } from "@/components/dashboard/PhotoGallery"
import { RepairsTable } from "@/components/repairs/RepairsTable"
import { RepairDialog } from "@/components/repairs/RepairDialog"

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
  repairs?: Array<{
    id: number
    autoId: number
    kategorie: string
    popis: string
    datum: Date | string
    najezd: number
    poznamka: string | null
    cena: number | null
    auto?: {
      id: number
      spz: string
      znacka: string
      model: string
    }
  }>
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


export function AutoDetail({ auto, repairs = [] }: AutoDetailProps) {
  const router = useRouter()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isRepairDialogOpen, setIsRepairDialogOpen] = useState(false)
  const [qrUrl, setQrUrl] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false)
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

    fetchServiceRecords()
    setIsLoading(false)
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


  useEffect(() => {
    setQrUrl(`${window.location.origin}/dashboard/auta/${auto.id}`)
  }, [auto.id])

  // Sort records by date (newest first)
  const sortedServiceRecords = [...serviceRecords].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // Calculate days until next STK
  const daysUntilSTK = auto.datumSTK 
    ? Math.ceil((new Date(auto.datumSTK).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  const serviceStats = {
    total: sortedServiceRecords.length,
    open: sortedServiceRecords.filter(record => record.status !== 'dokončeno').length,
    totalCost: sortedServiceRecords.reduce((sum, record) => sum + (record.cost || 0), 0),
    last: sortedServiceRecords[0]?.date
  }

  // Compute stats and sorted repairs from the new repairs prop
  const sortedRepairs = [...repairs].sort((a, b) => {
    const dateA = typeof a.datum === 'string' ? new Date(a.datum) : a.datum
    const dateB = typeof b.datum === 'string' ? new Date(b.datum) : b.datum
    return dateB.getTime() - dateA.getTime()
  })

  const repairStats = {
    total: repairs.length,
    totalCost: repairs.reduce((sum, repair) => sum + (repair.cena || 0), 0),
    last: sortedRepairs[0]?.datum
  }

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
    <div className="container max-w-6xl py-6 sm:py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link 
          href="/dashboard/auta" 
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Zpět na seznam aut
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row sm:space-x-2 w-full sm:w-auto">
          <Button 
            onClick={() => setIsRepairDialogOpen(true)}
            variant="default"
            className="w-full sm:w-auto"
          >
            Opravy
          </Button>
          <Button 
            onClick={() => setIsEditOpen(true)}
            variant="default"
            className="w-full sm:w-auto"
          >
            Upravit auto
          </Button>
        </div>
      </div>

      {isRepairDialogOpen && (
        <RepairDialog
          preselectedCarId={Number(auto.id)}
          open={isRepairDialogOpen}
          onOpenChange={setIsRepairDialogOpen}
          onSuccess={() => {
            router.refresh()
          }}
        />
      )}

      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Detail vozidla</p>
        <h1 className="text-3xl font-bold">
          {auto.znacka} {auto.model} • {auto.spz}
        </h1>
      </div>
      
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
        <TabsList className="w-full flex flex-wrap gap-2">
          <TabsTrigger value="overview" className="text-sm">Přehled</TabsTrigger>
          <TabsTrigger value="service" className="text-sm">Opravy</TabsTrigger>
          <TabsTrigger value="photos" className="text-sm">Fotogalerie</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
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
              <CardContent className="flex flex-col items-center">
                {qrUrl && <QRCodeSVG value={qrUrl} size={150} />}
                <Button className="mt-4" variant="outline" onClick={() => {
                  window.print();
                }}>
                  Vytisknout QR kód
                </Button>
                {/* Hidden printable QR code for print view */}
                <div id="print-qr" style={{ display: 'none' }}>
                  <div className="print-qr-wrapper">
                    {qrUrl && <QRCodeSVG value={qrUrl} size={350} />}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>


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
              {sortedRepairs.length > 0 ? (
                <div className="space-y-4">
                  {sortedRepairs.slice(0, 3).map((repair) => {
                    const repairDate = typeof repair.datum === 'string' ? new Date(repair.datum) : repair.datum
                    return (
                      <div key={repair.id} className="flex justify-between border-b pb-3">
                        <div>
                          <h4 className="font-medium">{repair.kategorie}</h4>
                          <p className="text-sm text-muted-foreground">{repair.popis}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {repair.cena ? `${repair.cena.toLocaleString('cs-CZ')} Kč` : '-'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(repairDate, 'dd. MM. yyyy', { locale: cs })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-4 text-center text-muted-foreground">Žádné záznamy o opravách</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Tab */}
        <TabsContent value="service" className="mt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Opravy a servis</h2>
              <p className="text-sm text-muted-foreground">Přehled všech zásahů na vozidle.</p>
            </div>
          </div>

          <div className="mt-6">
            <RepairsTable repairs={repairs} showVehicleColumn={false} />
          </div>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="mt-4">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-xl font-semibold">Fotogalerie</h3>
              <div className="flex flex-wrap items-center gap-2">
                {/* Photo size controls */}
                <div className="flex items-center border rounded-md overflow-hidden">
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
          onOpenChangeAction={(open) => { if (!open) setIsEditOpen(false); }}
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
      

      {/* Add print styles at the end of the file */}
      <style jsx global>{`
        @media print {
          html, body {
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            background: white !important;
          }
          body * {
            visibility: hidden !important;
          }
          #print-qr, #print-qr * {
            visibility: visible !important;
            display: flex !important;
            justify-content: center;
            align-items: center;
          }
          #print-qr {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            height: 297mm;
            background: white !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            display: flex !important;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            page-break-after: avoid;
            page-break-before: avoid;
            page-break-inside: avoid;
          }
          .print-qr-wrapper {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
      `}</style>
    </div>
  )
} 