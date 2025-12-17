'use client'

import { useState, useEffect } from 'react'

interface Auto {
  id: number
  spz: string
  znacka: string
  model: string
  rokVyroby: number
  najezd: number
  stav: string
  poznamka?: string
  datumSTK?: string
}

export default function ServisPage() {
  const [auta, setAuta] = useState<Auto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAuta = async () => {
      try {
        const response = await fetch('/api/auta?stav=servis')
        if (!response.ok) {
          throw new Error('Chyba při načítání vozidel')
        }
        const data = await response.json()
        setAuta(data.filter((auto: Auto) => auto.stav === 'servis'))
      } catch (error) {
        console.error('Chyba:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAuta()
  }, [])

  if (loading) {
    return <div className="text-center p-8">Načítání...</div>
  }

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">Vozidla v servisu</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SPZ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vozidlo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nájezd
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Poznámka
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Akce
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {auta.map((auto) => (
              <tr key={auto.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {auto.spz}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {auto.znacka} {auto.model} ({auto.rokVyroby})
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {auto.najezd.toLocaleString()} km
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {auto.poznamka || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/auta/${auto.id}`, {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            stav: 'aktivní'
                          })
                        })
                        
                        if (!response.ok) {
                          throw new Error('Chyba při aktualizaci stavu')
                        }
                        
                        // Refresh the list
                        const updatedAuta = auta.filter(a => a.id !== auto.id)
                        setAuta(updatedAuta)
                      } catch (error) {
                        console.error('Chyba:', error)
                      }
                    }}
                    className="text-purple-600 hover:text-purple-900"
                  >
                    Vrátit do provozu
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
