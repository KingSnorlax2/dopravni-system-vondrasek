'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AutoDetailForm } from "@/components/forms/AutoDetailForm";
import { 
  Car, Calendar, Wrench, MapPin, Clock, FileText, 
  ArrowLeft, AlertCircle, BarChart, Activity, History, 
  Settings, ChevronRight, CircleDollarSign, FileSpreadsheet
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface Vehicle {
  id: string;
  spz: string;
  znacka: string;
  model: string;
  stav: 'aktivní' | 'servis' | 'vyřazeno';
  rokVyroby: number;
  najezd: number;
  datumSTK?: string;
  lastLocationUpdate?: string;
  poznamka?: string;
}

interface MaintenanceItem {
  id: string;
  typ: string;
  datum: string;
  najezd: number;
  cena: number;
  poznamka?: string;
}

interface FuelRecord {
  id: string;
  datum: string;
  mnozstvi: number;
  cena: number;
  najezd: number;
}

interface VehicleDetailCardProps {
  vehicle: Vehicle;
  maintenanceItems: MaintenanceItem[];
  fuelRecords: FuelRecord[];
}

export function VehicleDetailCard({ vehicle, maintenanceItems, fuelRecords }: VehicleDetailCardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Status color mapping
  const statusColor = {
    'aktivní': 'bg-green-100 text-green-800 border-green-200',
    'servis': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'vyřazeno': 'bg-gray-100 text-gray-800 border-gray-200',
  };
  
  // Calculate days until STK
  const daysUntilSTK = vehicle.datumSTK 
    ? Math.ceil((new Date(vehicle.datumSTK).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  const stkStatus = daysUntilSTK 
    ? daysUntilSTK <= 0 
      ? 'Prošlá STK'
      : daysUntilSTK <= 30
        ? `STK za ${daysUntilSTK} dní`
        : `STK platná (${daysUntilSTK} dní)`
    : 'STK není nastavena';
    
  const stkStatusColor = daysUntilSTK 
    ? daysUntilSTK <= 0 
      ? 'bg-red-100 text-red-800 border-red-200'
      : daysUntilSTK <= 30
        ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
        : 'bg-green-100 text-green-800 border-green-200'
    : 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Link href="/dashboard/auta" className="text-muted-foreground hover:text-primary">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft size={16} />
              <span>Zpět na seznam</span>
            </Button>
          </Link>
          
          <Badge className={`${statusColor[vehicle.stav]} px-2 py-1`}>
            {vehicle.stav}
          </Badge>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mt-2 gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">{vehicle.spz}</CardTitle>
            <CardDescription className="text-base mt-1">
              {vehicle.znacka} {vehicle.model}, {vehicle.rokVyroby}
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
              <Settings size={16} className="mr-1" />
              Upravit
            </Button>
            <Button variant="default" size="sm" asChild>
              <Link href={`/dashboard/auta/${vehicle.id}/map`}>
                <MapPin size={16} className="mr-1" />
                Mapa
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Přehled</TabsTrigger>
            <TabsTrigger value="maintenance">Servis</TabsTrigger>
            <TabsTrigger value="logs">Historie</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* STK Alert if needed */}
            {daysUntilSTK !== null && daysUntilSTK <= 30 && (
              <div className={`p-3 rounded-md ${daysUntilSTK <= 0 ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} className={daysUntilSTK <= 0 ? 'text-red-600' : 'text-yellow-600'} />
                  <div className="font-medium">
                    {daysUntilSTK <= 0 
                      ? 'STK již není platná!' 
                      : `STK vyprší za ${daysUntilSTK} ${daysUntilSTK === 1 ? 'den' : daysUntilSTK <= 4 ? 'dny' : 'dní'}`
                    }
                  </div>
                </div>
              </div>
            )}
            
            {/* Vehicle info grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column - Basic info */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Základní informace</h3>
                
                <div className="rounded-md border p-4 space-y-3">
                  <div className="flex justify-between">
                    <div className="text-sm text-muted-foreground">SPZ</div>
                    <div className="font-medium">{vehicle.spz}</div>
                  </div>
                  <Separator />
                  
                  <div className="flex justify-between">
                    <div className="text-sm text-muted-foreground">Značka a model</div>
                    <div className="font-medium">{vehicle.znacka} {vehicle.model}</div>
                  </div>
                  <Separator />
                  
                  <div className="flex justify-between">
                    <div className="text-sm text-muted-foreground">Rok výroby</div>
                    <div className="font-medium">{vehicle.rokVyroby}</div>
                  </div>
                  <Separator />
                  
                  <div className="flex justify-between">
                    <div className="text-sm text-muted-foreground">Nájezd</div>
                    <div className="font-medium">{vehicle.najezd.toLocaleString('cs-CZ')} km</div>
                  </div>
                  <Separator />
                  
                  <div className="flex justify-between">
                    <div className="text-sm text-muted-foreground">Status</div>
                    <Badge className={`${statusColor[vehicle.stav]}`}>
                      {vehicle.stav}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Right column - Technical info */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Technické informace</h3>
                
                <div className="rounded-md border p-4 space-y-3">
                  <div className="flex justify-between">
                    <div className="text-sm text-muted-foreground">STK platnost</div>
                    <Badge className={`${stkStatusColor}`}>
                      {stkStatus}
                    </Badge>
                  </div>
                  <Separator />
                  
                  <div className="flex justify-between">
                    <div className="text-sm text-muted-foreground">Datum STK</div>
                    <div className="font-medium">
                      {vehicle.datumSTK 
                        ? format(new Date(vehicle.datumSTK), 'dd.MM.yyyy')
                        : '---'
                      }
                    </div>
                  </div>
                  <Separator />
                  
                  <div className="flex justify-between">
                    <div className="text-sm text-muted-foreground">Poslední servis</div>
                    <div className="font-medium">
                      {maintenanceItems && maintenanceItems.length > 0
                        ? format(new Date(maintenanceItems[0].datum), 'dd.MM.yyyy')
                        : '---'
                      }
                    </div>
                  </div>
                  <Separator />
                  
                  <div className="flex justify-between">
                    <div className="text-sm text-muted-foreground">Poslední aktualizace polohy</div>
                    <div className="font-medium">
                      {vehicle.lastLocationUpdate 
                        ? format(new Date(vehicle.lastLocationUpdate), 'dd.MM.yyyy HH:mm')
                        : '---'
                      }
                    </div>
                  </div>
                </div>
                
                {/* Notes section */}
                {vehicle.poznamka && (
                  <div className="rounded-md border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={16} className="text-muted-foreground" />
                      <h3 className="text-sm font-medium">Poznámka</h3>
                    </div>
                    <p className="text-sm">{vehicle.poznamka}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Quick actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              <Button variant="outline" className="justify-start" asChild>
                <Link href={`/dashboard/auta/${vehicle.id}/servis/add`}>
                  <Wrench size={16} className="mr-2" />
                  Přidat servis
                </Link>
              </Button>
              
              <Button variant="outline" className="justify-start" asChild>
                <Link href={`/dashboard/auta/${vehicle.id}/fuel/add`}>
                  <CircleDollarSign size={16} className="mr-2" />
                  Přidat tankování
                </Link>
              </Button>
              
              <Button variant="outline" className="justify-start" asChild>
                <Link href={`/dashboard/auta/${vehicle.id}/reports`}>
                  <FileSpreadsheet size={16} className="mr-2" />
                  Generovat report
                </Link>
              </Button>
              
              <Button variant="outline" className="justify-start" asChild>
                <Link href={`/dashboard/auta/${vehicle.id}/tracking`}>
                  <Activity size={16} className="mr-2" />
                  Sledování jízd
                </Link>
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="maintenance">
            {/* Maintenance tab content */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium">Historie servisních záznamů</h3>
                <Button size="sm" asChild>
                  <Link href={`/dashboard/auta/${vehicle.id}/servis/add`}>
                    <Wrench size={16} className="mr-1" />
                    Přidat servis
                  </Link>
                </Button>
              </div>
              
              {maintenanceItems && maintenanceItems.length > 0 ? (
                <div className="border rounded-md divide-y">
                  {maintenanceItems.map((item, index) => (
                    <div key={index} className="p-3 hover:bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{item.typ}</div>
                        <Badge variant="outline">
                          {format(new Date(item.datum), 'dd.MM.yyyy')}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-sm text-muted-foreground">
                          Nájezd: {item.najezd.toLocaleString('cs-CZ')} km
                        </div>
                        <div className="text-sm font-medium">
                          {item.cena.toLocaleString('cs-CZ')} Kč
                        </div>
                      </div>
                      {item.poznamka && (
                        <div className="text-sm mt-2 text-muted-foreground">
                          {item.poznamka}
                        </div>
                      )}
                      <div className="flex justify-end mt-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/auta/${vehicle.id}/servis/${item.id}`}>
                            Detail
                            <ChevronRight size={14} className="ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center border rounded-md p-8 bg-muted/50">
                  <Wrench size={24} className="text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Žádné servisní záznamy</p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <Link href={`/dashboard/auta/${vehicle.id}/servis/add`}>
                      Přidat první záznam
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="logs">
            {/* Logs/History tab content */}
            <div className="space-y-4">
              <h3 className="text-base font-medium">Historie aktivit vozidla</h3>
              
              <div className="border rounded-md divide-y">
                {/* Example log entries */}
                <div className="p-3 hover:bg-muted/50">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <Clock size={16} className="text-blue-700" />
                    </div>
                    <div>
                      <div className="font-medium">Aktualizace polohy</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(), 'dd.MM.yyyy HH:mm')}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 hover:bg-muted/50">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <CircleDollarSign size={16} className="text-green-700" />
                    </div>
                    <div>
                      <div className="font-medium">Tankování paliva</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(Date.now() - 86400000), 'dd.MM.yyyy HH:mm')} • 45.5 litrů • 1670 Kč
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 hover:bg-muted/50">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                      <Wrench size={16} className="text-yellow-700" />
                    </div>
                    <div>
                      <div className="font-medium">Servisní prohlídka</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(Date.now() - 7 * 86400000), 'dd.MM.yyyy HH:mm')} • Výměna oleje a filtrů
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/dashboard/auta/${vehicle.id}/history`}>
                  <History size={16} className="mr-1" />
                  Zobrazit kompletní historii
                </Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {isEditOpen && (
        <AutoDetailForm
          open={isEditOpen}
          onOpenChangeAction={(open) => {
            if (!open) setIsEditOpen(false);
          }}
          initialData={{
            id: vehicle.id,
            spz: vehicle.spz,
            znacka: vehicle.znacka,
            model: vehicle.model,
            rokVyroby: vehicle.rokVyroby,
            najezd: vehicle.najezd,
            stav: vehicle.stav,
            datumSTK: vehicle.datumSTK ? new Date(vehicle.datumSTK) : undefined,
            poznamka: vehicle.poznamka || undefined,
          }}
          onSubmit={async (data) => {
            try {
              const response = await fetch(`/api/auta/${vehicle.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });
              
              if (!response.ok) throw new Error('Failed to update');
              
              // Reload the page to show updated data
              window.location.reload();
            } catch (error) {
              console.error('Update failed:', error);
            }
          }}
        />
      )}
    </Card>
  );
} 