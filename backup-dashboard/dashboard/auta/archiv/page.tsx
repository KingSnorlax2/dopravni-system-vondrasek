'use client'

import { useState, useEffect } from 'react'

interface ArchivedAuto {
  id: number
  originalId: number
  spz: string
  znacka: string
  model: string
  rokVyroby: number
  najezd: number
  stav: string
  poznamka?: string
  datumSTK?: string
  datumArchivace: string
  duvodArchivace?: string
}

export default function AutoArchivPage() {
  const [archivedAutos, setArchivedAutos] = useState<ArchivedAuto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchArchivedAutos = async () => {
      try {
        const response = await fetch('/api/auta/archiv')
        if (!response.ok) {
          throw new Error('Chyba při načítání archivovaných vozidel')
        }
        const data = await response.json()
        setArchivedAutos(data)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Neznámá chyba')
      } finally {
        setLoading(false)
      }
    }

    fetchArchivedAutos()
  }, [])

  if (loading) {
    return <div className="text-center p-8 text-gray-600">Načítání archivovaných vozidel...</div>
  }

  if (error) {
    return <div className="text-red-600 p-8 bg-red-50 rounded-lg">{error}</div>
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Archiv vozidel</h1>
      
      {archivedAutos.length === 0 ? (
        <div className="text-center p-8 bg-gray-100 rounded-lg text-gray-600">
          <p>Žádná archivovaná vozidla</p>
          <p className="text-sm mt-2">Archivovaná vozidla se zobrazí po jejich přesunutí do archivu</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                  Datum archivace
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Důvod
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {archivedAutos.map((auto) => (
                <tr key={auto.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {auto.spz}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {auto.znacka} {auto.model} ({auto.rokVyroby})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {auto.najezd.toLocaleString()} km
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(auto.datumArchivace).toLocaleDateString('cs-CZ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {auto.duvodArchivace || 'Neuvedeno'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
