'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Filter, Clock, MapPin, Truck, Award, AlertTriangle, CheckCircle, Phone, Mail, Calendar, TrendingUp, Plus } from 'lucide-react';
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

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  photo?: string;
  status: 'available' | 'on-duty' | 'off-duty' | 'sick' | 'vacation' | 'training';
  department: string;
  position: string;
  hireDate: string;
  performance: number;
  totalRoutes: number;
  completedRoutes: number;
  totalDeliveries: number;
  averageDeliveryTime: number;
  onTimeRate: number;
  currentRoute?: string;
  currentVehicle?: string;
  lastActive: string;
  notes?: string;
}

export default function NewspaperDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    const fetchDrivers = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        const mockDrivers: Driver[] = Array.from({ length: 25 }, (_, i) => {
          const statuses: Driver['status'][] = ['available', 'on-duty', 'off-duty', 'sick', 'vacation', 'training'];
          const departments = ['Praha 1', 'Praha 2', 'Praha 3', 'Praha 4', 'Praha 5', 'Brno', 'Plzeň'];
          const positions = ['Řidič', 'Senior řidič', 'Vedoucí řidič', 'Instruktor'];
          
          const status = statuses[i % statuses.length];
          const department = departments[i % departments.length];
          const position = positions[i % positions.length];
          
          const hireDate = new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000);
          const performance = Math.floor(Math.random() * 30) + 70;
          const totalRoutes = Math.floor(Math.random() * 200) + 50;
          const completedRoutes = Math.floor(Math.random() * totalRoutes * 0.9) + totalRoutes * 0.1;
          const totalDeliveries = Math.floor(Math.random() * 1000) + 200;
          const averageDeliveryTime = Math.floor(Math.random() * 60) + 90;
          const onTimeRate = Math.floor(Math.random() * 20) + 80;
          
          return {
            id: `driver-${i + 1}`,
            name: `Řidič ${i + 1}`,
            email: `driver${i + 1}@company.com`,
            phone: `+420 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100}`,
            photo: i % 5 === 0 ? undefined : `/avatars/driver-${(i % 10) + 1}.jpg`,
            status,
            department,
            position,
            hireDate: hireDate.toISOString(),
            performance,
            totalRoutes,
            completedRoutes: Math.floor(completedRoutes),
            totalDeliveries,
            averageDeliveryTime,
            onTimeRate,
            currentRoute: status === 'on-duty' ? `Trasa ${String.fromCharCode(65 + (i % 26))}` : undefined,
            currentVehicle: status === 'on-duty' ? `Vozidlo ${i + 1}` : undefined,
            lastActive: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
            notes: i % 7 === 0 ? 'Poznámka k řidiči' : undefined
          };
        });
        
        setDrivers(mockDrivers);
      } catch (error) {
        console.error('Error fetching drivers:', error);
        toast({
          title: 'Chyba',
          description: 'Nepodařilo se načíst řidiče',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDrivers();
  }, [toast]);

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = searchQuery === '' || 
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || driver.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const getStatusColor = (status: Driver['status']) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'on-duty': return 'bg-blue-100 text-blue-800';
      case 'off-duty': return 'bg-gray-100 text-gray-800';
      case 'sick': return 'bg-red-100 text-red-800';
      case 'vacation': return 'bg-purple-100 text-purple-800';
      case 'training': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Driver['status']) => {
    switch (status) {
      case 'available': return 'Dostupný';
      case 'on-duty': return 'Na trase';
      case 'off-duty': return 'Mimo službu';
      case 'sick': return 'Nemoc';
      case 'vacation': return 'Dovolená';
      case 'training': return 'Školení';
      default: return status;
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-600';
    if (performance >= 80) return 'text-blue-600';
    if (performance >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const stats = {
    total: drivers.length,
    available: drivers.filter(d => d.status === 'available').length,
    onDuty: drivers.filter(d => d.status === 'on-duty').length,
    offDuty: drivers.filter(d => d.status === 'off-duty').length,
    sick: drivers.filter(d => d.status === 'sick').length,
    vacation: drivers.filter(d => d.status === 'vacation').length,
    training: drivers.filter(d => d.status === 'training').length
  };

  const departments = Array.from(new Set(drivers.map(d => d.department))).sort();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Správa řidičů</h2>
          <p className="text-muted-foreground">
            Přehled a správa všech řidičů pro distribuci novin
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Nový řidič
          </Button>
          <Button>
            <Users className="h-4 w-4 mr-2" />
            Správa řidičů
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <Card className="unified-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Celkem řidičů</p>
          </CardContent>
        </Card>
        <Card className="unified-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <p className="text-sm text-muted-foreground">Dostupní</p>
          </CardContent>
        </Card>
        <Card className="unified-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.onDuty}</div>
            <p className="text-sm text-muted-foreground">Na trase</p>
          </CardContent>
        </Card>
        <Card className="unified-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.offDuty}</div>
            <p className="text-sm text-muted-foreground">Mimo službu</p>
          </CardContent>
        </Card>
        <Card className="unified-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.sick}</div>
            <p className="text-sm text-muted-foreground">Nemoc</p>
          </CardContent>
        </Card>
        <Card className="unified-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.vacation}</div>
            <p className="text-sm text-muted-foreground">Dovolená</p>
          </CardContent>
        </Card>
        <Card className="unified-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.training}</div>
            <p className="text-sm text-muted-foreground">Školení</p>
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
                  placeholder="Hledat řidiče..."
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
                  <SelectItem value="available">Dostupní</SelectItem>
                  <SelectItem value="on-duty">Na trase</SelectItem>
                  <SelectItem value="off-duty">Mimo službu</SelectItem>
                  <SelectItem value="sick">Nemoc</SelectItem>
                  <SelectItem value="vacation">Dovolená</SelectItem>
                  <SelectItem value="training">Školení</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Oblast</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Všechny oblasti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny oblasti</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drivers List */}
      <Card className="unified-card">
        <CardHeader>
          <CardTitle>Řidiči ({filteredDrivers.length})</CardTitle>
          <CardDescription>
            Zobrazeno {filteredDrivers.length} z {drivers.length} řidičů
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse flex flex-col space-y-4 w-full">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="h-28 bg-gray-100 rounded-md w-full"></div>
                ))}
              </div>
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p>Žádní řidiči odpovídající kritériím</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDrivers.map((driver) => (
                <div 
                  key={driver.id} 
                  className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={driver.photo} />
                          <AvatarFallback>{driver.name.substr(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-lg">{driver.name}</h3>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>{driver.position}</span>
                            <span>•</span>
                            <span>{driver.department}</span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(driver.status)}>
                          {getStatusLabel(driver.status)}
                        </Badge>
                        {driver.notes && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Poznámka
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          <span>{driver.email}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          <span>{driver.phone}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Nástup: {new Date(driver.hireDate).toLocaleDateString('cs-CZ')}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>Poslední aktivita: {new Date(driver.lastActive).toLocaleDateString('cs-CZ')}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Výkonnost:</span>
                            <span className={`font-medium ${getPerformanceColor(driver.performance)}`}>
                              {driver.performance}%
                            </span>
                          </div>
                          <Progress value={driver.performance} className="h-2" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Úspěšnost tras:</span>
                            <span className="font-medium">
                              {Math.round((driver.completedRoutes / driver.totalRoutes) * 100)}%
                            </span>
                          </div>
                          <Progress value={(driver.completedRoutes / driver.totalRoutes) * 100} className="h-2" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Včasnost:</span>
                            <span className="font-medium">{driver.onTimeRate}%</span>
                          </div>
                          <Progress value={driver.onTimeRate} className="h-2" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Průměrný čas:</span>
                            <span className="font-medium">{driver.averageDeliveryTime} min</span>
                          </div>
                          <Progress value={(driver.averageDeliveryTime / 180) * 100} className="h-2" />
                        </div>
                      </div>
                      
                      {driver.currentRoute && (
                        <div className="mt-2 flex items-center text-sm">
                          <Truck className="h-4 w-4 mr-2 text-blue-600" />
                          <span className="text-blue-600">
                            Aktuálně na trase: {driver.currentRoute} ({driver.currentVehicle})
                          </span>
                        </div>
                      )}
                      
                      <div className="mt-3 flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Celkem tras: {driver.totalRoutes}</span>
                        <span>Dokončené: {driver.completedRoutes}</span>
                        <span>Doručení: {driver.totalDeliveries}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Users className="h-4 w-4 mr-1" />
                        Detail
                      </Button>
                      <Button variant="outline" size="sm">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Výkonnost
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
