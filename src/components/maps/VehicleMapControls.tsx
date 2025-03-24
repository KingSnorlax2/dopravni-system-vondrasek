'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, Check, Car, RefreshCw, CheckSquare, Square, 
  Clock, Filter, Settings as SettingsIcon
} from "lucide-react";

interface Vehicle {
  id: string;
  spz: string;
  znacka: string;
  model: string;
  stav: 'aktivní' | 'servis' | 'vyřazeno';
}

interface VehicleMapControlsProps {
  vehicles: Vehicle[];
  selectedVehicles: string[];
  onVehicleSelectionChangeAction: (vehicleIds: string[]) => void;
  onUpdateLocationsAction: (vehicles: any[]) => void;
  mapSettings: {
    refreshInterval: number;
    showLabels: boolean;
    mapZoom: number;
    mapType: string;
  };
  onMapSettingsChangeAction: (settings: any) => void;
}

export function VehicleMapControls({
  vehicles,
  selectedVehicles,
  onVehicleSelectionChangeAction,
  onUpdateLocationsAction,
  mapSettings,
  onMapSettingsChangeAction
}: VehicleMapControlsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>(['aktivní', 'servis', 'vyřazeno']);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>(vehicles);

  // Filter vehicles when search query or status filters change
  useEffect(() => {
    const filtered = vehicles.filter(vehicle => {
      const matchesSearch = 
        searchQuery === "" || 
        vehicle.spz.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${vehicle.znacka} ${vehicle.model}`.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter.includes(vehicle.stav);
      
      return matchesSearch && matchesStatus;
    });
    
    setFilteredVehicles(filtered);
  }, [vehicles, searchQuery, statusFilter]);

  // Handle checkbox change for an individual vehicle
  const handleVehicleCheckboxChange = (vehicleId: string, checked: boolean) => {
    const newSelection = checked
      ? [...selectedVehicles, vehicleId]
      : selectedVehicles.filter(id => id !== vehicleId);
    
    onVehicleSelectionChangeAction(newSelection);
  };

  // Handle select all / none for the filtered vehicles
  const handleSelectAllFiltered = (select: boolean) => {
    if (select) {
      // Add all filtered vehicles to selection (avoiding duplicates)
      const newSelection = Array.from(
        new Set([...selectedVehicles, ...filteredVehicles.map(v => v.id)])
      );
      onVehicleSelectionChangeAction(newSelection);
    } else {
      // Remove all filtered vehicles from selection
      const filteredIds = new Set(filteredVehicles.map(v => v.id));
      const newSelection = selectedVehicles.filter(id => !filteredIds.has(id));
      onVehicleSelectionChangeAction(newSelection);
    }
  };

  // Count selected vehicles in the current filtered list
  const selectedFilteredCount = filteredVehicles.filter(
    v => selectedVehicles.includes(v.id)
  ).length;

  // Status filter counts
  const statusCounts = {
    'aktivní': vehicles.filter(v => v.stav === 'aktivní').length,
    'servis': vehicles.filter(v => v.stav === 'servis').length,
    'vyřazeno': vehicles.filter(v => v.stav === 'vyřazeno').length
  };

  // Add this function to VehicleMapControls
  const handleSelectAll = () => {
    // Select all vehicles regardless of current filter
    onVehicleSelectionChangeAction(vehicles.map(v => v.id));
  };

  return (
    <Card className="p-0">
      <Tabs defaultValue="vehicles" className="w-full">
        <div className="flex border-b">
          <TabsList className="w-full rounded-none h-auto p-0">
            <TabsTrigger 
              value="vehicles" 
              className="rounded-none flex-1 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <Car className="h-4 w-4 mr-2" />
              Vozidla
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="rounded-none flex-1 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <SettingsIcon className="h-4 w-4 mr-2" />
              Nastavení
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="vehicles" className="p-4 space-y-4">
          {/* Search and filters */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Hledat podle SPZ nebo modelu..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center flex-wrap gap-2">
              <Label className="text-sm font-medium mr-2">Stav:</Label>
              <Badge 
                variant={statusFilter.includes('aktivní') ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setStatusFilter(prev => 
                  prev.includes('aktivní') 
                    ? prev.filter(s => s !== 'aktivní') 
                    : [...prev, 'aktivní']
                )}
              >
                Aktivní ({statusCounts['aktivní']})
              </Badge>
              <Badge 
                variant={statusFilter.includes('servis') ? "default" : "outline"}
                className="cursor-pointer bg-yellow-500 hover:bg-yellow-600"
                onClick={() => setStatusFilter(prev => 
                  prev.includes('servis') 
                    ? prev.filter(s => s !== 'servis') 
                    : [...prev, 'servis']
                )}
              >
                V servisu ({statusCounts['servis']})
              </Badge>
              <Badge 
                variant={statusFilter.includes('vyřazeno') ? "default" : "outline"}
                className="cursor-pointer bg-gray-500 hover:bg-gray-600"
                onClick={() => setStatusFilter(prev => 
                  prev.includes('vyřazeno') 
                    ? prev.filter(s => s !== 'vyřazeno') 
                    : [...prev, 'vyřazeno']
                )}
              >
                Vyřazené ({statusCounts['vyřazeno']})
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleSelectAllFiltered(true)}
                disabled={filteredVehicles.length === 0}
              >
                <CheckSquare className="h-4 w-4 mr-1" />
                Vybrat vše
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleSelectAllFiltered(false)}
                disabled={selectedFilteredCount === 0}
              >
                <Square className="h-4 w-4 mr-1" />
                Zrušit výběr
              </Button>
              <Badge>
                Vybráno: {selectedVehicles.length} z {vehicles.length}
              </Badge>
            </div>
          </div>
          
          {/* Vehicle list */}
          <div className="border rounded-md">
            <ScrollArea className="h-[300px]">
              <div className="p-2 space-y-1">
                {filteredVehicles.length > 0 ? (
                  filteredVehicles.map((vehicle) => (
                    <div 
                      key={vehicle.id}
                      className={`p-2 rounded-md flex items-center transition-colors ${
                        selectedVehicles.includes(vehicle.id) 
                          ? 'bg-primary-foreground' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Checkbox 
                        id={`vehicle-${vehicle.id}`}
                        checked={selectedVehicles.includes(vehicle.id)}
                        onCheckedChange={(checked) => 
                          handleVehicleCheckboxChange(vehicle.id, !!checked)
                        }
                        className="mr-3"
                      />
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center justify-between">
                          <Label 
                            htmlFor={`vehicle-${vehicle.id}`}
                            className="font-medium cursor-pointer"
                          >
                            {vehicle.spz}
                          </Label>
                          <Badge variant="outline" className={`text-xs ${
                            vehicle.stav === 'aktivní' ? 'bg-green-100 text-green-800 border-green-200' :
                            vehicle.stav === 'servis' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {vehicle.stav}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {vehicle.znacka} {vehicle.model}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    {searchQuery || statusFilter.length < 3 
                      ? "Žádná vozidla neodpovídají vašemu filtru." 
                      : "Žádná vozidla k zobrazení."}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="p-4 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Interval aktualizace (sekundy)</Label>
              <div className="flex items-center gap-4">
                <Slider 
                  value={[mapSettings.refreshInterval]} 
                  min={5} 
                  max={120} 
                  step={5}
                  onValueChange={(value) => onMapSettingsChangeAction({ ...mapSettings, refreshInterval: value[0] })}
                />
                <span className="min-w-[3ch] text-right">{mapSettings.refreshInterval}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox 
                id="showLabels" 
                checked={mapSettings.showLabels}
                onCheckedChange={(checked) => onMapSettingsChangeAction({ ...mapSettings, showLabels: !!checked })}
              />
              <Label htmlFor="showLabels">Zobrazit popisky vozidel</Label>
            </div>
            
            <div className="space-y-2">
              <Label>Přiblížení mapy</Label>
              <div className="flex items-center gap-4">
                <Slider 
                  value={[mapSettings.mapZoom]} 
                  min={5} 
                  max={18} 
                  step={1}
                  onValueChange={(value) => onMapSettingsChangeAction({ ...mapSettings, mapZoom: value[0] })}
                />
                <span className="min-w-[3ch] text-right">{mapSettings.mapZoom}x</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Typ mapy</Label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="mapTypeStreet" 
                    checked={mapSettings.mapType === 'street'}
                    onCheckedChange={() => onMapSettingsChangeAction({ ...mapSettings, mapType: 'street' })}
                  />
                  <Label htmlFor="mapTypeStreet">Silniční</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="mapTypeSatellite" 
                    checked={mapSettings.mapType === 'satellite'}
                    onCheckedChange={() => onMapSettingsChangeAction({ ...mapSettings, mapType: 'satellite' })}
                  />
                  <Label htmlFor="mapTypeSatellite">Satelitní</Label>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
} 