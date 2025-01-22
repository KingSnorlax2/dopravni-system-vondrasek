'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AutoForm from '@/components/forms/AutoForm'
import { QRCodeGenerator } from '@/components/QRCodeGenerator'

interface Foto {
  id: string
  data: string
  mimeType: string
}

interface Poznatek {
  id: string
  text: string
  createdAt: string
}

interface Auto {
  id: number
  spz: string
  znacka: string
  model: string
  rokVyroby: number
  najezd: number
  stav: 'aktivní' | 'servis' | 'vyřazeno'
  fotky: Foto[]
  datumSTK?: string
  poznamky: Poznatek[]
}

export default function DetailAuta() {
  const params = useParams()
  const router = useRouter()
  const [auto, setAuto] = useState<Auto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    spz: '',
    znacka: '',
    model: '',
    rokVyroby: '',
    najezd: '',
    stav: 'aktivní',
    datumSTK: ''
  })
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!params.id) return

    const fetchAuto = async () => {
      try {
        const response = await fetch(`/api/auta/${params.id}`)
        if (!response.ok) {
          throw new Error('Auto nebylo nalezeno')
        }
        const data = await response.json()
        console.log('Načtená data auta:', data)
        setAuto(data)
        setFormData({
          spz: data.spz || '',
          znacka: data.znacka || '',
          model: data.model || '',
          rokVyroby: data.rokVyroby ? data.rokVyroby.toString() : '',
          najezd: data.najezd ? data.najezd.toString() : '',
          stav: data.stav || 'aktivní',
          datumSTK: data.datumSTK ? new Date(data.datumSTK).toISOString().split('T')[0] : ''
        })
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Nastala chyba')
      } finally {
        setLoading(false)
      }
    }

    fetchAuto()
  }, [params.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitLoading(true)
    setSubmitError(null)

    try {
      const response = await fetch(`/api/auta/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          rokVyroby: parseInt(formData.rokVyroby, 10),
          najezd: parseInt(formData.najezd, 10),
          datumSTK: formData.datumSTK ? new Date(formData.datumSTK).toISOString() : null
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Chyba při aktualizaci auta')
      }

      const updatedData = await response.json()
      console.log('Aktualizovaná data:', updatedData) // Pro debug

      // Aktualizace stavu auto s novými daty
      setAuto(updatedData)

      // Znovu načteme data auta pro jistotu
      const refreshResponse = await fetch(`/api/auta/${params.id}`)
      if (refreshResponse.ok) {
        const refreshedData = await refreshResponse.json()
        setAuto(refreshedData)
        
        // Aktualizace formData s novými hodnotami
        setFormData({
          spz: refreshedData.spz || '',
          znacka: refreshedData.znacka || '',
          model: refreshedData.model || '',
          rokVyroby: refreshedData.rokVyroby ? refreshedData.rokVyroby.toString() : '',
          najezd: refreshedData.najezd ? refreshedData.najezd.toString() : '',
          stav: refreshedData.stav || 'aktivní',
          datumSTK: refreshedData.datumSTK ? new Date(refreshedData.datumSTK).toISOString().split('T')[0] : ''
        })
      }

      setIsEditModalOpen(false)
      setSubmitError(null)
    } catch (error) {
      console.error('Chyba při aktualizaci auta:', error)
      setSubmitError(error instanceof Error ? error.message : 'Nastala chyba při aktualizaci auta')
    } finally {
      setSubmitLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-xl">Načítání...</div>
  }

  if (!auto) {
    return <div className="text-center text-red-500 mt-10 text-xl">Auto nebylo nalezeno</div>
  }

  console.log('Aktuální stav auto:', auto)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Tlačítka pro návrat a úpravu auta */}
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <Link href="/dashboard/auta" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors text-center w-full sm:w-auto">
          Zpět na seznam aut
        </Link>
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors w-full sm:w-auto"
        >
          Upravit auto
        </button>
      </div>
      
      {/* Flexbox pro sekce Informace a Historie úprav */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {/* Základní informace o autě */}
        <div className="bg-white shadow-md rounded-lg p-6 flex-1">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">{auto.znacka} {auto.model} - {auto.spz}</h1>
          <div className="space-y-2">
            <p className="text-lg"><strong>Rok výroby:</strong> {auto.rokVyroby || 'Nenastaveno'}</p>
            <p className="text-lg"><strong>Najezd:</strong> {auto.najezd ? auto.najezd.toLocaleString() : 'N/A'} km</p>
            <p className="text-lg"><strong>Stav:</strong> {auto.stav ? auto.stav.charAt(0).toUpperCase() + auto.stav.slice(1) : 'N/A'}</p>
            <p className="text-lg"><strong>Datum STK:</strong> {auto.datumSTK ? new Date(auto.datumSTK).toLocaleDateString('cs-CZ') : 'Nenastaveno'}</p>
          </div>
        </div>

        {/* QR kód */}
        <div className="md:w-1/3">
          <QRCodeGenerator auto={auto} />
        </div>
      </div>

      {/* Sekce pro fotogalerii */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Fotogalerie</h2>
        <p className="text-gray-600">Tato sekce bude brzy dostupná.</p>
      </div>

      {/* Modální okno pro úpravu auta */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Upravit auto
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="spz" className="block text-gray-700">SPZ</label>
                <input
                  type="text"
                  name="spz"
                  value={formData.spz}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label htmlFor="znacka" className="block text-gray-700">Značka</label>
                <input
                  type="text"
                  name="znacka"
                  value={formData.znacka}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label htmlFor="model" className="block text-gray-700">Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="block text-gray-700">Rok výroby</label>
                <input
                  type="number"
                  name="rokVyroby"
                  value={formData.rokVyroby}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-3 py-2 mt-1"
                />
              </div>
              <div>
                <label className="block text-gray-700">Najezdy (km)</label>
                <input
                  type="number"
                  name="najezd"
                  value={formData.najezd}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-3 py-2 mt-1"
                />
              </div>
              <div>
                <label className="block text-gray-700">Stav</label>
                <select
                  name="stav"
                  value={formData.stav}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-3 py-2 mt-1"
                >
                  <option value="aktivní">Aktivní</option>
                  <option value="servis">Servis</option>
                  <option value="vyřazeno">Vyřazeno</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700">Datum STK</label>
                <input
                  type="date"
                  name="datumSTK"
                  value={formData.datumSTK}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 mt-1"
                />
              </div>
              {submitError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  <p>{submitError}</p>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className={`px-4 py-2 rounded transition-colors ${
                    submitLoading
                      ? 'bg-blue-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {submitLoading ? 'Aktualizace...' : 'Aktualizovat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}