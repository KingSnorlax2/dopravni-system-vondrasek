"use client"

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useTransition } from 'react'
import cs from 'date-fns/locale/cs'

const autoSchema = z.object({
  spz: z.string().min(7, "SPZ musí mít minimálně 7 znaků").max(8, "SPZ může mít maximálně 8 znaků"),
  znacka: z.string().min(2, "Značka musí mít alespoň 2 znaky").max(20, "Značka může mít maximálně 20 znaků"),
  model: z.string().min(1, "Model je povinný").max(20, "Model může mít maximálně 20 znaků"),
  rokVyroby: z.number()
    .min(1900, "Rok výroby musí být od roku 1900")
    .max(new Date().getFullYear(), "Rok výroby nemůže být v budoucnosti"),
  najezd: z.number().min(0, "Nájezd nemůže být záporný"),
  stav: z.enum(["aktivní", "servis", "vyřazeno"]),
  fotky: z.array(z.object({ id: z.string() })).optional(),
  datumSTK: z.string().optional(),
  poznamka: z.string().optional()
})

type AutoFormData = z.infer<typeof autoSchema>

interface AutoFormProps {
  open: boolean
  onOpenChangeClientAction: (open: boolean) => Promise<void>
  onSubmit?: (data: AutoFormData) => void
  initialData?: Partial<AutoFormData> & { id?: string }
}

type FileItem = 
  | { id: string; file?: never }  // for uploaded files with server-side ID
  | { id?: string; file: File };  // for local files before upload

const MAX_SPZ_LENGTH = 8;
const MAX_ZNACKA_LENGTH = 20;
const MAX_MODEL_LENGTH = 20;
const MAX_POZNAMKA_LENGTH = 300;

export function AutoForm({ open, onOpenChangeClientAction, onSubmit, initialData }: AutoFormProps) {
  const [uploading, setUploading] = useState(false)
  const [fotky, setFotky] = useState<FileItem[]>(initialData?.fotky || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showPicturesModal, setShowPicturesModal] = useState(false)
  const [currentPictures, setCurrentPictures] = useState<FileItem[]>([])
  const [selectedAuto, setSelectedAuto] = useState<AutoFormData & { id: string } | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<AutoFormData>({
    resolver: zodResolver(autoSchema),
    defaultValues: {
      spz: initialData?.spz || '',
      znacka: initialData?.znacka || '',
      model: initialData?.model || '',
      rokVyroby: initialData?.rokVyroby || new Date().getFullYear(),
      najezd: initialData?.najezd || 0,
      stav: initialData?.stav || 'aktivní' as const,
      fotky: [],
      datumSTK: initialData?.datumSTK || '',
      poznamka: initialData?.poznamka || ''
    }
  })

  const checkSPZExists = async (spz: string, excludeId?: string): Promise<boolean> => {
    try {
      let url = `/api/auta/check-spz?spz=${encodeURIComponent(spz)}`;
      if (excludeId) {
        url += `&excludeId=${encodeURIComponent(excludeId)}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error('Error checking SPZ:', error);
      return false;
    }
  };

  const handleSubmit = async (data: AutoFormData) => {
    setLoading(true)
    setError(null)
    try {
      if (!initialData || (initialData && initialData.spz !== data.spz)) {
        const exists = await checkSPZExists(
          data.spz,
          initialData?.id
        );
        if (exists) {
          throw new Error('Vozidlo s touto SPZ již existuje');
        }
      }

      const submitData = {
        ...data,
        rokVyroby: Number(data.rokVyroby),
        najezd: Number(data.najezd),
        datumSTK: data.datumSTK || null,
        fotky
      }

      const url = initialData 
        ? `/api/auta/${initialData.id}`
        : '/api/auta';

      const response = await fetch(url, {
        method: initialData ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const contentType = response.headers.get("content-type");
      const result = contentType && contentType.includes("application/json") 
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        throw new Error(
          result.error || 
          'Nastala chyba při vytváření/úpravě vozidla'
        );
      }

      if (onSubmit) {
        await onSubmit(result);
      }

      form.reset();
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setError(error.message || 'Nastala chyba při vytváření/úpravě vozidla');
    } finally {
      setLoading(false);
    }
    handleClose()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | Event) => {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      const validFiles = newFiles.filter(file => 
        ['image/jpeg', 'image/png', 'image/gif'].includes(file.type)
      );

      if (validFiles.length > 0) {
        const updatedFotky = [...fotky, ...validFiles.map(file => ({ file }))];
        setFotky(updatedFotky);
      } else {
        alert('Prosím, vyberte pouze obrázky (JPEG, PNG, GIF)');
      }
    }
  }

  const handleUpload = async () => {
    try {
      setUploading(true);
      setUploadError(null);

      // Only upload files that haven't been uploaded yet
      const uploadPromises = fotky
        .filter((item): item is { file: File } => 'file' in item)
        .map(async (item) => {
          try {
            const formData = new FormData();
            formData.append('file', item.file);
            
            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formData
            });

            if (!response.ok) {
              throw new Error('Upload failed');
            }

            const result = await response.json();
            return { id: result.id };
          } catch (error) {
            console.error('File upload error:', error);
            return null;
          }
        });

      const results = await Promise.all(uploadPromises);
      const validResults = results.filter((result): result is { id: string } => result !== null);
      
      setFotky(prev => [
        ...prev.filter(item => 'id' in item),  // keep existing server-side files
        ...validResults  // add new uploaded file IDs
      ]);

      setUploading(false);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Chyba při nahrávání souboru');
      setUploading(false);
    }
  }

  const handleDeleteFotka = async (index: number) => {
    const fotoToDelete = fotky[index];
    
    try {
      if (initialData) {
        const response = await fetch(`/api/auta/${initialData.id}/upload-foto?fotoId=${fotoToDelete.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Nepodařilo se smazat fotografii');
        }
      }

      // Remove from local state
      setFotky(prev => prev.filter((_, i) => i !== index))
    } catch (error) {
      console.error('Chyba při mazání fotografie:', error)
      setUploadError(error instanceof Error ? error.message : 'Chyba při mazání fotografie')
    }
  }

  const handleClose = () => {
    startTransition(() => {
      onOpenChangeClientAction(false)
    })
  }

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => startTransition(() => onOpenChangeClientAction(isOpen))}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Přidat nové vozidlo</DialogTitle>
          <DialogDescription>
            Vyplňte údaje o novém vozidle. Povinná pole jsou označena hvězdičkou.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="spz"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SPZ</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Zadejte SPZ" 
                      {...field} 
                      maxLength={MAX_SPZ_LENGTH}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    {field.value?.length || 0}/{MAX_SPZ_LENGTH} znaků
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="znacka"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Značka</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Zadejte značku" 
                      {...field} 
                      maxLength={MAX_ZNACKA_LENGTH}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    {field.value?.length || 0}/{MAX_ZNACKA_LENGTH} znaků
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Zadejte model" 
                      {...field} 
                      maxLength={MAX_MODEL_LENGTH}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    {field.value?.length || 0}/{MAX_MODEL_LENGTH} znaků
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rokVyroby"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rok výroby</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      value={field.value || ''}
                      onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="najezd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nájezd (km)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      value={field.value || ''}
                      onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stav"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stav</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte stav" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="aktivní">Aktivní</SelectItem>
                      <SelectItem value="servis">V servisu</SelectItem>
                      <SelectItem value="vyřazeno">Vyřazeno</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="datumSTK"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Datum STK</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "dd.MM.yyyy", { locale: cs })
                          ) : (
                            <span>Vyberte datum STK</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date ? date.toISOString() : '')}
                        initialFocus
                        locale={cs}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="poznamka"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poznámka</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Zde můžete napsat poznámky k vozidlu..."
                      className="resize-none h-20"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    {field.value?.length || 0}/{MAX_POZNAMKA_LENGTH} znaků
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Zrušit
              </Button>
              <Button type="submit">
                {initialData ? 'Aktualizovat' : 'Přidat'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AutoForm;