// Start of Selection
'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'

const autoSchema = z.object({
  spz: z.string().min(7, "SPZ musí mít minimálně 7 znaků"),
  znacka: z.string().min(2, "Značka musí mít alespoň 2 znaky"), 
  model: z.string().min(1, "Model je povinný"),
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
  onClose: () => void
  onSuccess: () => void
  editedAuto?: AutoFormData & { id: string }
}


export default function AutoForm({ onClose, onSuccess, editedAuto }: AutoFormProps) {
  const [uploading, setUploading] = useState(false)
  const [fotky, setFotky] = useState<{ id: string }[]>(editedAuto?.fotky || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
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
        fotky,
        rokVyroby: Number(data.rokVyroby),
        najezd: Number(data.najezd),
        datumSTK: data.datumSTK ? new Date(data.datumSTK).toISOString() : null
      }

      console.log('Odesílaná data:', submitData) // Přidáno pro debugování

      const response = await fetch(editedAuto 
        ? `/api/auta/${editedAuto.id}`
        : '/api/auta', {
        method: editedAuto ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const responseText = await response.text()
      console.log('Server response text:', responseText)
      console.log('Odpověď serveru:', responseText)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      let result
      try {
        result = JSON.parse(responseText)
      } catch (e) {
        throw new Error('Neplatná odpověď ze serveru')
      }

      console.log('Parsed response:', result)
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Chyba při ukládání:', error)
      setError(error.message || 'Nastala chyba při vytváření auta')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files?.length) return

    setUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        if (editedAuto?.id) {
          formData.append('autoId', editedAuto.id)
        }

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Nahrávání selhalo')
        }

        return data.id ? { id: data.id } : null
      })

      const results = await Promise.all(uploadPromises)
      const validResults = results.filter((result): result is { id: string } => result !== null)
      
      setFotky(prev => [...prev, ...validResults])
    } catch (error) {
      console.error('Upload error:', error)
      alert('Chyba při nahrávání souboru: ' + (error as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFotka = (index: number) => {
    setFotky(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          {editedAuto ? 'Upravit auto' : 'Přidat nové auto'}
        </h3>
        
        <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4">
          <div>
            <label htmlFor="spz" className="block text-sm font-medium text-black">SPZ</label>
            <input
              {...register("spz")}
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
            />
            {errors.spz && (
              <p className="mt-1 text-sm text-red-600">{errors.spz.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="znacka" className="block text-sm font-medium text-black">Značka</label>
            <input
              {...register("znacka")}
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
            />
            {errors.znacka && (
              <p className="mt-1 text-sm text-red-600">{errors.znacka.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="model" className="block text-sm font-medium text-black">Model</label>
            <input
              {...register("model")}
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
            />
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
            <label className="block text-sm font-medium text-black">Datum STK</label>
            <input
              type="date"
              {...register('datumSTK')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
              defaultValue={editedAuto?.datumSTK ? new Date(editedAuto.datumSTK).toISOString().split('T')[0] : ''}
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
                accept="image/*"
                multiple
                onChange={handleFileUpload}
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

            <div className="mt-4 grid grid-cols-3 gap-4">
              {fotky.map((fotka, index) => (
                <div key={fotka.id} className="relative w-24 h-24">
                  <Image
                    src={`/api/fotky/${fotka.id}`}
                    alt="Náhled"
                    fill
                    sizes="(max-width: 96px) 100vw, 96px"
                    className="rounded-md object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteFotka(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center z-10 hover:bg-red-600"
                    aria-label="Smazat fotku"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-black hover:bg-gray-50"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={uploading || isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isSubmitting ? 'Ukládání...' : editedAuto ? 'Uložit změny' : 'Přidat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}