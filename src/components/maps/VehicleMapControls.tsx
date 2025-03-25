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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  onUpdateLocationsAction: () => void;
  mapSettings: {
    refreshInterval: number;
    showLabels: boolean;
    mapZoom: number;
    mapType: string;
    clusterMarkers: boolean;
    showTraffic: boolean;
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

  // Handle status filter change
  const handleStatusFilterChange = (status: string, checked: boolean) => {
    setStatusFilter(prev => 
      checked 
        ? [...prev, status]
        : prev.filter(s => s !== status)
    );
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
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Hledat podle SPZ nebo modelu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={onUpdateLocationsAction}
                className="shrink-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={statusFilter.includes('aktivní') ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleStatusFilterChange('aktivní', !statusFilter.includes('aktivní'))}
              >
                Aktivní
              </Badge>
              <Badge 
                variant={statusFilter.includes('servis') ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleStatusFilterChange('servis', !statusFilter.includes('servis'))}
              >
                V servisu
              </Badge>
              <Badge 
                variant={statusFilter.includes('vyřazeno') ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleStatusFilterChange('vyřazeno', !statusFilter.includes('vyřazeno'))}
              >
                Vyřazené
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
                disabled={filteredVehicles.length === 0}
              >
                <Square className="h-4 w-4 mr-1" />
                Zrušit výběr
              </Button>
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
          <div className="space-y-4 pt-3 border-t">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Interval aktualizace</Label>
                <span className="text-sm font-medium">{mapSettings.refreshInterval}s</span>
              </div>
              <Slider
                value={[mapSettings.refreshInterval]}
                min={5}
                max={120}
                step={5}
                onValueChange={(value) => onMapSettingsChangeAction({
                  ...mapSettings,
                  refreshInterval: value[0]
                })}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Typ mapy</Label>
                <Select
                  value={mapSettings.mapType}
                  onValueChange={(value) => onMapSettingsChangeAction({
                    ...mapSettings,
                    mapType: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Typ mapy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="street">Standardní</SelectItem>
                    <SelectItem value="satellite">Satelitní</SelectItem>
                    <SelectItem value="terrain">Terénní</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Úroveň přiblížení</Label>
                <Select
                  value={mapSettings.mapZoom.toString()}
                  onValueChange={(value) => onMapSettingsChangeAction({
                    ...mapSettings,
                    mapZoom: parseInt(value)
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Přiblížení" />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(zoom => (
                      <SelectItem key={zoom} value={zoom.toString()}>
                        {zoom} {zoom < 8 ? '(Vzdálené)' : zoom > 12 ? '(Detailní)' : '(Střední)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-labels"
                  checked={mapSettings.showLabels}
                  onCheckedChange={(checked) => onMapSettingsChangeAction({
                    ...mapSettings,
                    showLabels: !!checked
                  })}
                />
                <Label htmlFor="show-labels">Zobrazit popisky vozidel</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cluster-markers"
                  checked={mapSettings.clusterMarkers}
                  onCheckedChange={(checked) => onMapSettingsChangeAction({
                    ...mapSettings,
                    clusterMarkers: !!checked
                  })}
                />
                <Label htmlFor="cluster-markers">Seskupovat blízké značky</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-traffic"
                  checked={mapSettings.showTraffic}
                  onCheckedChange={(checked) => onMapSettingsChangeAction({
                    ...mapSettings,
                    showTraffic: !!checked
                  })}
                />
                <Label htmlFor="show-traffic">Zobrazit dopravní informace</Label>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
} 