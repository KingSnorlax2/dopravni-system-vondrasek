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
  datumSTK?: string
}

export default function STKPage() {
  const [auta, setAuta] = useState<Auto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAuta = async () => {
      try {
        const response = await fetch('/api/auta')
        if (!response.ok) {
          throw new Error('Chyba při načítání vozidel')
        }
        const data = await response.json()
        // Sort by STK date
        const sortedAuta = data.sort((a: Auto, b: Auto) => {
          if (!a.datumSTK) return 1
          if (!b.datumSTK) return -1
          return new Date(a.datumSTK).getTime() - new Date(b.datumSTK).getTime()
        })
        setAuta(sortedAuta)
      } catch (error) {
        console.error('Chyba:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAuta()
  }, [])

  const getSTKStatus = (datumSTK?: string) => {
    if (!datumSTK) return { text: 'Chybí STK', color: 'text-red-600' }
    
    const stk = new Date(datumSTK)
    const today = new Date()
    const monthBeforeExpiration = new Date(stk)
    monthBeforeExpiration.setMonth(monthBeforeExpiration.getMonth() - 1)
    
    if (today > stk) {
      return { text: 'Prošlá STK', color: 'text-red-600' }
    }
    if (today >= monthBeforeExpiration) {
      return { text: 'Blíží se STK', color: 'text-yellow-600' }
    }
    return { text: 'Platná STK', color: 'text-green-600' }
  }

  if (loading) {
    return <div className="text-center p-8">Načítání...</div>
  }

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">Přehled STK</h1>
      
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
                Datum STK
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stav
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Akce
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {auta.map((auto) => {
              const stkStatus = getSTKStatus(auto.datumSTK)
              return (
                <tr key={auto.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {auto.spz}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {auto.znacka} {auto.model} ({auto.rokVyroby})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {auto.datumSTK ? new Date(auto.datumSTK).toLocaleDateString('cs-CZ') : '-'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${stkStatus.color}`}>
                    {stkStatus.text}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={async () => {
                        const newDate = prompt('Zadejte nové datum STK (RRRR-MM-DD):', 
                          auto.datumSTK?.split('T')[0] || new Date().toISOString().split('T')[0])
                        
                        if (newDate && /^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
                          try {
                            const response = await fetch(`/api/auta/${auto.id}`, {
                              method: 'PATCH',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                datumSTK: new Date(newDate).toISOString()
                              })
                            })
                            
                            if (!response.ok) {
                              throw new Error('Chyba při aktualizaci STK')
                            }
                            
                            const updatedAuto = { ...auto, datumSTK: newDate }
                            setAuta(auta.map(a => a.id === auto.id ? updatedAuto : a))
                          } catch (error) {
                            console.error('Chyba:', error)
                          }
                        }
                      }}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      Upravit STK
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
