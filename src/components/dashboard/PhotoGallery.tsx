'use client';

import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { PhotoEditor } from '@/components/photo/PhotoEditor';
import { 
  ImageIcon, PencilIcon, TrashIcon,
  ChevronLeftIcon, ChevronRightIcon, XIcon
} from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  positionX?: number;
  positionY?: number;
  scale?: number;
  data?: string;
  mimeType?: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  autoId: string;
  thumbnailId?: string;
  onUpdateAction: (params?: { newThumbnailId?: string }) => void;
}

export function PhotoGallery({ photos, autoId, thumbnailId, onUpdateAction }: PhotoGalleryProps) {
  const [photoSize, setPhotoSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<Photo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [localPhotos, setLocalPhotos] = useState<Photo[]>(photos);
  
  // Update local photos when props change
  useEffect(() => {
    setLocalPhotos(photos);
  }, [photos]);

  const handleSetThumbnail = async (photoId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/auta/${autoId}/fotky/${photoId}/thumbnail`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to set thumbnail');
      
      // Update local state immediately to reflect the new thumbnail
      // This will update the UI to show which photo is the thumbnail
      const updatedPhotos = [...localPhotos];
      
      toast({
        title: "Úspěch",
        description: "Miniatura byla nastavena",
      });
      
      // Call the parent's update function with the new thumbnailId
      // This allows the parent component to update its state without a full refresh
      if (onUpdateAction) {
        // Pass the new thumbnailId to the parent component
        onUpdateAction({ newThumbnailId: photoId });
      }
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nastala chyba při nastavení miniatury",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Opravdu chcete smazat tuto fotografii?')) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/auta/${autoId}/fotky/${photoId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete photo');
      
      // Update local state immediately
      setLocalPhotos(prev => prev.filter(p => p.id !== photoId));
      
      // Close fullscreen if the deleted photo was being viewed
      if (fullscreenPhoto?.id === photoId) {
        setFullscreenPhoto(null);
      }
      
      toast({
        title: "Úspěch",
        description: "Fotografie byla smazána",
      });
      
      onUpdateAction();
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nastala chyba při mazání fotografie",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPhotoSizeClass = () => {
    switch (photoSize) {
      case 'small': return 'h-32 md:h-40';
      case 'large': return 'h-56 md:h-72';
      default: return 'h-44 md:h-56';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button 
            variant={photoSize === 'small' ? 'default' : 'outline'}
            size="sm" 
            onClick={() => setPhotoSize('small')}
          >
            Malé
          </Button>
          <Button 
            variant={photoSize === 'medium' ? 'default' : 'outline'}
            size="sm" 
            onClick={() => setPhotoSize('medium')}
          >
            Střední
          </Button>
          <Button 
            variant={photoSize === 'large' ? 'default' : 'outline'}
            size="sm" 
            onClick={() => setPhotoSize('large')}
          >
            Velké
          </Button>
        </div>
      </div>

      {localPhotos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {localPhotos.map((photo) => (
            <div 
              key={photo.id} 
              className={`relative group rounded-lg overflow-hidden border shadow-sm transition-all duration-200 hover:shadow-md ${
                photo.id === thumbnailId ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setFullscreenPhoto(photo)}
            >
              <div className="relative">
                <img 
                  src={photo.url} 
                  alt="Fotografie vozidla" 
                  className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${getPhotoSizeClass()}`}
                  style={{ 
                    objectPosition: photo.positionX && photo.positionY ? 
                      `${photo.positionX}% ${photo.positionY}%` : 'center',
                    objectFit: 'cover'
                  }}
                />
                
                {photo.id === thumbnailId && (
                  <div className="absolute top-2 left-2 bg-primary/90 text-white text-xs px-2 py-1 rounded-full">
                    Miniatura
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button 
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 bg-white/10 hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingPhoto(photo);
                    }}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  {photo.id !== thumbnailId && (
                    <Button 
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 bg-white/10 hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetThumbnail(photo.id);
                      }}
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 bg-white/10 hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(photo.id);
                    }}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetThumbnail(photo.id);
                }}
                className="absolute bottom-2 right-2 bg-white/80 hover:bg-white rounded-full h-8 w-8"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-sm font-medium text-muted-foreground">Žádné fotografie</h3>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Nahrajte fotografie pomocí tlačítka výše
          </p>
        </div>
      )}
      
      {editingPhoto && (
        <PhotoEditor
          imageUrl={editingPhoto.url}
          isOpen={!!editingPhoto}
          onCloseAction={() => setEditingPhoto(null)}
          onSaveAction={async (editedImage) => {
            setIsLoading(true);
            try {
              // Immediately update the UI with the cropped image
              const updatedPhoto = {
                ...editingPhoto,
                url: editedImage.data // Use the cropped image data directly
              };
              
              // Update local photos state to show the cropped image immediately
              setLocalPhotos(prev => 
                prev.map(p => p.id === editingPhoto.id ? updatedPhoto : p)
              );
              
              // If this photo was in fullscreen, update that too
              if (fullscreenPhoto?.id === editingPhoto.id) {
                setFullscreenPhoto(updatedPhoto);
              }
              
              // Send to server
              const response = await fetch(`/api/auta/${autoId}/fotky/${editingPhoto.id}/edit`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  imageData: editedImage.data,
                }),
              });
              
              if (!response.ok) throw new Error('Failed to update photo');
              
              toast({
                title: "Úspěch",
                description: "Fotografie byla upravena",
              });
              
              setEditingPhoto(null);
              onUpdateAction();
            } catch (error) {
              toast({
                title: "Chyba",
                description: "Nastala chyba při úpravě fotografie",
                variant: "destructive",
              });
            } finally {
              setIsLoading(false);
            }
          }}
        />
      )}

      {fullscreenPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
          onClick={() => setFullscreenPhoto(null)}
        >
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="bg-black/50 hover:bg-black/70 border-white/10"
              onClick={() => setFullscreenPhoto(null)}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="relative h-full w-full flex items-center justify-center p-4">
            <img 
              src={fullscreenPhoto.url} 
              alt="Fotografie vozidla" 
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
            
            {localPhotos.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-4 bg-black/50 hover:bg-black/70 border-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentIndex = localPhotos.findIndex(p => p.id === fullscreenPhoto.id);
                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : localPhotos.length - 1;
                    setFullscreenPhoto(localPhotos[prevIndex]);
                  }}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 bg-black/50 hover:bg-black/70 border-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentIndex = localPhotos.findIndex(p => p.id === fullscreenPhoto.id);
                    const nextIndex = currentIndex < localPhotos.length - 1 ? currentIndex + 1 : 0;
                    setFullscreenPhoto(localPhotos[nextIndex]);
                  }}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 