'use client'

import React, { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

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

  useEffect(() => {
    // Načtení dat o autech
    fetch('/api/auta')
      .then(res => res.json())
      .then(data => setAuta(data))
      .catch(err => console.error('Chyba při načítání aut:', err))

    // Načtení transakcí
    fetch('/api/transakce')
      .then(res => res.json())
      .then(data => setTransakce(data))
      .catch(err => console.error('Chyba při načítání transakcí:', err))
  }, [])

  // Data pro graf stavu vozového parku
  const stavVozidel = [
    { name: 'Aktivní', value: auta.filter(auto => auto.stav === 'aktivní').length },
    { name: 'Servis', value: auta.filter(auto => auto.stav === 'servis').length },
    { name: 'Vyřazeno', value: auta.filter(auto => auto.stav === 'vyřazeno').length }
  ]

  // Barvy pro grafy
  const COLORS = ['#00C49F', '#FFBB28', '#FF8042']

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Grafy a statistiky</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Stav vozového parku</h2>
          </div>
          <div className="flex justify-center">
            <PieChart width={300} height={300}>
              <Pie
                data={stavVozidel}
                cx={150}
                cy={150}
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {stavVozidel.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
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
              <Tooltip />
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
