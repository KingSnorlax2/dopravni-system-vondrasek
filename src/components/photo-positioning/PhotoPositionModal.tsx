"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { toast } from "@/components/ui/use-toast"
import { Loader2, ZoomIn, ZoomOut, MoveHorizontal, RotateCcw } from "lucide-react"

interface PhotoPositionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  photoId: string
  photoUrl: string
  autoId: string
  initialPosition: {
    positionX: number
    positionY: number
    scale: number
  }
  onPositionSaved: (photoId: string, position: { positionX: number, positionY: number, scale: number }) => void
}

export function PhotoPositionModal({
  open,
  onOpenChange,
  photoId,
  photoUrl,
  autoId,
  initialPosition,
  onPositionSaved
}: PhotoPositionModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [position, setPosition] = useState({
    positionX: initialPosition.positionX || 50,
    positionY: initialPosition.positionY || 50,
    scale: initialPosition.scale || 1
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const isDragging = useRef(false)
  const lastPosition = useRef({ x: 0, y: 0 })

  // Reset position state when modal opens with new photo
  useEffect(() => {
    if (open) {
      setPosition({
        positionX: initialPosition.positionX || 50,
        positionY: initialPosition.positionY || 50,
        scale: initialPosition.scale || 1
      })
    }
  }, [open, initialPosition, photoId])

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    lastPosition.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    
    const deltaX = e.clientX - lastPosition.current.x
    const deltaY = e.clientY - lastPosition.current.y
    
    // Convert pixel movement to percentage movement
    const containerWidth = containerRef.current?.clientWidth || 1
    const containerHeight = containerRef.current?.clientHeight || 1
    
    const percentageX = (deltaX / containerWidth) * 100
    const percentageY = (deltaY / containerHeight) * 100
    
    setPosition(prev => ({
      ...prev,
      positionX: Math.max(0, Math.min(100, prev.positionX + percentageX)),
      positionY: Math.max(0, Math.min(100, prev.positionY + percentageY))
    }))
    
    lastPosition.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUp = () => {
    isDragging.current = false
  }

  const handleScaleChange = (value: number[]) => {
    setPosition(prev => ({
      ...prev,
      scale: value[0]
    }))
  }

  const handleReset = () => {
    setPosition({
      positionX: 50,
      positionY: 50,
      scale: 1
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/auta/${autoId}/fotky/${photoId}/position`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionX: position.positionX,
          positionY: position.positionY,
          scale: position.scale
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save position')
      }
      
      // Notify parent component of the saved position
      onPositionSaved(photoId, position)
      
      // Close the modal
      onOpenChange(false)
      
      toast({
        title: "Pozice uložena",
        description: "Pozice fotografie byla úspěšně uložena",
      })
    } catch (error) {
      console.error('Failed to save photo position:', error)
      toast({
        title: "Chyba při ukládání pozice",
        description: error instanceof Error ? error.message : "Nastala neočekávaná chyba.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Úprava pozice fotografie</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-6">
          <div 
            ref={containerRef}
            className="relative w-full h-[300px] overflow-hidden rounded-md border"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              ref={imageRef}
              src={photoUrl}
              alt="Úprava pozice"
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${position.positionX}%`,
                top: `${position.positionY}%`,
                scale: position.scale,
                objectFit: 'contain',
                userSelect: 'none',
                cursor: isDragging.current ? 'grabbing' : 'grab'
              }}
              draggable={false}
            />
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center">
                  <ZoomIn className="h-4 w-4 mr-2" />
                  Přiblížení
                </label>
                <span className="text-xs text-muted-foreground">
                  {Math.round(position.scale * 100)}%
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <ZoomOut className="h-4 w-4" />
                <Slider
                  value={[position.scale]}
                  min={0.5}
                  max={2}
                  step={0.01}
                  onValueChange={handleScaleChange}
                  className="flex-1"
                />
                <ZoomIn className="h-4 w-4" />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium flex items-center">
                <MoveHorizontal className="h-4 w-4 mr-2" />
                Pozice
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Fotku můžete přetáhnout myší pro úpravu pozice
              </p>
            </div>
            
            <Button 
              onClick={handleReset} 
              variant="outline" 
              size="sm" 
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetovat pozici
            </Button>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ukládám...
              </>
            ) : "Uložit pozici"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 