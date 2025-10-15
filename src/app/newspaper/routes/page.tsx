'use client';

import { useState, useEffect } from 'react';
import { Map, Search, Filter, Calendar, Clock, MapPin, Truck, Users, BarChart3, Download, Plus } from 'lucide-react';
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

interface Route {
  id: string;
  name: string;
  district: string;
  status: 'draft' | 'planned' | 'active' | 'completed' | 'cancelled';
  startTime: string;
  endTime?: string;
  estimatedDuration: number;
  actualDuration?: number;
  dropPoints: number;
  completedDropPoints: number;
  vehicleId: string;
  driverId: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export default function NewspaperRoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    const fetchRoutes = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        const mockRoutes: Route[] = Array.from({ length: 25 }, (_, i) => {
          const statuses: Route['status'][] = ['draft', 'planned', 'active', 'completed', 'cancelled'];
          const status = statuses[i % statuses.length];
          const districts = ['Praha 1', 'Praha 2', 'Praha 3', 'Praha 4', 'Praha 5', 'Praha 6', 'Brno', 'Plzeň'];
          const district = districts[i % districts.length];
          const priorities: Route['priority'][] = ['low', 'medium', 'high'];
          const priority = priorities[i % priorities.length];
          
          const startTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
          const estimatedDuration = Math.floor(Math.random() * 120) + 60;
          const actualDuration = status === 'completed' ? Math.floor(Math.random() * 60) + estimatedDuration : undefined;
          const endTime = status === 'completed' ? new Date(startTime.getTime() + (actualDuration || estimatedDuration) * 60 * 1000) : undefined;
          
          return {
            id: `route-${i + 1}`,
            name: `Trasa ${String.fromCharCode(65 + (i % 26))}`,
            district,
            status,
            startTime: startTime.toISOString(),
            endTime: endTime?.toISOString(),
            estimatedDuration,
            actualDuration,
            dropPoints: Math.floor(Math.random() * 40) + 20,
            completedDropPoints: status === 'completed' ? Math.floor(Math.random() * 40) + 20 : 
                               status === 'active' ? Math.floor(Math.random() * 20) : 0,
            vehicleId: `vehicle-${i + 1}`,
            driverId: `driver-${(i % 10) + 1}`,
            priority,
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
          };
        });
        
        setRoutes(mockRoutes);
      } catch (error) {
        console.error('Error fetching routes:', error);
        toast({
          title: 'Chyba',
          description: 'Nepodařilo se načíst trasy',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRoutes();
  }, [toast]);

  const filteredRoutes = routes.filter(route => {
    const matchesSearch = searchQuery === '' || 
      route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.district.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || route.status === statusFilter;
    const matchesDistrict = districtFilter === 'all' || route.district === districtFilter;
    
    return matchesSearch && matchesStatus && matchesDistrict;
  });

  const getStatusColor = (status: Route['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Route['status']) => {
    switch (status) {
      case 'draft': return 'Návrh';
      case 'planned': return 'Naplánováno';
      case 'active': return 'Aktivní';
      case 'completed': return 'Dokončeno';
      case 'cancelled': return 'Zrušeno';
      default: return status;
    }
  };

  const getPriorityColor = (priority: Route['priority']) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: Route['priority']) => {
    switch (priority) {
      case 'low': return 'Nízká';
      case 'medium': return 'Střední';
      case 'high': return 'Vysoká';
      default: return priority;
    }
  };

  const stats = {
    total: routes.length,
    draft: routes.filter(r => r.status === 'draft').length,
    planned: routes.filter(r => r.status === 'planned').length,
    active: routes.filter(r => r.status === 'active').length,
    completed: routes.filter(r => r.status === 'completed').length,
    cancelled: routes.filter(r => r.status === 'cancelled').length
  };

  const districts = Array.from(new Set(routes.map(r => r.district))).sort();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Přehled tras</h2>
          <p className="text-muted-foreground">
            Správa a monitorování všech tras distribuce novin
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button asChild>
            <Link href="/newspaper/planning">
              <Plus className="h-4 w-4 mr-2" />
              Nová trasa
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="unified-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Celkem tras</p>
          </CardContent>
        </Card>
        <Card className="unified-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.draft}</div>
            <p className="text-sm text-muted-foreground">Návrhy</p>
          </CardContent>
        </Card>
        <Card className="unified-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.planned}</div>
            <p className="text-sm text-muted-foreground">Naplánováno</p>
          </CardContent>
        </Card>
        <Card className="unified-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-sm text-muted-foreground">Aktivní</p>
          </CardContent>
        </Card>
        <Card className="unified-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.completed}</div>
            <p className="text-sm text-muted-foreground">Dokončeno</p>
          </CardContent>
        </Card>
        <Card className="unified-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <p className="text-sm text-muted-foreground">Zrušeno</p>
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
                  placeholder="Hledat trasy..."
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
                  <SelectItem value="draft">Návrhy</SelectItem>
                  <SelectItem value="planned">Naplánováno</SelectItem>
                  <SelectItem value="active">Aktivní</SelectItem>
                  <SelectItem value="completed">Dokončeno</SelectItem>
                  <SelectItem value="cancelled">Zrušeno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Oblast</Label>
              <Select value={districtFilter} onValueChange={setDistrictFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Všechny oblasti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny oblasti</SelectItem>
                  {districts.map(district => (
                    <SelectItem key={district} value={district}>{district}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Routes List */}
      <Card className="unified-card">
        <CardHeader>
          <CardTitle>Trasy ({filteredRoutes.length})</CardTitle>
          <CardDescription>
            Zobrazeno {filteredRoutes.length} z {routes.length} tras
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse flex flex-col space-y-4 w-full">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="h-20 bg-gray-100 rounded-md w-full"></div>
                ))}
              </div>
            </div>
          ) : filteredRoutes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Map className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p>Žádné trasy odpovídající kritériím</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRoutes.map((route) => (
                <div 
                  key={route.id} 
                  className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-lg">{route.name}</h3>
                        <Badge className={getStatusColor(route.status)}>
                          {getStatusLabel(route.status)}
                        </Badge>
                        <Badge className={getPriorityColor(route.priority)}>
                          {getPriorityLabel(route.priority)}
                        </Badge>
                        <Badge variant="outline">{route.district}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Začátek: {new Date(route.startTime).toLocaleDateString('cs-CZ')}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>Doba: {route.estimatedDuration} min</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{route.dropPoints} míst</span>
                        </div>
                        <div className="flex items-center">
                          <Truck className="h-4 w-4 mr-2" />
                          <span>Vozidlo {route.vehicleId}</span>
                        </div>
                      </div>
                      
                      {(route.status === 'active' || route.status === 'completed') && (
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Průběh: {route.completedDropPoints} z {route.dropPoints}</span>
                            <span>{Math.round((route.completedDropPoints / route.dropPoints) * 100)}%</span>
                          </div>
                          <Progress 
                            value={Math.round((route.completedDropPoints / route.dropPoints) * 100)} 
                            className="h-2" 
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/newspaper/routes/${route.id}`}>
                          <Map className="h-4 w-4 mr-1" />
                          Detail
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Statistiky
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
