'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AutoForm from '@/components/forms/AutoForm'
import { Auto } from '@/types/auto'

export default function PridejAutoPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [selectedCount, setSelectedCount] = useState(0)
  const [selectedToArchive, setSelectedToArchive] = useState<Auto[]>([])

  const handleSubmit = async (formData: any) => {
    try {
      const response = await fetch('/api/auta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const errorData = await response.json();
      if (!response.ok) {
        throw new Error(errorData.error || 'Chyba při ukládání vozidla')
      }

      setShowConfirmation(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Neznámá chyba')
    }
  }

  const handleArchive = async () => {
    try {
      const response = await fetch('/api/auta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-archive-request': 'true'
        },
        body: JSON.stringify({ ids: selectedToArchive.map(auto => auto.id) })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Chyba při archivaci vozidel');
      }

      router.push('/dashboard/auta');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Neznámá chyba při archivaci');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl max-h-full">
        <div className="relative bg-white rounded-lg shadow">
          <div className="flex items-start justify-between p-4 border-b rounded-t">
            <h1 className="text-2xl font-bold">Potvrdit archivaci</h1>
            <button 
              type="button" 
              onClick={() => router.push('/dashboard/auta')}
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                {error}
              </div>
            )}

            <p>Opravdu chcete archivovat vybraná vozidla? ({selectedCount} položek)</p>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => router.push('/dashboard/auta')}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Zrušit
              </button>
              <button
                onClick={handleArchive}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                disabled={selectedCount === 0}
              >
                Archivovat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
