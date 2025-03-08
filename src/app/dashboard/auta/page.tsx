'use client'

import { useState, useEffect, useTransition } from 'react'
import AutoTable from '@/components/dashboard/AutoTable'
import { AutoForm } from "@/components/forms/AutoForm"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from 'next/link'

function isSTKExpiring(datumSTK: string | null) {
  if (!datumSTK) return false
  const stk = new Date(datumSTK)
  const today = new Date()
  const monthBeforeExpiration = new Date(stk)
  monthBeforeExpiration.setMonth(monthBeforeExpiration.getMonth() - 1)
  return today >= monthBeforeExpiration && today <= stk
}

export default function AutoPage() {
  const [showForm, setShowForm] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [auta, setAuta] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSuccess = () => {
    setRefresh(prev => prev + 1)
    setShowForm(false)
  }

  const handleOpenChange = async (open: boolean) => {
    startTransition(() => {
      setShowForm(open)
    })
    return Promise.resolve()
  }

  useEffect(() => {
    const fetchAuta = async () => {
      try {
        const response = await fetch('/api/auta')
        
        if (!response.ok) {
          throw new Error('Chyba při načítání dat z API')
        }
        
        const data = await response.json()
        
        // Debug logging
        console.log('Raw data from API:', data[0]?.fotky?.length, 'photos');
        if (data[0]?.thumbnailFotoId) {
          const thumb = data[0].fotky.find((f: any) => f.id === data[0].thumbnailFotoId);
          console.log('Thumbnail found:', !!thumb, 'Has data:', !!thumb?.data);
        }
        
        // Process data to include thumbnail URLs
        const processedData = data.map((auto: any) => {
          // If thumbnailFotoId exists, use it
          if (auto.thumbnailFotoId) {
            return {
              ...auto,
              thumbnailUrl: `/api/auta/${auto.id}/fotky/${auto.thumbnailFotoId}`
            };
          }
          
          // If no thumbnailFotoId but photos exist, use the first photo
          if (auto.fotky && auto.fotky.length > 0) {
            const firstPhoto = auto.fotky[0];
            console.log('No thumbnail set, using first photo:', firstPhoto.id);
            
            return {
              ...auto,
              thumbnailFotoId: firstPhoto.id,
              thumbnailUrl: `/api/auta/${auto.id}/fotky/${firstPhoto.id}`
            };
          }
          
          // No photos at all
          return {
            ...auto,
            thumbnailUrl: undefined
          };
        })
        
        setAuta(Array.isArray(processedData) ? processedData : [])
        setError(null)
      } catch (error) {
        console.error('Chyba při načítání aut:', error)
        setError(error instanceof Error ? error.message : 'Neznámá chyba')
        setAuta([])
      }
    }
    fetchAuta()
  }, [refresh])

  const autaBliziciSeSTK = auta.filter(auto => isSTKExpiring(auto.datumSTK))

  return (
    <div className="container mx-auto py-10">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">Celkem aut</h3>
          <p className="text-2xl font-bold text-black">{auta.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">Aktivní</h3>
          <p className="text-2xl font-bold text-green-600">
            {auta.filter(a => a.stav === 'aktivní').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">V servisu</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {auta.filter(a => a.stav === 'servis').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">Vyřazené</h3>
          <p className="text-2xl font-bold text-red-600">
            {auta.filter(a => a.stav === 'vyřazeno').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">Průměrný nájezd</h3>
          <p className="text-2xl font-bold text-black">
            {auta.length > 0 
              ? Math.round(auta.reduce((acc, auto) => acc + auto.najezd, 0) / auta.length).toLocaleString()
              : 0} km
          </p>
        </div>
      </div>

      {autaBliziciSeSTK.length > 0 && (
        <div className="mb-6">
          {autaBliziciSeSTK.map(auto => (
            <div 
              key={auto.id}
              className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-2"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  ⚠️
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Blíží se STK u vozidla {auto.spz} ({auto.znacka} {auto.model}) - 
                    datum STK: {new Date(auto.datumSTK).toLocaleDateString('cs-CZ')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Správa vozidel</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Přidat auto
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <AutoTable 
          auta={auta}
          onRefresh={() => setRefresh(prev => prev + 1)}
        />
      </div>

      <AutoForm 
        open={showForm} 
        onOpenChangeClientAction={handleOpenChange}
        onSubmit={(data) => {
          console.log(data)
          handleSuccess()
        }}
      />
    </div>
  )
}