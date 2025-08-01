'use client'
import React, { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Auto {
  id: number
  spz: string
  stav: 'aktivní' | 'servis' | 'vyřazeno'
  datumSTK?: string
}

interface Transakce {
  id: number
  castka: number
  typ: 'prijem' | 'vydaj'
  datum: string
}

export default function GrafyPage() {
  const [auta, setAuta] = useState<Auto[]>([])
  const [transakce, setTransakce] = useState<Transakce[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const [autaRes, transakceRes] = await Promise.all([
        fetch('/api/auta'),
        fetch('/api/transakce')
      ])

      if (!autaRes.ok || !transakceRes.ok) {
        throw new Error('Chyba při načítání dat')
      }

      const [autaData, transakceData] = await Promise.all([
        autaRes.json(),
        transakceRes.json()
      ])

      setAuta(autaData)
      setTransakce(transakceData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nastala neočekávaná chyba')
      console.error('Chyba:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="text-gray-500">Načítání grafů...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="text-red-500">Chyba: {error}</div>
      </div>
    )
  }

  // Data pro graf stavu vozového parku
  const stavVozidel = [
    { name: 'Aktivní', value: auta.filter(auto => auto.stav === 'aktivní').length },
    { name: 'Servis', value: auta.filter(auto => auto.stav === 'servis').length },
    { name: 'Vyřazeno', value: auta.filter(auto => auto.stav === 'vyřazeno').length }
  ]

  // Barvy pro grafy
  const COLORS = ['#00C49F', '#FFBB28', '#FF8042']

  const formatCastka = (value: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK'
    }).format(value)
  }

  const CustomLegend = ({ payload }: any) => {
    const total = stavVozidel.reduce((sum, item) => sum + item.value, 0)
    
    return (
      <ul className="text-sm mt-4">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3" style={{ backgroundColor: entry.color }} />
            <span>{entry.value}: {((stavVozidel[index].value / total) * 100).toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Grafy a statistiky</h1>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          disabled={isLoading}
        >
          {isLoading ? 'Načítání...' : 'Obnovit data'}
        </button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Stav vozového parku</h2>
          </div>
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stavVozidel}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stavVozidel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend content={CustomLegend} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Náklady a výdaje</h2>
          </div>
          <div className="flex justify-center">
            <BarChart width={300} height={300} data={transakce}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="datum" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => formatCastka(value)}
                labelFormatter={(label: string) => new Date(label).toLocaleDateString('cs-CZ')}
              />
              <Legend />
              <Bar dataKey="castka" fill="#8884d8" />
            </BarChart>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">STK Přehled</h2>
          </div>
          <div>
            {/* Implementace STK grafu bude následovat */}
          </div>
        </div>
      </div>
    </div>
  )
}
