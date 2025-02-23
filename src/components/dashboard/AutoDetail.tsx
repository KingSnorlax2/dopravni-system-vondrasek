"use client"

import { Button } from "@/components/ui/button"
import { QRCodeSVG } from "qrcode.react"
import { ArrowLeft, Camera, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { AutoDetailForm } from "@/components/forms/AutoDetailForm"

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

export function AutoDetail({ auto }: AutoDetailProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [qrUrl, setQrUrl] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)

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

  useEffect(() => {
    setQrUrl(`${window.location.origin}/dashboard/auta/${auto.id}`)
  }, [auto.id])

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
        <Button variant="outline" onClick={() => setIsEditOpen(true)}>
          Upravit auto
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-2">
        {auto.znacka} {auto.model} - {auto.spz}
      </h1>

      <div className="grid md:grid-cols-2 gap-8 mt-8">
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
          {qrUrl && <QRCodeSVG value={qrUrl} size={150} />}
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Naskenujte pro přístup k detailu vozidla
          </p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Fotogalerie</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
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
          </div>
        </div>
      </section>

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
    </div>
  )
} 