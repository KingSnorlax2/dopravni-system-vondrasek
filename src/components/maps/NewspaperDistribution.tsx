'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { 
  Newspaper, Truck, Clock, CheckCircle, AlertTriangle, 
  Map as MapIcon, BarChart, FileText, Download, Upload
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DistributionRouteStatus {
  routeId: string;
  vehicleId: string;
  area: string;
  driver: string; 
  totalDrops: number;
  completedDrops: number;
  startTime: string;
  estimatedEndTime: string;
  actualEndTime?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed' | 'issue';
  lastUpdate: string;
}

interface DistributionZone {
  id: string;
  name: string;
  vehicleId: string;
  totalSubscribers: number;
  estimatedTime: number; // in minutes
  dropPoints: number;
  color: string;
}

interface NewspaperDistributionProps {
  vehicles: any[];
  onSelectVehicleAction: (vehicleId: string) => void;
  onAssignRouteAction: (vehicleId: string, routeId: string) => void;
  onHighlightZoneAction: (zoneId: string) => void;
}

export function NewspaperDistribution({
  vehicles,
  onSelectVehicleAction,
  onAssignRouteAction,
  onHighlightZoneAction
}: NewspaperDistributionProps) {
  const [distributionRoutes, setDistributionRoutes] = useState<DistributionRouteStatus[]>([]);
  const [distributionZones, setDistributionZones] = useState<DistributionZone[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState('active');
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);

  // Filter for newspaper delivery vehicles only
  useEffect(() => {
    // In a real app, you'd have a role or tag for newspaper delivery vehicles
    // For demo, we'll just assume the first 16 vehicles are for newspaper delivery
    setFilteredVehicles(vehicles.slice(0, 16));
  }, [vehicles]);

  // Simulate loading initial data
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Generate mock routes for demonstration
      const mockRoutes = Array.from({length: 16}, (_, i) => ({
        routeId: `route-${i+1}`,
        vehicleId: i < vehicles.length ? vehicles[i].id : `vehicle-${i+1}`,
        area: `Zóna ${i+1}`,
        driver: `Řidič ${i+1}`,
        totalDrops: Math.floor(Math.random() * 100) + 50,
        completedDrops: Math.floor(Math.random() * 50),
        startTime: `${Math.floor(Math.random() * 2) + 22}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
        estimatedEndTime: `${Math.floor(Math.random() * 4) + 2}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
        status: ['pending', 'in-progress', 'completed', 'delayed', 'issue'][Math.floor(Math.random() * 5)] as any,
        lastUpdate: new Date(Date.now() - Math.random() * 3600000).toISOString()
      }));
      
      // Generate mock zones
      const mockZones = Array.from({length: 16}, (_, i) => ({
        id: `zone-${i+1}`,
        name: `Distribuční zóna ${i+1}`,
        vehicleId: i < vehicles.length ? vehicles[i].id : `vehicle-${i+1}`,
        totalSubscribers: Math.floor(Math.random() * 500) + 200,
        estimatedTime: Math.floor(Math.random() * 120) + 60,
        dropPoints: Math.floor(Math.random() * 40) + 20,
        color: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#6366f1', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 7)]
      }));
      
      setDistributionRoutes(mockRoutes);
      setDistributionZones(mockZones);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handlePublishRoutes = () => {
    setIsPublishing(true);
    setPublishProgress(0);
    
    // Simulate publishing process
    const interval = setInterval(() => {
      setPublishProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsPublishing(false);
          toast({
            title: "Trasy publikovány",
            description: "Všechny distribuční trasy byly úspěšně odeslány do vozidel."
          });
          return 100;
        }
        return prev + 10;
      });
    }, 400);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <Badge variant="outline" className="bg-gray-100">Čeká</Badge>;
      case 'in-progress':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Probíhá</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Dokončeno</Badge>;
      case 'delayed':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Zpožděno</Badge>;
      case 'issue':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Problém</Badge>;
      default:
        return <Badge variant="outline">Neznámý</Badge>;
    }
  };

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-4 py-2.5 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center">
            <Newspaper className="h-4 w-4 mr-2" />
            Distribuce novin
          </CardTitle>
          <div className="text-xs text-muted-foreground">
            {new Date().toLocaleString('cs-CZ', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs defaultValue="active" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="active">Aktivní distribuce</TabsTrigger>
            <TabsTrigger value="planning">Plánování tras</TabsTrigger>
            <TabsTrigger value="statistics">Statistiky</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({length: 5}).map((_, i) => (
                  <div key={i} className="p-4 border rounded-md animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {distributionRoutes
                    .filter(route => ['pending', 'in-progress', 'delayed', 'issue'].includes(route.status))
                    .map(route => (
                      <div key={route.routeId} className="p-3 border rounded-md hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{route.area}</div>
                            <div className="text-sm text-muted-foreground">
                              Řidič: {route.driver}
                            </div>
                          </div>
                          {getStatusBadge(route.status)}
                        </div>
                        
                        <div className="mt-2">
                          <Progress 
                            value={(route.completedDrops / route.totalDrops) * 100} 
                            className="h-2"
                          />
                          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                            <span>{route.completedDrops} z {route.totalDrops} míst</span>
                            <span>{Math.round((route.completedDrops / route.totalDrops) * 100)}%</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>Začátek: {route.startTime}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>Konec: {route.estimatedEndTime}</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() => onSelectVehicleAction(route.vehicleId)}
                          >
                            <Truck className="h-3 w-3 mr-1" />
                            Zobrazit vozidlo
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() => {
                              const zone = distributionZones.find(z => z.name.includes(route.area));
                              if (zone) onHighlightZoneAction(zone.id);
                            }}
                          >
                            <MapIcon className="h-3 w-3 mr-1" />
                            Zobrazit zónu
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          
          <TabsContent value="planning">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Distribuční zóny pro dnešní noc</h3>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="h-8">
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    Import
                  </Button>
                  <Button variant="outline" size="sm" className="h-8">
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {distributionZones.map(zone => (
                    <div 
                      key={zone.id} 
                      className="p-3 border rounded-md hover:bg-gray-50"
                      style={{ borderLeftWidth: '4px', borderLeftColor: zone.color }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{zone.name}</div>
                        <Badge variant="outline">
                          {zone.totalSubscribers} odběratelů
                        </Badge>
                      </div>
                      
                      <div className="mt-2 text-sm text-muted-foreground">
                        <div className="grid grid-cols-2 gap-1">
                          <div>Počet zastávek: {zone.dropPoints}</div>
                          <div>Čas trasy: {zone.estimatedTime} min</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex justify-between items-center">
                        <Select
                          defaultValue={vehicles.find(v => v.id === zone.vehicleId)?.id}
                          onValueChange={(value) => {
                            // Update the assigned vehicle
                            onAssignRouteAction(value, zone.id);
                          }}
                        >
                          <SelectTrigger className="w-[180px] h-8 text-xs">
                            <SelectValue placeholder="Vybrat vozidlo" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredVehicles.map(vehicle => (
                              <SelectItem key={vehicle.id} value={vehicle.id}>
                                {vehicle.spz} - {vehicle.znacka}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-8"
                          onClick={() => onHighlightZoneAction(zone.id)}
                        >
                          <MapIcon className="h-4 w-4 mr-1" />
                          Zobrazit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <Separator className="my-4" />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Publikovat trasy</h3>
                    <p className="text-xs text-muted-foreground">
                      Odeslat všechny trasy do navigačních zařízení vozidel.
                    </p>
                  </div>
                  <Button
                    onClick={handlePublishRoutes}
                    disabled={isPublishing}
                    className="w-36"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Publikovat
                  </Button>
                </div>
                
                {isPublishing && (
                  <div className="space-y-1">
                    <Progress value={publishProgress} className="h-2" />
                    <div className="text-xs text-center text-muted-foreground">
                      Publikování tras... {publishProgress}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="statistics">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-3 bg-blue-50 border-blue-100">
                  <div className="text-blue-600 text-sm font-medium">Celkem tras</div>
                  <div className="text-2xl font-bold">{distributionRoutes.length}</div>
                </Card>
                <Card className="p-3 bg-green-50 border-green-100">
                  <div className="text-green-600 text-sm font-medium">Dokončeno</div>
                  <div className="text-2xl font-bold">
                    {distributionRoutes.filter(r => r.status === 'completed').length}
                  </div>
                </Card>
                <Card className="p-3 bg-yellow-50 border-yellow-100">
                  <div className="text-yellow-600 text-sm font-medium">Aktivní</div>
                  <div className="text-2xl font-bold">
                    {distributionRoutes.filter(r => r.status === 'in-progress').length}
                  </div>
                </Card>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="text-sm font-medium mb-3">Efektivita distribuce</h3>
                <div className="h-40 flex items-end space-x-2">
                  {Array.from({length: 7}).map((_, i) => {
                    const height = Math.floor(Math.random() * 60) + 20;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-blue-200 hover:bg-blue-300 transition-colors rounded-t"
                          style={{ height: `${height}%` }}
                        ></div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {
                            ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'][i]
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-3">
                  <h3 className="text-sm font-medium mb-2">Průměrná doba doručení</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Zóna 1-5</span>
                      <span className="text-xs font-medium">3h 12m</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Zóna 6-10</span>
                      <span className="text-xs font-medium">2h 48m</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Zóna 11-16</span>
                      <span className="text-xs font-medium">3h 05m</span>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-3">
                  <h3 className="text-sm font-medium mb-2">Počet zastávek</h3>
                  <div className="text-3xl font-bold">743</div>
                  <div className="text-sm text-muted-foreground">
                    Průměrně 46 na vozidlo
                  </div>
                </Card>
              </div>
              
              <div className="border rounded-md p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium">Report distribuce</h3>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-1" />
                    Exportovat PDF
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Kompletní report včetně detailů o trasách, časech doručení a
                  problémech během distribuce. Můžete jej stáhnout ve formátu PDF.
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 