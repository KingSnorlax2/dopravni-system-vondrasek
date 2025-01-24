'use client'

import { useState, useEffect } from 'react'
import AutoTable from '@/components/dashboard/AutoTable'
import AutoForm from '@/components/forms/AutoForm'

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

  const handleSuccess = () => {
    setRefresh(prev => prev + 1)
    setShowForm(false)
  }

  useEffect(() => {
    const fetchAuta = async () => {
      try {
        const response = await fetch('/api/auta')
        
        if (!response.ok) {
          throw new Error('Chyba při načítání dat z API')
        }
        
        const data = await response.json()
        setAuta(Array.isArray(data) ? data : [])
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
    <div className="p-6">
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
        <h1 className="text-2xl font-bold text-black">Správa vozidel</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Přidat auto
        </button>
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

      {showForm && (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
          <AutoForm 
            onCloseAction={() => setShowForm(false)}
            onSuccessAction={handleSuccess}
          />
        </div>
      )}
    </div>
  )
}