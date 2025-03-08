'use client';

import { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Square, 
  // Rectangle, // Removed due to error
  LayoutTemplate,
  CheckIcon, 
  XIcon,
} from 'lucide-react';

interface PhotoEditorProps {
  imageUrl: string;
  isOpen: boolean;
  onCloseAction: () => void;
  onSaveAction: (editedImage: { 
    data: string;
    crop: Crop | null;
  }) => void;
}

const ASPECT_RATIOS = [
  { name: '1:1', value: 1, icon: Square },
  { name: '4:5', value: 4/5, icon: LayoutTemplate },
  { name: '16:9', value: 16/9, icon: LayoutTemplate },
  { name: 'Volný', value: undefined, icon: LayoutTemplate },
];

// This is to help with canvas memory usage
function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) throw new Error('Canvas is empty');
      resolve(blob);
    }, 'image/jpeg', 0.95);
  });
}

export function PhotoEditor({
  imageUrl,
  isOpen,
  onCloseAction,
  onSaveAction
}: PhotoEditorProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  const centerAspectCrop = useCallback(
    (mediaWidth: number, mediaHeight: number, aspectRatio?: number) => {
      return centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 90,
          },
          aspectRatio || mediaWidth / mediaHeight,
          mediaWidth,
          mediaHeight
        ),
        mediaWidth,
        mediaHeight
      );
    },
    []
  );

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
    setImageLoaded(true);
  }

  async function getCroppedImg(): Promise<string | null> {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) return null;

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Set proper canvas dimensions
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the cropped image
    ctx.drawImage(
      image,
      completedCrop.x,
      completedCrop.y,
      completedCrop.width,
      completedCrop.height,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    // Return as base64 data URL
    return canvas.toDataURL('image/jpeg', 0.95);
  }

  const handleSave = async () => {
    const croppedImageData = await getCroppedImg();
    if (croppedImageData) {
      onSaveAction({
        data: croppedImageData,
        crop: completedCrop
      });
    }
  };

  const handleAspectChange = (newAspect: number | undefined) => {
    setAspect(newAspect);
    
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, newAspect));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Oříznout fotografii</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="relative w-full bg-slate-900 rounded-lg overflow-hidden">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              className="max-h-[500px]"
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Crop preview"
                onLoad={onImageLoad}
                className="max-h-[500px] w-auto mx-auto"
                style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
              />
            </ReactCrop>
          </div>

          <div className="flex justify-center gap-2 py-2">
            {ASPECT_RATIOS.map((ratio) => {
              const Icon = ratio.icon;
              return (
                <Button
                  key={ratio.name}
                  variant={aspect === ratio.value ? "default" : "outline"}
                  className="px-4 py-2"
                  onClick={() => handleAspectChange(ratio.value)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {ratio.name}
                </Button>
              );
            })}
          </div>

          <canvas
            ref={previewCanvasRef}
            className="hidden"
          />

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onCloseAction}>
              <XIcon className="mr-2 h-4 w-4" />
              Zrušit
            </Button>
            <Button onClick={handleSave}>
              <CheckIcon className="mr-2 h-4 w-4" />
              Použít
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 