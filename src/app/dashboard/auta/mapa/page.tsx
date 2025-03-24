'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Import the map component with dynamic loading to avoid SSR issues with Leaflet
const VehicleMap = dynamic(() => import('@/components/maps/VehicleMap'), {
  ssr: false,
  loading: () => <div className="h-60 flex items-center justify-center">Načítání mapy...</div>
});

export default function VehicleMapPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Mapa vozidel</h1>
      <div className="mb-6">
        <p className="text-gray-600">
          Zde vidíte aktuální polohu vozidel ve vozovém parku. 
          Pomocí ovládacích prvků můžete vybrat, která vozidla chcete zobrazit a upravit nastavení mapy.
        </p>
      </div>
      
      <VehicleMap />
      
      <div className="mt-6 text-sm text-gray-500">
        <p>* Kliknutím na marker vozidla zobrazíte detailní informace</p>
        <p>* Zobrazují se pouze vozidla, která mají GPS modul a stav "aktivní"</p>
      </div>
    </div>
  );
} 