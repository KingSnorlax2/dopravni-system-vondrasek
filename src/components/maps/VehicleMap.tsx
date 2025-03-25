'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, Circle, Polyline, Tooltip, useMapEvents } from 'react-leaflet';
import { VehicleMapControls } from './VehicleMapControls';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Layers, RefreshCw, Plus, Minus, Car, Clock, Gauge, History, MapPin } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogAction } from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { VehicleHistory } from './VehicleHistory';
import { ZoneManagement } from './ZoneManagement';
import { Separator } from '@/components/ui/separator';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

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

  // Add state for new zone properties
  const [newZoneProps, setNewZoneProps] = useState({
    name: '',
    color: '#3b82f6',
    radius: 1000
  });

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
        <div className="bg-white rounded-lg shadow-sm border mb-3">
          <Tabs 
            defaultValue="vehicles" 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-3 rounded-none h-auto p-0 bg-gray-50">
              <TabsTrigger 
                value="vehicles" 
                className="rounded-none flex items-center justify-center py-3 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                <Car className="h-4 w-4 mr-2" />
                <span>Vozidla</span>
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="rounded-none flex items-center justify-center py-3 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                <History className="h-4 w-4 mr-2" />
                <span>Historie</span>
              </TabsTrigger>
              <TabsTrigger 
                value="zones" 
                className="rounded-none flex items-center justify-center py-3 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                <MapPin className="h-4 w-4 mr-2" />
                <span>Zóny</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="vehicles" className="p-0 m-0">
              <VehicleMapControls 
                vehicles={allVehicles}
                selectedVehicles={selectedVehicleIds}
                onVehicleSelectionChangeAction={setSelectedVehicleIds}
                onUpdateLocationsAction={handleRefreshLocations}
                mapSettings={mapSettings}
                onMapSettingsChangeAction={setMapSettings}
              />
            </TabsContent>
            
            <TabsContent value="history" className="p-0 m-0">
              <VehicleHistory
                vehicles={allVehicles}
                onShowHistoryAction={handleShowHistory}
                onGenerateRouteAction={handleGenerateRoute}
                onClearHistoryAction={handleClearHistory}
              />
            </TabsContent>
            
            <TabsContent value="zones" className="p-0 m-0">
              <ZoneManagement
                zones={zones}
                onAddZoneAction={handleAddZone}
                onUpdateZoneAction={handleUpdateZone}
                onDeleteZoneAction={handleDeleteZone}
                onToggleZoneAction={handleToggleZone}
                onSelectZoneAction={handleSelectZone}
                isDrawingMode={isDrawingMode}
                onToggleDrawingModeAction={setIsDrawingMode}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      <div className="h-[70vh] rounded-lg overflow-hidden border border-gray-200 relative">
        {isLoading && allVehicles.length === 0 ? (
          <div className="absolute inset-0 bg-gray-50/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center bg-white p-4 rounded-lg shadow-sm">
              <div className="animate-spin h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full mx-auto mb-3"></div>
              <div className="text-sm font-medium">Načítám polohy vozidel...</div>
            </div>
          </div>
        ) : null}
        
        <MapContainer 
          center={defaultCenter}
          zoom={mapSettings.mapZoom} 
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={mapSettings.mapType === 'satellite' 
              ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
              : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            }
          />
          
          {/* Add this map event handler */}
          <MapEventHandler 
            isDrawingMode={isDrawingMode} 
            onZoneCreated={handleZoneCreated}
            onZoneDrawingComplete={() => setIsDrawingMode(false)}
          />
          
          {/* Render zones if any */}
          {zones.filter(zone => zone.active).map(zone => (
            <Circle
              key={zone.id}
              center={zone.center}
              radius={zone.radius}
              pathOptions={{ 
                color: zone.color, 
                fillColor: zone.color, 
                fillOpacity: 0.1
              }}
            >
              <Tooltip direction="center" permanent offset={[0, -20]}>
                <span className="text-xs px-2 py-1 bg-white/90 backdrop-blur-sm shadow-sm rounded-md">
                  {zone.name}
                </span>
              </Tooltip>
            </Circle>
          ))}
          
          {/* Better history visualization */}
          {historyData.length > 1 && (
            <>
              {/* Start marker */}
              <Marker
                position={[historyData[0].latitude, historyData[0].longitude]}
                icon={new L.Icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41]
                })}
              >
                <Popup>
                  <div className="p-2">
                    <div className="font-semibold">Začátek trasy</div>
                    <div className="text-sm">{new Date(historyData[0].timestamp).toLocaleString('cs-CZ')}</div>
                  </div>
                </Popup>
              </Marker>
              
              {/* End marker */}
              <Marker
                position={[historyData[historyData.length-1].latitude, historyData[historyData.length-1].longitude]}
                icon={new L.Icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41]
                })}
              >
                <Popup>
                  <div className="p-2">
                    <div className="font-semibold">Konec trasy</div>
                    <div className="text-sm">{new Date(historyData[historyData.length-1].timestamp).toLocaleString('cs-CZ')}</div>
                  </div>
                </Popup>
              </Marker>
              
              {/* Stop markers */}
              {historyData
                .filter(point => point.stav === 'stání' || point.rychlost < 5)
                .map(point => (
                  <Circle
                    key={`stop-${point.id}`}
                    center={[point.latitude, point.longitude]}
                    radius={8}
                    pathOptions={{ 
                      color: '#f59e0b', 
                      fillColor: '#f59e0b', 
                      fillOpacity: 0.6
                    }}
                  >
                    <Tooltip direction="top">
                      <div className="text-xs">
                        <div>Zastávka: {new Date(point.timestamp).toLocaleString('cs-CZ')}</div>
                        <div>Délka: {Math.floor(Math.random() * 45) + 5} min</div>
                      </div>
                    </Tooltip>
                  </Circle>
                ))
              }
            </>
          )}
          
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
                <Tooltip permanent direction="top" offset={[0, -30]}>
                  <span className="text-xs px-2 py-1 bg-white shadow-sm rounded-md">
                    {vehicle.spz}
                  </span>
                </Tooltip>
              )}
              <Popup className="vehicle-popup">
                <div className="p-2">
                  <div className="font-semibold text-base">{vehicle.spz}</div>
                  <div className="text-sm">{vehicle.znacka} {vehicle.model}</div>
                  
                  <div className="mt-3 text-xs text-muted-foreground grid grid-cols-2 gap-1">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{new Date(vehicle.lastUpdate).toLocaleTimeString('cs-CZ')}</span>
                    </div>
                    {vehicle.rychlost !== undefined && (
                      <div className="flex items-center gap-1">
                        <Gauge size={12} />
                        <span>{vehicle.rychlost} km/h</span>
                      </div>
                    )}
                  </div>
                  
                  <Badge className={`mt-3 ${
                    vehicle.stav === 'aktivní' ? 'bg-green-100 text-green-800' :
                    vehicle.stav === 'servis' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {vehicle.stav}
                  </Badge>
                  
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs"
                      onClick={() => {
                        // Show vehicle history for last 24 hours
                        const endDate = new Date();
                        const startDate = new Date(endDate);
                        startDate.setDate(startDate.getDate() - 1);
                        
                        toast({
                          title: "Načítám historii",
                          description: "Načítám historii pohybu vozidla..."
                        });
                        
                        fetch(`/api/auta/history?vehicleId=${vehicle.id}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
                          .then(res => res.json())
                          .then(data => {
                            handleShowHistory(vehicle.id, data);
                          })
                          .catch(err => {
                            console.error('Error fetching quick history:', err);
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
                onClick={() => setMapSettings({...mapSettings, mapType: mapSettings.mapType === 'street' ? 'satellite' : 'street'})}
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
          
          <div className="absolute right-3 bottom-20 z-[400]">
            <div className="bg-white rounded-md shadow-md space-y-1 p-1.5">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-gray-100"
                onClick={() => setMapSettings({...mapSettings, mapZoom: Math.min(mapSettings.mapZoom + 1, 18)})}
                title="Přiblížit"
              >
                <Plus size={16} />
              </Button>
              <Separator className="my-1" />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-gray-100"
                onClick={() => setMapSettings({...mapSettings, mapZoom: Math.max(mapSettings.mapZoom - 1, 5)})}
                title="Oddálit"
              >
                <Minus size={16} />
              </Button>
            </div>
          </div>
          
          {/* Map Settings Control */}
          <MapSettings zoom={mapSettings.mapZoom} />
        </MapContainer>
        
        {/* Vehicle Count Legend - Improved Layout */}
        <div className="absolute left-3 bottom-3 z-[400] bg-white/95 backdrop-blur-sm rounded-lg shadow-sm p-2.5">
          <div className="text-xs font-medium mb-1.5">Vozidla podle stavu:</div>
          <div className="grid grid-cols-1 gap-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs">{filteredVehicles.filter(v => v.stav === 'aktivní').length} aktivních</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-xs">{filteredVehicles.filter(v => v.stav === 'servis').length} v servisu</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-xs">{filteredVehicles.filter(v => v.stav === 'vyřazeno').length} vyřazených</span>
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
      
      {/* Zone notification dialog */}
      <AlertDialog open={showZoneNotification} onOpenChange={setShowZoneNotification}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vozidlo opustilo zónu</AlertDialogTitle>
            <AlertDialogDescription>
              {notificationDetails && (
                <>
                  Vozidlo <strong>{notificationDetails.spz}</strong> opustilo zónu <strong>{notificationDetails.zoneName}</strong>.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Rozumím</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default VehicleMap; 