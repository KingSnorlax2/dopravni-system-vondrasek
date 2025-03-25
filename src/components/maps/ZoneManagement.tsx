'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { MapPin, Plus, Trash, Bell, Edit, Eye, EyeOff } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from '@/components/ui/use-toast';

interface Zone {
  id: string;
  name: string;
  color: string;
  radius: number;
  center: [number, number];
  active: boolean;
  notify: boolean;
}

interface ZoneManagementProps {
  zones: Zone[];
  onAddZoneAction: (zone: Zone) => void;
  onUpdateZoneAction: (zone: Zone) => void;
  onDeleteZoneAction: (zoneId: string) => void;
  onToggleZoneAction: (zoneId: string, active: boolean) => void;
  onSelectZoneAction: (zoneId: string) => void;
  isDrawingMode: boolean;
  onToggleDrawingModeAction: (isDrawing: boolean) => void;
}

export function ZoneManagement({
  zones,
  onAddZoneAction,
  onUpdateZoneAction,
  onDeleteZoneAction,
  onToggleZoneAction,
  onSelectZoneAction,
  isDrawingMode,
  onToggleDrawingModeAction
}: ZoneManagementProps) {
  const [newZone, setNewZone] = useState({
    name: '',
    color: '#3b82f6',
    radius: 1000
  });
  const [editingZone, setEditingZone] = useState<Zone | null>(null);

  const handleStartDrawing = () => {
    if (newZone.name.trim() === '') {
      toast({
        title: "Chyba",
        description: "Zadejte název zóny",
        variant: "destructive"
      });
      return;
    }

    onToggleDrawingModeAction(true);
    toast({
      title: "Kreslení zóny",
      description: "Klikněte na mapě pro umístění zóny"
    });
  };

  const handleEditZone = (zone: Zone) => {
    setEditingZone(zone);
  };

  const handleUpdateExistingZone = () => {
    if (editingZone) {
      onUpdateZoneAction(editingZone);
      setEditingZone(null);
      toast({
        title: "Zóna aktualizována",
        description: `Zóna "${editingZone.name}" byla aktualizována`
      });
    }
  };

  const handleToggleZoneActive = (zone: Zone, active: boolean) => {
    onToggleZoneAction(zone.id, active);
  };

  const handleToggleNotify = (zone: Zone) => {
    onUpdateZoneAction({
      ...zone,
      notify: !zone.notify
    });
  };

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-4 py-2.5 border-b">
        <CardTitle className="text-base font-medium">Správa zón</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs defaultValue="list">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="list">Seznam zón</TabsTrigger>
            <TabsTrigger value="create">Vytvořit zónu</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zone-name">Název zóny</Label>
                <Input
                  id="zone-name"
                  value={newZone.name}
                  onChange={(e) => setNewZone({...newZone, name: e.target.value})}
                  placeholder="Např. Skladiště Praha"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zone-color">Barva</Label>
                <div className="flex space-x-2">
                  <Input
                    id="zone-color"
                    type="color"
                    value={newZone.color}
                    onChange={(e) => setNewZone({...newZone, color: e.target.value})}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={newZone.color}
                    onChange={(e) => setNewZone({...newZone, color: e.target.value})}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="zone-radius">Poloměr (m)</Label>
                  <span className="text-sm font-medium">{newZone.radius}m</span>
                </div>
                <Slider
                  id="zone-radius"
                  min={100}
                  max={5000}
                  step={100}
                  value={[newZone.radius]}
                  onValueChange={(value) => setNewZone({...newZone, radius: value[0]})}
                />
              </div>

              <Button
                onClick={handleStartDrawing}
                disabled={isDrawingMode || newZone.name.trim() === ''}
                className="w-full"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Umístit na mapě
              </Button>

              {isDrawingMode && (
                <div className="text-sm p-2 bg-blue-50 text-blue-700 rounded">
                  Klikněte na mapě pro umístění zóny. 
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => onToggleDrawingModeAction(false)}
                  >
                    Zrušit
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="list">
            {editingZone ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-zone-name">Název zóny</Label>
                  <Input
                    id="edit-zone-name"
                    value={editingZone.name}
                    onChange={(e) => setEditingZone({...editingZone, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-zone-color">Barva</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="edit-zone-color"
                      type="color"
                      value={editingZone.color}
                      onChange={(e) => setEditingZone({...editingZone, color: e.target.value})}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={editingZone.color}
                      onChange={(e) => setEditingZone({...editingZone, color: e.target.value})}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-zone-radius">Poloměr (m)</Label>
                    <span className="text-sm font-medium">{editingZone.radius}m</span>
                  </div>
                  <Slider
                    id="edit-zone-radius"
                    min={100}
                    max={5000}
                    step={100}
                    value={[editingZone.radius]}
                    onValueChange={(value) => setEditingZone({...editingZone, radius: value[0]})}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    onClick={() => setEditingZone(null)}
                    className="flex-1"
                  >
                    Zrušit
                  </Button>
                  <Button
                    onClick={handleUpdateExistingZone}
                    className="flex-1"
                  >
                    Uložit změny
                  </Button>
                </div>
              </div>
            ) : zones.length > 0 ? (
              <ScrollArea className="h-80">
                <div className="space-y-3">
                  {zones.map(zone => (
                    <div key={zone.id} className="p-3 border rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: zone.color }}
                          />
                          <span className="font-medium">{zone.name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onSelectZoneAction(zone.id)}
                            title="Zobrazit na mapě"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleToggleZoneActive(zone, !zone.active)}
                            title={zone.active ? "Skrýt zónu" : "Zobrazit zónu"}
                          >
                            {zone.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleToggleNotify(zone)}
                            title={zone.notify ? "Vypnout notifikace" : "Zapnout notifikace"}
                          >
                            <Bell className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEditZone(zone)}
                            title="Upravit zónu"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-100"
                            onClick={() => {
                              if (confirm(`Opravdu chcete smazat zónu "${zone.name}"?`)) {
                                onDeleteZoneAction(zone.id);
                              }
                            }}
                            title="Smazat zónu"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Poloměr: {zone.radius}m
                        {zone.notify && (
                          <Badge className="ml-2 text-xs" variant="outline">
                            Notifikace zapnuty
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center p-4 text-muted-foreground">
                <MapPin className="h-6 w-6 mx-auto mb-2" />
                <p>Žádné zóny</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 