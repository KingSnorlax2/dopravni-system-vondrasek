"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { QrCode, ArrowLeft, Camera, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
import { QRCodeSVG } from "qrcode.react"
import Link from "next/link"
import { format } from "date-fns"

interface AutoDetailFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData: {
    id: string
    spz: string
    znacka: string
    model: string
    rokVyroby: number
    najezd: number
    stav: string
    datumSTK?: string
  }
}

export function AutoDetailForm({ open, onOpenChange, initialData }: AutoDetailFormProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[600px] h-full flex flex-col overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/auta" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zpět na seznam aut
            </Link>
            <Button variant="outline" size="sm">
              Upravit auto
            </Button>
          </div>
          
          <SheetTitle className="flex items-baseline gap-2">
            <span>{initialData.znacka} {initialData.model}</span>
            <span className="text-muted-foreground">- {initialData.spz}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-6 mt-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Rok výroby</p>
              <p className="font-medium">{initialData.rokVyroby}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nájezd</p>
              <p className="font-medium">{initialData.najezd.toLocaleString()} km</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stav</p>
              <p className="font-medium capitalize">{initialData.stav}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Datum STK</p>
              <p className="font-medium">
                {initialData.datumSTK 
                  ? format(new Date(initialData.datumSTK), "dd.MM.yyyy")
                  : "Nenastaveno"}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center border rounded-lg p-4">
            <p className="text-sm font-medium mb-2">QR kód vozidla</p>
            <QRCodeSVG 
              value={`${window.location.origin}/dashboard/auta/${initialData.id}`}
              size={120}
            />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Naskenujte pro přístup k detailu vozidla
            </p>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Fotogalerie</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  className="hidden"
                  id="photo-upload"
                  accept="image/*"
                />
                <Button variant="outline" asChild>
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Camera className="h-4 w-4 mr-2" />
                    Nahrát fotografii
                  </label>
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {/* Photo grid will go here */}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Poznámky</h3>
            <div className="space-y-4">
              <div>
                <Textarea 
                  placeholder="Napište poznámku..."
                  className="resize-none"
                  maxLength={300}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  0/300 znaků
                </p>
              </div>
              <Button>Přidat poznámku</Button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Opravy a servis</h3>
              <Button variant="outline">
                <Wrench className="h-4 w-4 mr-2" />
                Přidat opravu
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Žádné opravy nebyly nalezeny
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 