'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AutoForm from '@/components/forms/AutoForm'

export default function PridejAutoPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: any) => {
    try {
      const response = await fetch('/api/auta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Chyba při ukládání vozidla')
      }

      router.push('/dashboard/auta')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Neznámá chyba')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl max-h-full">
        <div className="relative bg-white rounded-lg shadow-xl">
          <div className="flex items-start justify-between p-4 border-b rounded-t">
            <h1 className="text-2xl font-bold">Přidat nové vozidlo</h1>
            <button 
              type="button" 
              onClick={() => router.push('/dashboard/auta')}
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center"
            >
              ✕
            </button>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <AutoForm 
              onSubmit={(data) => handleSubmit(data)} 
              onCloseAction={() => router.push('/dashboard/auta')} 
              onSuccessAction={() => router.push('/dashboard/auta')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
