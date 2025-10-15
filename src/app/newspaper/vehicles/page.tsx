'use client';

import { useState, useEffect } from 'react';
import { Truck, Search, Filter, Fuel, Gauge, Calendar, MapPin, Users, AlertTriangle, CheckCircle, Clock, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { Label } from '@/components/ui/label';

interface Vehicle {
  id: string;
  spz: string;
  model: string;
  brand: string;
  year: number;
  status: 'ready' | 'in-use' | 'maintenance' | 'unavailable' | 'repair';
  fuelType: 'diesel' | 'petrol' | 'electric' | 'hybrid';
  fuelLevel: number;
  mileage: number;
  lastInspection: string;
  nextInspection: string;
  assignedDriver?: string;
  currentRoute?: string;
  department: string;
  notes?: string;
}

export default function NewspaperVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fuelTypeFilter, setFuelTypeFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    const fetchVehicles = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        const mockVehicles: Vehicle[] = Array.from({ length: 20 }, (_, i) => {
          const brands = ['Ford', 'Mercedes', 'Volkswagen', 'Fiat', 'Toyota', 'Renault', 'Peugeot'];
          const models = ['Transit', 'Sprinter', 'Transporter', 'Ducato', 'Proace', 'Master', 'Boxer'];
          const statuses: Vehicle['status'][] = ['ready', 'in-use', 'maintenance', 'unavailable', 'repair'];
          const fuelTypes: Vehicle['fuelType'][] = ['diesel', 'petrol', 'electric', 'hybrid'];
          const departments = ['Praha 1', 'Praha 2', 'Praha 3', 'Praha 4', 'Praha 5', 'Brno', 'Plzeň'];
          
          const brand = brands[i % brands.length];
          const model = models[i % models.length];
          const status = statuses[i % statuses.length];
          const fuelType = fuelTypes[i % fuelTypes.length];
          const department = departments[i % departments.length];
          
          const lastInspection = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
          const nextInspection = new Date(lastInspection.getTime() + 365 * 24 * 60 * 60 * 1000);
          
          return {
            id: `vehicle-${i + 1}`,
            spz: `${Math.floor(Math.random() * 9) + 1}${String.fromCharCode(65 + (i % 26))}${Math.floor(Math.random() * 9) + 1} ${Math.floor(Math.random() * 9999) + 1000}`,
            model: `${brand} ${model}`,
            brand,
            year: 2018 + (i % 6),
            status,
            fuelType,
            fuelLevel: Math.floor(Math.random() * 100),
            mileage: Math.floor(Math.random() * 200000) + 50000,
            lastInspection: lastInspection.toISOString(),
            nextInspection: nextInspection.toISOString(),
            assignedDriver: status === 'in-use' ? `Řidič ${i + 1}` : undefined,
            currentRoute: status === 'in-use' ? `Trasa ${String.fromCharCode(65 + (i % 26))}` : undefined,
            department,
            notes: i % 5 === 0 ? 'Poznámka k vozidlu' : undefined
          };
        });
        
        setVehicles(mockVehicles);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        toast({
          title: 'Chyba',
          description: 'Nepodařilo se načíst vozidla',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVehicles();
  }, [toast]);

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = searchQuery === '' || 
      vehicle.spz.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    const matchesFuelType = fuelTypeFilter === 'all' || vehicle.fuelType === fuelTypeFilter;
    
    return matchesSearch && matchesStatus && matchesFuelType;
  });

  const getStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'in-use': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'unavailable': return 'bg-gray-100 text-gray-800';
      case 'repair': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Vehicle['status']) => {
    switch (status) {
      case 'ready': return 'Připraveno';
      case 'in-use': return 'V provozu';
      case 'maintenance': return 'Údržba';
      case 'unavailable': return 'Nedostupné';
      case 'repair': return 'Oprava';
      default: return status;
    }
  };

  const getFuelTypeLabel = (fuelType: Vehicle['fuelType']) => {
    switch (fuelType) {
      case 'diesel': return 'Nafta';
      case 'petrol': return 'Benzín';
      case 'electric': return 'Elektro';
      case 'hybrid': return 'Hybrid';
      default: return fuelType;
    }
  };

  const getFuelLevelColor = (level: number) => {
    if (level < 20) return 'text-red-600';
    if (level < 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const stats = {
    total: vehicles.length,
    ready: vehicles.filter(v => v.status === 'ready').length,
    inUse: vehicles.filter(v => v.status === 'in-use').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    unavailable: vehicles.filter(v => v.status === 'unavailable').length,
    repair: vehicles.filter(v => v.status === 'repair').length
  };

  const fuelTypes = Array.from(new Set(vehicles.map(v => v.fuelType))).sort();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Správa vozidel</h2>
          <p className="text-muted-foreground">
            Přehled a správa všech vozidel pro distribuci novin
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Nové vozidlo
          </Button>
          <Button>
            <Truck className="h-4 w-4 mr-2" />
            Správa vozidel
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="unified-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Celkem vozidel</p>
          </CardContent>
        </Card>
        <Card className="unified-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.ready}</div>
            <p className="text-sm text-muted-foreground">Připraveno</p>
          </CardContent>
        </Card>
        <Card className="unified-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.inUse}</div>
            <p className="text-sm text-muted-foreground">V provozu</p>
          </CardContent>
        </Card>
        <Card className="unified-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.maintenance}</div>
            <p className="text-sm text-muted-foreground">Údržba</p>
          </CardContent>
        </Card>
        <Card className="unified-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.unavailable}</div>
            <p className="text-sm text-muted-foreground">Nedostupné</p>
          </CardContent>
        </Card>
        <Card className="unified-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.repair}</div>
            <p className="text-sm text-muted-foreground">Oprava</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="unified-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtry a vyhledávání
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Vyhledávání</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Hledat vozidla..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Všechny statusy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny statusy</SelectItem>
                  <SelectItem value="ready">Připraveno</SelectItem>
                  <SelectItem value="in-use">V provozu</SelectItem>
                  <SelectItem value="maintenance">Údržba</SelectItem>
                  <SelectItem value="unavailable">Nedostupné</SelectItem>
                  <SelectItem value="repair">Oprava</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Typ paliva</Label>
              <Select value={fuelTypeFilter} onValueChange={setFuelTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Všechny typy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny typy</SelectItem>
                  {fuelTypes.map(type => (
                    <SelectItem key={type} value={type}>{getFuelTypeLabel(type)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles List */}
      <Card className="unified-card">
        <CardHeader>
          <CardTitle>Vozidla ({filteredVehicles.length})</CardTitle>
          <CardDescription>
            Zobrazeno {filteredVehicles.length} z {vehicles.length} vozidel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse flex flex-col space-y-4 w-full">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="h-24 bg-gray-100 rounded-md w-full"></div>
                ))}
              </div>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p>Žádná vozidla odpovídající kritériím</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVehicles.map((vehicle) => (
                <div 
                  key={vehicle.id} 
                  className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-lg">{vehicle.spz}</h3>
                        <Badge className={getStatusColor(vehicle.status)}>
                          {getStatusLabel(vehicle.status)}
                        </Badge>
                        <Badge variant="outline">{vehicle.department}</Badge>
                        {vehicle.notes && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Poznámka
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Truck className="h-4 w-4 mr-2" />
                          <span>{vehicle.model} ({vehicle.year})</span>
                        </div>
                        <div className="flex items-center">
                          <Fuel className="h-4 w-4 mr-2" />
                          <span className={getFuelLevelColor(vehicle.fuelLevel)}>
                            {vehicle.fuelLevel}% {getFuelTypeLabel(vehicle.fuelType)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Gauge className="h-4 w-4 mr-2" />
                          <span>{vehicle.mileage.toLocaleString()} km</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>STK: {new Date(vehicle.nextInspection).toLocaleDateString('cs-CZ')}</span>
                        </div>
                      </div>
                      
                      {vehicle.assignedDriver && (
                        <div className="mt-2 flex items-center text-sm">
                          <Users className="h-4 w-4 mr-2 text-blue-600" />
                          <span className="text-blue-600">
                            {vehicle.assignedDriver} - {vehicle.currentRoute}
                          </span>
                        </div>
                      )}
                      
                      {vehicle.status === 'maintenance' && (
                        <div className="mt-2 flex items-center text-sm text-yellow-600">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>V údržbě do {new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('cs-CZ')}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Truck className="h-4 w-4 mr-1" />
                        Detail
                      </Button>
                      <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4 mr-1" />
                        Historie
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
