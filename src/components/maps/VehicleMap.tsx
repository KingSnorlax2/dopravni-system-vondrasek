'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, Circle } from 'react-leaflet';
import { VehicleMapControls } from './VehicleMapControls';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Layers, RefreshCw, Plus, Minus, Car, Clock } from 'lucide-react';

// Fix Leaflet default icon issues
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Define the vehicle location type
interface VehicleLocation {
  id: string;
  spz: string;
  znacka: string;
  model: string;
  latitude: number;
  longitude: number;
  lastUpdate: string;
  stav: 'aktivní' | 'servis' | 'vyřazeno';
}

// MapSettings component to update map settings
function MapSettings({ zoom }: { zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setZoom(zoom);
  }, [map, zoom]);
  
  return null;
}

// Fix for default markers in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

// Create custom icons for different vehicle statuses
const createCustomIcon = (status: 'aktivní' | 'servis' | 'vyřazeno') => {
  // Use Leaflet's default icon with different colors
  return new L.Icon.Default({
    iconUrl: status === 'servis'
      ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png'
      : status === 'vyřazeno'
      ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png'
      : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

export function VehicleMap() {
  const [allVehicles, setAllVehicles] = useState<VehicleLocation[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleLocation[]>([]);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [mapSettings, setMapSettings] = useState({
    refreshInterval: 30,
    showLabels: true,
    mapZoom: 7,
    mapType: 'street'
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Czech Republic center coordinates
  const defaultCenter: [number, number] = [49.8, 15.5];
  
  const fetchVehicleLocations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auta/locations');
      
      if (!response.ok) {
        throw new Error('Failed to fetch vehicle locations');
      }
      
      const data = await response.json();
      setAllVehicles(data);
      
      // Initialize selected vehicles if empty
      if (selectedVehicleIds.length === 0) {
        setSelectedVehicleIds(data.map((v: VehicleLocation) => v.id));
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching vehicle locations:', err);
      setError('Nepodařilo se načíst polohy vozidel. Zkuste to prosím později.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter vehicles based on selection
  useEffect(() => {
    setFilteredVehicles(
      allVehicles.filter(vehicle => selectedVehicleIds.includes(vehicle.id))
    );
  }, [allVehicles, selectedVehicleIds]);

  // Setup initial data fetching
  useEffect(() => {
    const loadAllVehicles = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/auta/all'); // Endpoint that returns ALL vehicles
        
        if (!response.ok) {
          throw new Error('Failed to fetch vehicles');
        }
        
        const data = await response.json();
        setAllVehicles(data);
        
        // Don't automatically select all vehicles - let the user choose
        if (selectedVehicleIds.length === 0) {
          // Optionally pre-select active vehicles only
          setSelectedVehicleIds(data.filter((v: { stav: string; }) => v.stav === 'aktivní').map((v: { id: any; }) => v.id));
          // Or comment the line above and uncomment below to show none initially
          // setSelectedVehicleIds([]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching vehicles:', err);
        setError('Nepodařilo se načíst vozidla. Zkuste to prosím později.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAllVehicles();
    
    // Setup refresh interval for location updates only
    intervalRef.current = setInterval(fetchVehicleLocations, mapSettings.refreshInterval * 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Update refresh interval when settings change
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(fetchVehicleLocations, mapSettings.refreshInterval * 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [mapSettings.refreshInterval]);

  // Handle updating vehicle locations
  const handleUpdateLocations = (updatedVehicles: VehicleLocation[]) => {
    setAllVehicles(prev => {
      const vehicleMap = new Map(prev.map(v => [v.id, v]));
      
      updatedVehicles.forEach(vehicle => {
        vehicleMap.set(vehicle.id, {
          ...vehicleMap.get(vehicle.id),
          ...vehicle
        });
      });
      
      return Array.from(vehicleMap.values());
    });
  };

  // Handle click on a vehicle marker
  const handleVehicleClick = (id: string) => {
    router.push(`/dashboard/auta/${id}`);
  };

  // Function to determine marker color based on vehicle status
  const getMarkerIcon = (vehicle: VehicleLocation) => {
    return createCustomIcon(vehicle.stav as 'aktivní' | 'servis' | 'vyřazeno');
  };

  // Current time displayed in header
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const handleRefreshLocations = () => {
    fetchVehicleLocations();
  };

  if (isLoading && allVehicles.length === 0) {
    return <div className="flex justify-center items-center h-80">Načítám polohy vozidel...</div>;
  }

  if (error && allVehicles.length === 0) {
    return (
      <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-700">
        <p>{error}</p>
        <button 
          onClick={fetchVehicleLocations}
          className="mt-2 px-3 py-1 bg-red-100 rounded-md hover:bg-red-200 text-sm"
        >
          Zkusit znovu
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Card className="p-2 flex justify-between items-center border-b">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowControls(!showControls)}
            className="h-8 px-2"
          >
            {showControls ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span className="ml-2">{showControls ? 'Skrýt ovládání' : 'Zobrazit ovládání'}</span>
          </Button>
          
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
            {filteredVehicles.length} vozidel
          </Badge>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Poslední aktualizace: {currentTime.toLocaleTimeString('cs-CZ')}
        </div>
      </Card>
      
      {showControls && (
        <VehicleMapControls 
          vehicles={allVehicles}
          selectedVehicles={selectedVehicleIds}
          onVehicleSelectionChangeAction={setSelectedVehicleIds}
          onUpdateLocationsAction={handleUpdateLocations}
          mapSettings={mapSettings}
          onMapSettingsChangeAction={setMapSettings}
        />
      )}
      
      <div className="h-[70vh] rounded-lg overflow-hidden border border-gray-200 relative">
        {isLoading && allVehicles.length === 0 ? (
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
            <div className="text-center">
              <Skeleton className="h-8 w-32 mx-auto mb-2" />
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
          </div>
        ) : null}
        
        <MapContainer 
          center={[49.8, 15.5]}
          zoom={mapSettings.mapZoom} 
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={mapSettings.mapType === 'satellite' 
              ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
              : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            }
          />
          
          {filteredVehicles.map((vehicle) => (
            <Marker
              key={vehicle.id}
              position={[vehicle.latitude, vehicle.longitude]}
              icon={getMarkerIcon(vehicle)}
              eventHandlers={{
                click: () => handleVehicleClick(vehicle.id)
              }}
            >
              {mapSettings.showLabels && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipContent>
                      {vehicle.spz} - {vehicle.znacka} {vehicle.model}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Popup>
                <div className="p-1">
                  <div className="font-semibold">{vehicle.spz}</div>
                  <div>{vehicle.znacka} {vehicle.model}</div>
                  
                  <div className="mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      Aktualizováno: {new Date(vehicle.lastUpdate).toLocaleTimeString('cs-CZ')}
                    </div>
                  </div>
                  
                  <Badge className={
                    vehicle.stav === 'aktivní' ? 'bg-green-100 text-green-800 mt-2' :
                    vehicle.stav === 'servis' ? 'bg-yellow-100 text-yellow-800 mt-2' :
                    'bg-gray-100 text-gray-800 mt-2'
                  }>
                    {vehicle.stav}
                  </Badge>
                  
                  <div className="mt-3">
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleVehicleClick(vehicle.id)}
                    >
                      Detail vozidla
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* Map Controls */}
          <div className="absolute right-2 top-2 z-[1000]">
            <div className="bg-white rounded-md shadow-md p-1 space-y-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setMapSettings({...mapSettings, mapType: mapSettings.mapType === 'street' ? 'satellite' : 'street'})}
              >
                <Layers size={16} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => handleRefreshLocations()}
              >
                <RefreshCw size={16} />
              </Button>
            </div>
          </div>
          
          <div className="absolute right-2 bottom-20 z-[1000]">
            <div className="bg-white rounded-md shadow-md p-1 space-y-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setMapSettings({...mapSettings, mapZoom: Math.min(mapSettings.mapZoom + 1, 18)})}
              >
                <Plus size={16} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setMapSettings({...mapSettings, mapZoom: Math.max(mapSettings.mapZoom - 1, 5)})}
              >
                <Minus size={16} />
              </Button>
            </div>
          </div>
        </MapContainer>
        
        {/* Vehicle Count Legend */}
        <div className="absolute left-2 bottom-2 z-[400] bg-white/90 rounded-md shadow-sm p-2">
          <div className="text-xs font-medium">Vozidla podle stavu:</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
              <span className="text-xs">{allVehicles.filter(v => v.stav === 'aktivní' && selectedVehicleIds.includes(v.id)).length} aktivních</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
              <span className="text-xs">{allVehicles.filter(v => v.stav === 'servis' && selectedVehicleIds.includes(v.id)).length} v servisu</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-gray-400 mr-1"></div>
              <span className="text-xs">{allVehicles.filter(v => v.stav === 'vyřazeno' && selectedVehicleIds.includes(v.id)).length} vyřazených</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Refresh status footer */}
      <div className="text-xs text-muted-foreground flex items-center justify-between">
        <span>Automatická aktualizace každých {mapSettings.refreshInterval} sekund</span>
        <Button variant="ghost" size="sm" className="h-6" onClick={handleRefreshLocations}>
          <RefreshCw size={12} className="mr-1" />
          Aktualizovat nyní
        </Button>
      </div>
    </div>
  );
}

export default VehicleMap; 