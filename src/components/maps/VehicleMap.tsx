'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, Circle, Polyline, Tooltip, useMapEvents } from 'react-leaflet';
import { VehicleMapControls } from './VehicleMapControls';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Layers, RefreshCw, Plus, Minus, Car, Clock, Gauge, History, MapPin, Newspaper } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogAction } from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { VehicleHistory } from './VehicleHistory';
import { ZoneManagement } from './ZoneManagement';
import { Separator } from '@/components/ui/separator';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { NewspaperDistribution } from './NewspaperDistribution';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

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
  rychlost?: number;
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
  return new L.Icon({
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

// Add this component to handle map click events for zone creation
function MapEventHandler({ 
  isDrawingMode, 
  onZoneCreated,
  onZoneDrawingComplete 
}: { 
  isDrawingMode: boolean; 
  onZoneCreated: (center: [number, number]) => void;
  onZoneDrawingComplete: () => void;
}) {
  const map = useMapEvents({
    click: (e) => {
      if (isDrawingMode) {
        const { lat, lng } = e.latlng;
        onZoneCreated([lat, lng]);
        onZoneDrawingComplete();
      }
    }
  });
  
  return null;
}

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
    mapType: 'street',
    clusterMarkers: false,
    showTraffic: false
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Czech Republic center coordinates
  const defaultCenter: [number, number] = [49.8, 15.5];
  
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyVehicleId, setHistoryVehicleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('vehicles');

  const [zones, setZones] = useState<any[]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [showZoneNotification, setShowZoneNotification] = useState(false);
  const [notificationDetails, setNotificationDetails] = useState<{spz: string, zoneName: string} | null>(null);

  const mapRef = useRef<L.Map | null>(null);

  // Remove the mapContainerRef and use a simpler approach
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize Leaflet icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: markerIcon2x.src,
        iconUrl: markerIcon.src,
        shadowUrl: markerShadow.src,
      });
    }
  }, []);

  // Add state for new zone properties
  const [newZoneProps, setNewZoneProps] = useState({
    name: '',
    color: '#3b82f6',
    radius: 1000
  });

  const [highlightedZoneId, setHighlightedZoneId] = useState<string | null>(null);

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

  const handleShowHistory = (vehicleId: string, locations: any[]) => {
    setHistoryData(locations);
    setHistoryVehicleId(vehicleId);
    setActiveTab('history');
  };

  const handleGenerateRoute = (locations: any[]) => {
    // Implement route generation logic
    toast({
      title: "Trasa vygenerována",
      description: `Vygenerováno ${locations.length} bodů trasy`
    });
  };

  const handleClearHistory = () => {
    setHistoryData([]);
    setHistoryVehicleId(null);
  };

  const handleAddZone = (zone: any) => {
    const newZone = { 
      ...zone, 
      id: `zone-${Date.now()}`,
      active: true,
      notify: false
    };
    setZones([...zones, newZone]);
    toast({
      title: "Zóna vytvořena",
      description: `Zóna "${newZone.name}" byla úspěšně vytvořena`
    });
  };

  const handleUpdateZone = (updatedZone: any) => {
    setZones(zones.map(zone => zone.id === updatedZone.id ? updatedZone : zone));
  };

  const handleDeleteZone = (zoneId: string) => {
    setZones(zones.filter(zone => zone.id !== zoneId));
    toast({
      title: "Zóna smazána",
      description: "Zóna byla úspěšně odstraněna"
    });
  };

  const handleToggleZone = (zoneId: string, active: boolean) => {
    setZones(zones.map(zone => zone.id === zoneId ? { ...zone, active } : zone));
  };

  const handleSelectZone = (zoneId: string) => {
    const selectedZone = zones.find(zone => zone.id === zoneId);
    if (selectedZone && mapRef.current) {
      mapRef.current.setView([selectedZone.center[0], selectedZone.center[1]], 14);
    }
  };

  // Update the handler to use state variable instead
  const handleZoneCreated = (center: [number, number]) => {
    const newZone = {
      id: `zone-${Date.now()}`,
      name: newZoneProps.name || `Zóna ${zones.length + 1}`,
      color: newZoneProps.color || '#3b82f6',
      radius: newZoneProps.radius || 1000,
      center: center,
      active: true,
      notify: false
    };
    
    setZones([...zones, newZone]);
    toast({
      title: "Zóna vytvořena",
      description: `Zóna "${newZone.name}" byla úspěšně vytvořena`
    });
  };

  // Check if any vehicles are outside their assigned zones
  useEffect(() => {
    // Only check active zones with notifications enabled
    const activeNotifyZones = zones.filter(zone => zone.active && zone.notify);
    
    if (activeNotifyZones.length === 0) return;
    
    // Check each vehicle against all zones
    filteredVehicles.forEach(vehicle => {
      activeNotifyZones.forEach(zone => {
        // Calculate distance between vehicle and zone center
        const distance = calculateDistance(
          vehicle.latitude, 
          vehicle.longitude,
          zone.center[0],
          zone.center[1]
        );
        
        // If vehicle is outside zone radius
        if (distance > zone.radius / 1000) { // Convert radius from meters to km
          setShowZoneNotification(true);
          setNotificationDetails({
            spz: vehicle.spz,
            zoneName: zone.name
          });
        }
      });
    });
  }, [filteredVehicles, zones]);

  // Helper function to calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  useEffect(() => {
    if (mapRef.current && historyData.length > 1) {
      // Clear any existing routing controls
      mapRef.current.eachLayer(layer => {
        // Use type assertion with 'as any' to bypass TypeScript check
        if ((layer as any)._route) {
          mapRef.current?.removeLayer(layer);
        }
      });
      
      // Create waypoints from history data
      // For better performance, limit number of waypoints for routing
      const waypoints = historyData
        .filter((_, i, arr) => {
          // Use all points for small datasets, sample for larger ones
          return arr.length < 20 || i % Math.ceil(arr.length / 15) === 0 || i === 0 || i === arr.length - 1;
        })
        .map(point => L.latLng(point.latitude, point.longitude));
      
      // Create the routing control that follows roads
      const routingControl = (L.Routing.control as any)({
        waypoints,
        routeWhileDragging: false,
        showAlternatives: false,
        fitSelectedRoutes: true,
        show: false,
        lineOptions: {
          styles: [
            { color: '#3b82f6', opacity: 0.8, weight: 4 }
          ],
          addWaypoints: false,
          extendToWaypoints: true,
          missingRouteTolerance: 0
        },
        createMarker: () => null
      }).addTo(mapRef.current);
      
      return () => {
        if (mapRef.current) {
          mapRef.current.removeControl(routingControl);
        }
      };
    }
  }, [historyData]);

  const handleHighlightZone = (zoneId: string) => {
    setHighlightedZoneId(zoneId);
    
    // Find the zone
    const zone = zones.find(z => z.id === zoneId);
    if (zone && mapRef.current) {
      // Center map on the zone
      mapRef.current.setView([zone.center[0], zone.center[1]], 14);
      
      // Make the zone "pulse" to highlight it
      // You could add animation or different style here
      
      // After 2 seconds, remove the highlight
      setTimeout(() => {
        setHighlightedZoneId(null);
      }, 2000);
    }
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
    <div className="relative h-full w-full">
      {/* Vehicle control sidebar */}
      {showControls && (
        <VehicleMapControls 
          vehicles={allVehicles}
          selectedVehicles={selectedVehicleIds}
          onVehicleSelectionChangeAction={setSelectedVehicleIds}
          onUpdateLocationsAction={handleRefreshLocations}
          mapSettings={mapSettings}
          onMapSettingsChangeAction={setMapSettings}
        />
      )}
      
      {!showControls && (
        <Button
          variant="outline"
          className="absolute left-4 top-4 z-[1000] bg-white"
          onClick={() => setShowControls(true)}
        >
          <ChevronDown className="h-4 w-4 mr-2" />
          Vozidla
        </Button>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Chyba při načítání dat</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => fetchVehicleLocations()}>Zkusit znovu</Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {typeof window !== 'undefined' && (
        <MapContainer
          center={defaultCenter}
          zoom={mapSettings.mapZoom}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          ref={mapRef}
        >
          {/* Map Tiles */}
          {mapSettings.mapType === 'satellite' ? (
            <TileLayer
              url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              maxZoom={20}
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
              attribution="&copy; Google Maps"
            />
          ) : (
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          )}
          
          {/* Zones */}
          {zones.map((zone) => (
            <Circle
              key={zone.id}
              center={zone.center}
              radius={zone.radius}
              pathOptions={{
                color: zone.color,
                fillColor: zone.color,
                fillOpacity: 0.2,
                weight: highlightedZoneId === zone.id ? 4 : 2,
                dashArray: highlightedZoneId === zone.id ? '5, 5' : undefined,
              }}
              eventHandlers={{
                click: () => handleSelectZone(zone.id),
                mouseover: () => handleHighlightZone(zone.id),
                mouseout: () => setHighlightedZoneId(null),
              }}
            >
              {zone.name && (
                <Tooltip direction="center" permanent>
                  <span>{zone.name}</span>
                </Tooltip>
              )}
            </Circle>
          ))}

          {/* Map Settings */}
          <MapSettings zoom={mapSettings.mapZoom} />
          <ZoomControl position="bottomright" />

          {/* Vehicle markers */}
          {filteredVehicles.map((vehicle) => (
            <Marker
              key={vehicle.id}
              position={[vehicle.latitude, vehicle.longitude]}
              icon={getMarkerIcon(vehicle)}
              eventHandlers={{
                click: () => handleVehicleClick(vehicle.id),
              }}
            >
              {/* Only show tooltip if map is initialized and showLabels is enabled */}
              {mapSettings.showLabels && typeof window !== 'undefined' && (
                <Tooltip
                  direction="top"
                  offset={[0, -20]}
                  opacity={0.9}
                  permanent
                >
                  <span className="font-medium">{vehicle.spz}</span>
                </Tooltip>
              )}
              <Popup>
                <div className="py-1">
                  <h3 className="font-bold text-lg mb-2">{vehicle.znacka} {vehicle.model}</h3>
                  <div className="flex items-center mb-2">
                    <Badge
                      variant={
                        vehicle.stav === 'aktivní' ? 'success' :
                        vehicle.stav === 'servis' ? 'warning' : 'secondary'
                      }
                      className="mr-2"
                    >
                      {vehicle.stav}
                    </Badge>
                    <span className="text-sm text-gray-500">{vehicle.spz}</span>
                  </div>
                  <div className="mb-3 space-y-1">
                    {vehicle.rychlost !== undefined && (
                      <div className="flex items-center text-sm">
                        <Gauge className="h-4 w-4 mr-1 text-gray-500" />
                        <span>{Math.round(vehicle.rychlost)} km/h</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-1 text-gray-500" />
                      <span>{new Date(vehicle.lastUpdate).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                      <span>{vehicle.latitude.toFixed(5)}, {vehicle.longitude.toFixed(5)}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs"
                      onClick={() => {
                        fetch(`/api/auta/${vehicle.id}/history`)
                          .then(res => res.json())
                          .then(data => {
                            handleShowHistory(vehicle.id, data);
                          })
                          .catch(err => {
                            console.error("Failed to fetch history:", err);
                            toast({
                              title: "Chyba",
                              description: "Nepodařilo se načíst historii vozidla",
                              variant: "destructive"
                            });
                          });
                      }}
                    >
                      <History className="h-3.5 w-3.5 mr-1" />
                      Historie
                    </Button>
                    <Button 
                      size="sm" 
                      variant="default"
                      className="text-xs"
                      onClick={() => router.push(`/dashboard/auta/${vehicle.id}`)}
                    >
                      <Car className="h-3.5 w-3.5 mr-1" />
                      Detail
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* Map Controls - Improved Layout */}
          <div className="absolute right-3 top-3 z-[400]">
            <div className="bg-white rounded-md shadow-md space-y-1 p-1.5">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-gray-100"
                onClick={() => setMapSettings({...mapSettings, mapType: (mapSettings.mapType as 'street' | 'satellite') === 'street' ? 'satellite' : 'street'})}
                title={mapSettings.mapType === 'street' ? 'Přepnout na satelitní mapu' : 'Přepnout na standardní mapu'}
              >
                <Layers size={16} />
              </Button>
              <Separator className="my-1" />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-gray-100"
                onClick={() => handleRefreshLocations()}
                title="Aktualizovat polohy"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              </Button>
            </div>
          </div>
          
          {/* Map event handler for zone creation */}
          <MapEventHandler 
            isDrawingMode={isDrawingMode} 
            onZoneCreated={handleZoneCreated}
            onZoneDrawingComplete={() => setIsDrawingMode(false)}
          />
        </MapContainer>
      )}

      {showZoneNotification && notificationDetails && (
        <AlertDialog open={showZoneNotification} onOpenChange={setShowZoneNotification}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Vozidlo vstoupilo do zóny</AlertDialogTitle>
              <AlertDialogDescription>
                Vozidlo {notificationDetails.spz} právě vstoupilo do zóny {notificationDetails.zoneName}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction>Rozumím</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

export default VehicleMap; 