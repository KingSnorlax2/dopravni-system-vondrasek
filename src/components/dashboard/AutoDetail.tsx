"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { QRCodeSVG } from "qrcode.react"
import { ArrowLeft, Camera, Wrench } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

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
  }
}

export function AutoDetail({ auto }: AutoDetailProps) {
  const [note, setNote] = useState("")

  return (
    <div className="container max-w-5xl py-8">
      <div className="flex items-center justify-between mb-8">
        <Link 
          href="/dashboard/auta" 
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Zpět na seznam aut
        </Link>
        <Button variant="outline">Upravit auto</Button>
      </div>

      <h1 className="text-3xl font-bold mb-2">
        {auto.znacka} {auto.model} - {auto.spz}
      </h1>

      <div className="grid grid-cols-2 gap-8 mt-8">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Rok výroby</p>
            <p className="font-medium">{auto.rokVyroby}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Nájezd</p>
            <p className="font-medium">{auto.najezd.toLocaleString()} km</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Stav</p>
            <p className="font-medium capitalize">{auto.stav}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Datum STK</p>
            <p className="font-medium">
              {auto.datumSTK ? new Date(auto.datumSTK).toLocaleDateString("cs-CZ") : "Nenastaveno"}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center border rounded-lg p-6">
          <p className="text-sm font-medium mb-4">QR kód vozidla</p>
          <QRCodeSVG 
            value={`${window.location.origin}/dashboard/auta/${auto.id}`}
            size={150}
          />
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Naskenujte pro přístup k detailu vozidla
          </p>
        </div>
      </div>

      <Separator className="my-8" />

      <section className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Fotogalerie</h2>
          <div className="space-y-4">
            <Button variant="outline">
              <Camera className="h-4 w-4 mr-2" />
              Nahrát fotografii
            </Button>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Poznámky</h2>
          <div className="space-y-4">
            <div>
              <Textarea 
                placeholder="Napište poznámku..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="resize-none"
                maxLength={300}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {note.length}/300 znaků
              </p>
            </div>
            <Button>Přidat poznámku</Button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Opravy a servis</h2>
            <Button variant="outline">
              <Wrench className="h-4 w-4 mr-2" />
              Přidat opravu
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Žádné opravy nebyly nalezeny
          </p>
        </div>
      </section>
    </div>
  )
} 