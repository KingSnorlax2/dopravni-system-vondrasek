'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'

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
  datumSTK: z.string().optional()
})

type AutoFormData = z.infer<typeof autoSchema>

interface AutoFormProps {
  onCloseAction: () => void
  onSuccessAction: (data: any) => void
  editedAuto?: AutoFormData & { id: string }
  onSubmit?: (formData: AutoFormData) => Promise<void>
}

const MAX_SPZ_LENGTH = 8;
const MAX_ZNACKA_LENGTH = 20;
const MAX_MODEL_LENGTH = 20;

export default function AutoForm({ onCloseAction, onSuccessAction, editedAuto, onSubmit }: AutoFormProps) {
  const [uploading, setUploading] = useState(false)
  const [fotky, setFotky] = useState<{ id: string }[]>(editedAuto?.fotky || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showPicturesModal, setShowPicturesModal] = useState(false)
  const [currentPictures, setCurrentPictures] = useState<{ id: string }[]>([])
  const [selectedAuto, setSelectedAuto] = useState<AutoFormData & { id: string } | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset
  } = useForm<AutoFormData>({
    resolver: zodResolver(autoSchema),
    defaultValues: editedAuto || {
      spz: '',
      znacka: '',
      model: '',
      rokVyroby: new Date().getFullYear(),
      najezd: 0,
      stav: 'aktivní' as const,
      fotky: [],
      datumSTK: ''
    }
  })

  const handleSubmitForm = async (data: AutoFormData) => {
    setLoading(true)
    setError(null)
    try {
      const submitData = {
        ...data,
        rokVyroby: Number(data.rokVyroby),
        najezd: Number(data.najezd),
        datumSTK: data.datumSTK ? new Date(data.datumSTK).toISOString() : null,
        fotky
      }

      const url = editedAuto 
        ? `/api/auta/${editedAuto.id}`
        : '/api/auta';

      const response = await fetch(url, {
        method: editedAuto ? 'PATCH' : 'POST',
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

      if (onSuccessAction) {
        onSuccessAction(result.data);
      }

      if (onSubmit) {
        await onSubmit(data);
      }

      reset();
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setError(error.message || 'Nastala chyba při vytváření/úpravě vozidla');
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
    if (file) {
      handleFileUpload(e);
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files?.length) return

    setUploading(true)
    setUploadError(null)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type and size
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedTypes.includes(file.type)) {
          throw new Error('Podporované formáty jsou JPEG, PNG a GIF');
        }

        if (file.size > maxSize) {
          throw new Error('Maximální velikost souboru je 5 MB');
        }

        // Convert file to base64
        const reader = new FileReader();
        return new Promise<{ id: string } | null>((resolve, reject) => {
          reader.onloadend = async () => {
            const base64Data = reader.result as string;
            
            try {
              const response = await fetch(
                editedAuto 
                  ? `/api/auta/${editedAuto.id}/upload-foto`
                  : '/api/auta/0/upload-foto', 
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    data: base64Data.split(',')[1], // Remove data URL prefix
                    mimeType: file.type
                  })
                }
              );

              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Nepodařilo se nahrát fotografii');
              }

              const uploadedFoto = await response.json();
              resolve({ id: uploadedFoto.id });
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = () => reject(new Error('Chyba při čtení souboru'));
          reader.readAsDataURL(file);
        });
      });

      const results = await Promise.all(uploadPromises)
      const validResults = results.filter((result): result is { id: string } => result !== null)
      
      setFotky(prev => [...prev, ...validResults])
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'Chyba při nahrávání souboru')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFotka = async (index: number) => {
    const fotoToDelete = fotky[index];
    
    try {
      if (editedAuto) {
        const response = await fetch(`/api/auta/${editedAuto.id}/upload-foto?fotoId=${fotoToDelete.id}`, {
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

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          Přidat nové auto
        </h3>
        
        <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4">
          <div>
            <label htmlFor="spz" className="block text-sm font-medium text-black">SPZ</label>
            <input
              {...register("spz")}
              type="text"
              maxLength={MAX_SPZ_LENGTH}
              placeholder="Zadejte SPZ"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
            />
            <p className={`text-sm mt-1 ${
              watch('spz')?.length >= MAX_SPZ_LENGTH ? 'text-red-500' : 'text-gray-500'
            }`}>
              {watch('spz')?.length || 0}/{MAX_SPZ_LENGTH} znaků
            </p>
            {errors.spz && (
              <p className="mt-1 text-sm text-red-600">{errors.spz.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="znacka" className="block text-sm font-medium text-black">Značka</label>
            <input
              {...register("znacka")}
              type="text"
              maxLength={MAX_ZNACKA_LENGTH}
              placeholder="Zadejte značku"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
            />
            <p className={`text-sm mt-1 ${
              watch('znacka')?.length >= MAX_ZNACKA_LENGTH ? 'text-red-500' : 'text-gray-500'
            }`}>
              {watch('znacka')?.length || 0}/{MAX_ZNACKA_LENGTH} znaků
            </p>
            {errors.znacka && (
              <p className="mt-1 text-sm text-red-600">{errors.znacka.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="model" className="block text-sm font-medium text-black">Model</label>
            <input
              {...register("model")}
              type="text"
              maxLength={MAX_MODEL_LENGTH}
              placeholder="Zadejte model"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
            />
            <p className={`text-sm mt-1 ${
              watch('model')?.length >= MAX_MODEL_LENGTH ? 'text-red-500' : 'text-gray-500'
            }`}>
              {watch('model')?.length || 0}/{MAX_MODEL_LENGTH} znaků
            </p>
            {errors.model && (
              <p className="mt-1 text-sm text-red-600">{errors.model.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="rokVyroby" className="block text-sm font-medium text-black">Rok výroby</label>
            <input
              {...register("rokVyroby", { valueAsNumber: true })}
              type="number"
              min={1900}
              max={new Date().getFullYear()}
              defaultValue={new Date().getFullYear()}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
            />
            {errors.rokVyroby && (
              <p className="mt-1 text-sm text-red-600">{errors.rokVyroby.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="najezd" className="block text-sm font-medium text-black">Nájezd (km)</label>
            <input
              {...register("najezd", { valueAsNumber: true })}
              type="number"
              min={0}
              defaultValue={0}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
            />
            {errors.najezd && (
              <p className="mt-1 text-sm text-red-600">{errors.najezd.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="stav" className="block text-sm font-medium text-black">Stav</label>
            <select
              {...register("stav")}
              defaultValue="aktivní"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
            >
              <option value="aktivní">Aktivní</option>
              <option value="servis">V servisu</option>
              <option value="vyřazeno">Vyřazeno</option>
            </select>
            {errors.stav && (
              <p className="mt-1 text-sm text-red-600">{errors.stav.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="datumSTK" className="block text-sm font-medium text-black">Datum STK</label>
            <input
              type="date"
              {...register('datumSTK')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
              placeholder="dd.mm.rrrr"
            />
            {errors.datumSTK && (
              <p className="mt-1 text-sm text-red-600">{errors.datumSTK.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-black">Fotky</label>
            <div className="mt-1 flex items-center">
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif"
                onChange={handleFileChange}
                disabled={uploading}
                className="sr-only"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {uploading ? 'Nahrávání...' : 'Nahrát fotky'}
              </label>
            </div>

            <p className="text-sm text-gray-500 mt-1">
              {selectedFile ? `Soubor: ${selectedFile.name}` : 'Soubor nevybrán'}
            </p>

            {uploadError && (
              <p className="mt-2 text-sm text-red-600">{uploadError}</p>
            )}

            <div className="mt-4 grid grid-cols-3 gap-4">
              {fotky.map((fotka, index) => (
                <div key={fotka.id} className="relative w-24 h-24">
                  <Image
                    src={`/api/auta/${editedAuto?.id || '0'}/upload-foto?fotoId=${fotka.id}`}
                    alt="Náhled"
                    fill
                    sizes="(max-width: 96px) 100vw, 96px"
                    className="object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteFotka(index)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-xs"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mt-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCloseAction}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-black hover:bg-gray-50"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={uploading || isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
            >
              Přidat
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

