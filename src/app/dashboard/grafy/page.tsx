'use client'

import React from 'react'

export default function GrafyPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Grafy a statistiky</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Stav vozového parku</h2>
          </div>
          <div>
            {/* Graf pro stav vozidel (aktivní/servis/vyřazeno) */}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Náklady a výdaje</h2>
          </div>
          <div>
            {/* Graf pro finanční přehled */}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">STK Přehled</h2>
          </div>
          <div>
            {/* Graf pro STK statistiky */}
          </div>
        </div>
      </div>
    </div>
  )
}
