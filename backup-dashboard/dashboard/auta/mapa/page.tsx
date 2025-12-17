'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, AlertTriangle } from 'lucide-react';

// Fix the dynamic import with proper error handling
const VehicleMap = dynamic(() => import('@/components/maps/VehicleMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
      <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
      <span className="ml-2">Načítání mapy...</span>
    </div>
  )
});

// Make sure this component is properly exported and accessible
export default function VehicleMapPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Mapa vozidel</h1>
      <div className="h-[calc(100vh-200px)] bg-white rounded-lg shadow">
        <VehicleMap />
      </div>
    </div>
  );
} 