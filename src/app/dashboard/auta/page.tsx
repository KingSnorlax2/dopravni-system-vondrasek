'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import AutoTable from '@/components/dashboard/AutoTable'
import { AutoForm } from "@/components/forms/AutoForm"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { cs } from "date-fns/locale"
import { generateRandomVehicleData } from "@/lib/mock-data"

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
  const [isLoading, setIsLoading] = useState(true)

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

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/auta?_t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        setAuta(data);
      }
    } catch (error) {
      console.error('Error refreshing vehicles:', error);
      toast({
        title: "Chyba při načítání",
        description: "Nepodařilo se načíst seznam vozidel",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const autaBliziciSeSTK = auta.filter(auto => isSTKExpiring(auto.datumSTK))

  const handleAutoSubmit = async (newAuto: any) => {
    await refreshData() // Refetch the data to update the list
    const znacka = newAuto.znacka || 'Vozidlo';
    const model = newAuto.model || '';
    const spz = newAuto.spz || '';
    const rokVyroby = newAuto.rokVyroby || '';
    toast({
      title: "Vozidlo přidáno",
      description: `${znacka} ${model} ${rokVyroby ? `(${rokVyroby})` : ''} ${spz ? `- ${spz}` : ''} bylo úspěšně přidáno.`.replace(/\s+/g, ' ').trim(),
    })
  }

  async function addRandomVehicles() {
    try {
      const randomVehicles = generateRandomVehicleData(5); // Generate 5 random vehicles
      
      for (const vehicle of Array.isArray(randomVehicles) ? randomVehicles : [randomVehicles]) {
        const response = await fetch('/api/auta', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(vehicle),
        });
        
        if (!response.ok) {
          throw new Error('Failed to add random vehicle');
        }
      }
      
      toast({
        title: "Úspěch",
        description: "Náhodná vozidla byla přidána",
      });
      
      // Refresh the page or data
      window.location.reload();
    } catch (error) {
      console.error('Error adding random vehicles:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se přidat náhodná vozidla",
        variant: "destructive",
      });
    }
  }

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
        <Button onClick={addRandomVehicles} variant="outline" size="sm" className="ml-2">
          Přidat náhodná vozidla
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
          onRefresh={refreshData}
        />
      </div>

      <AutoForm 
        open={showForm} 
        onOpenChangeClientAction={handleOpenChange}
        onSubmit={handleAutoSubmit}
      />
    </div>
  )
}