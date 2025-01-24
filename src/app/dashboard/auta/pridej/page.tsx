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
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">Přidat nové vozidlo</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6">
        <AutoForm 
          onSubmit={(data) => handleSubmit(data)} 
          onCloseAction={() => router.push('/dashboard/auta')} 
          onSuccessAction={() => router.push('/dashboard/auta')}
        />
      </div>
    </div>
  )
}
