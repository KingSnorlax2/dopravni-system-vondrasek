'use client';

import { useState } from 'react';
import { Calendar, MapPin, Truck, Users, Clock, Plus, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/components/ui/use-toast';

interface RoutePlan {
  id: string;
  name: string;
  district: string;
  vehicleId: string;
  driverId: string;
  startTime: string;
  estimatedDuration: number;
  dropPoints: number;
  priority: 'low' | 'medium' | 'high';
  status: 'draft' | 'planned' | 'active';
}

export default function NewspaperPlanningPage() {
  const [routes, setRoutes] = useState<RoutePlan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RoutePlan | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    district: '',
    vehicleId: '',
    driverId: '',
    startTime: '',
    estimatedDuration: 120,
    dropPoints: 20,
    priority: 'medium' as const,
    notes: ''
  });

  const mockVehicles = [
    { id: 'v1', spz: '1A1 1000', model: 'Ford Transit' },
    { id: 'v2', spz: '2B2 2000', model: 'Mercedes Sprinter' },
    { id: 'v3', spz: '3C3 3000', model: 'VW Transporter' },
  ];

  const mockDrivers = [
    { id: 'd1', name: 'Jan Novák', status: 'available' },
    { id: 'd2', name: 'Petr Svoboda', status: 'available' },
    { id: 'd3', name: 'Martin Dvořák', status: 'available' },
  ];

  const districts = ['Praha 1', 'Praha 2', 'Praha 3', 'Praha 4', 'Praha 5', 'Praha 6', 'Brno', 'Plzeň'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingRoute) {
      // Update existing route
      setRoutes(prev => prev.map(route => 
        route.id === editingRoute.id 
          ? { ...route, ...formData, id: route.id }
          : route
      ));
      toast({
        title: 'Trasa aktualizována',
        description: 'Trasa byla úspěšně aktualizována'
      });
    } else {
      // Create new route
      const newRoute: RoutePlan = {
        id: `route-${Date.now()}`,
        ...formData,
        status: 'draft'
      };
      setRoutes(prev => [...prev, newRoute]);
      toast({
        title: 'Trasa vytvořena',
        description: 'Nová trasa byla úspěšně vytvořena'
      });
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      district: '',
      vehicleId: '',
      driverId: '',
      startTime: '',
      estimatedDuration: 120,
      dropPoints: 20,
      priority: 'medium',
      notes: ''
    });
    setEditingRoute(null);
    setShowForm(false);
  };

  const editRoute = (route: RoutePlan) => {
    setEditingRoute(route);
    setFormData({
      name: route.name,
      district: route.district,
      vehicleId: route.vehicleId,
      driverId: route.driverId,
      startTime: route.startTime,
      estimatedDuration: route.estimatedDuration,
      dropPoints: route.dropPoints,
      priority: route.priority,
      notes: ''
    });
    setShowForm(true);
  };

  const deleteRoute = (routeId: string) => {
    setRoutes(prev => prev.filter(route => route.id !== routeId));
    toast({
      title: 'Trasa smazána',
      description: 'Trasa byla úspěšně smazána'
    });
  };

  const activateRoute = (routeId: string) => {
    setRoutes(prev => prev.map(route => 
      route.id === routeId 
        ? { ...route, status: 'active' }
        : route
    ));
    toast({
      title: 'Trasa aktivována',
      description: 'Trasa byla úspěšně aktivována'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Plánování distribuce</h2>
          <p className="text-muted-foreground">
            Vytvořte a naplánujte nové trasy pro distribuci novin
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nová trasa
        </Button>
      </div>

      {showForm && (
        <Card className="unified-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {editingRoute ? 'Upravit trasu' : 'Nová trasa'}
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
            <CardDescription>
              Vyplňte údaje o nové trase distribuce
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Název trasy</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Např. Trasa A - Praha 1"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="district">Oblast</Label>
                  <Select value={formData.district} onValueChange={(value) => setFormData(prev => ({ ...prev, district: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte oblast" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map(district => (
                        <SelectItem key={district} value={district}>{district}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleId">Vozidlo</Label>
                  <Select value={formData.vehicleId} onValueChange={(value) => setFormData(prev => ({ ...prev, vehicleId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte vozidlo" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockVehicles.map(vehicle => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.spz} - {vehicle.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="driverId">Řidič</Label>
                  <Select value={formData.driverId} onValueChange={(value) => setFormData(prev => ({ ...prev, driverId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte řidiče" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockDrivers.map(driver => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startTime">Čas začátku</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedDuration">Odhadovaná doba (min)</Label>
                  <Input
                    id="estimatedDuration"
                    type="number"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) }))}
                    min="30"
                    max="480"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dropPoints">Počet míst doručení</Label>
                  <Input
                    id="dropPoints"
                    type="number"
                    value={formData.dropPoints}
                    onChange={(e) => setFormData(prev => ({ ...prev, dropPoints: parseInt(e.target.value) }))}
                    min="1"
                    max="100"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priorita</Label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Nízká</SelectItem>
                      <SelectItem value="medium">Střední</SelectItem>
                      <SelectItem value="high">Vysoká</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Poznámky</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Další informace o trase..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Zrušit
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  {editingRoute ? 'Uložit změny' : 'Vytvořit trasu'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="unified-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Naplánované trasy
            </CardTitle>
            <CardDescription>
              Trasy čekající na aktivaci
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {routes.filter(route => route.status === 'draft' || route.status === 'planned').map(route => (
                <div key={route.id} className="border rounded-lg p-3 hover:bg-slate-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{route.name}</h4>
                      <div className="text-sm text-muted-foreground">
                        {route.district} • {route.dropPoints} míst • {route.estimatedDuration} min
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{route.priority}</Badge>
                        <Badge variant="secondary">{route.status}</Badge>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline" onClick={() => editRoute(route)}>
                        Upravit
                      </Button>
                      <Button size="sm" onClick={() => activateRoute(route.id)}>
                        Aktivovat
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteRoute(route.id)}>
                        Smazat
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {routes.filter(route => route.status === 'draft' || route.status === 'planned').length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p>Žádné naplánované trasy</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="unified-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="h-5 w-5 mr-2" />
              Aktivní trasy
            </CardTitle>
            <CardDescription>
              Aktuálně probíhající distribuce
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {routes.filter(route => route.status === 'active').map(route => (
                <div key={route.id} className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{route.name}</h4>
                      <div className="text-sm text-muted-foreground">
                        {route.district} • {route.dropPoints} míst • {route.estimatedDuration} min
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{route.priority}</Badge>
                        <Badge className="bg-blue-100 text-blue-800">Aktivní</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {routes.filter(route => route.status === 'active').length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p>Žádné aktivní trasy</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
