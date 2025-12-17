'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { CalendarIcon, Play, Route as RouteIcon, X, Clock, ArrowDown, Download, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DatePickerWithPresets } from '@/components/ui/calendar';

interface VehicleHistoryProps {
  vehicles: any[];
  onShowHistoryAction: (vehicleId: string, locations: any[]) => void;
  onGenerateRouteAction: (locations: any[]) => void;
  onClearHistoryAction: () => void;
}

export function VehicleHistory({ vehicles, onShowHistoryAction, onGenerateRouteAction, onClearHistoryAction }: VehicleHistoryProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 1)));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [displayMode, setDisplayMode] = useState<'all' | 'simplified' | 'stops'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [presetPeriod, setPresetPeriod] = useState<'custom' | '24h' | '7d' | '30d'>('24h');

  // Quick preset time periods
  const handlePresetChange = (value: '24h' | '7d' | '30d' | 'custom') => {
    setPresetPeriod(value);
    const now = new Date();
    
    switch(value) {
      case '24h':
        setDateFrom(new Date(now.getTime() - 24 * 60 * 60 * 1000));
        setDateTo(now);
        break;
      case '7d':
        setDateFrom(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
        setDateTo(now);
        break;
      case '30d':
        setDateFrom(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
        setDateTo(now);
        break;
      case 'custom':
        // Do nothing, keep current dates
        break;
    }
  };

  const fetchHistory = async () => {
    if (!selectedVehicle) {
      setError("Vyberte vozidlo");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // In a real app, use this:
      // const response = await fetch(`/api/auta/history?vehicleId=${selectedVehicle}&startDate=${dateFrom.toISOString()}&endDate=${dateTo.toISOString()}`);
      // const data = await response.json();
      
      // For demo, create mock data
      const mockData = Array.from({length: 50}, (_, i) => ({
        id: `hist-${i}`,
        latitude: 50.0755 + (Math.random() - 0.5) * 0.1,
        longitude: 14.4378 + (Math.random() - 0.5) * 0.1,
        timestamp: new Date(dateTo.getTime() - i * (Math.random() * 1800000)).toISOString(),
        rychlost: Math.floor(Math.random() * 90),
        stav: Math.random() > 0.7 ? 'stání' : 'jízda'
      })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      setHistoryData(mockData);
      
      // Process data based on display mode before sending to map
      let processedData = [...mockData];
      
      if (displayMode === 'simplified') {
        // Simplify the path (e.g., keep only every 5th point)
        processedData = mockData.filter((_, i) => i % 5 === 0 || i === 0 || i === mockData.length - 1);
      } else if (displayMode === 'stops') {
        // Keep only points where the vehicle was stopped
        processedData = mockData.filter(point => point.stav === 'stání' || point.rychlost < 5);
      }
      
      onShowHistoryAction(selectedVehicle, processedData);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError("Nepodařilo se načíst historii");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics from history data
  const calculateStats = () => {
    if (!historyData.length) return null;
    
    const totalDistanceKm = 15.7; // In a real app, calculate this from GPS coordinates
    const maxSpeed = Math.max(...historyData.map(point => point.rychlost || 0));
    const avgSpeed = historyData.reduce((sum, point) => sum + (point.rychlost || 0), 0) / historyData.length;
    const stopCount = historyData.filter(point => point.stav === 'stání' || point.rychlost < 5).length;
    
    return { totalDistanceKm, maxSpeed, avgSpeed, stopCount };
  };

  const stats = calculateStats();

  const handleClear = () => {
    setHistoryData([]);
    onClearHistoryAction();
  };

  const handleExport = () => {
    if (!historyData.length) return;
    
    // Create CSV content
    const csvContent = [
      "Datum,Čas,Souřadnice,Rychlost,Stav",
      ...historyData.map(point => {
        const date = new Date(point.timestamp);
        return `${format(date, 'yyyy-MM-dd')},${format(date, 'HH:mm:ss')},${point.latitude},${point.longitude},${point.rychlost},${point.stav}`;
      })
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historie-${selectedVehicle}-${format(dateFrom, 'yyyy-MM-dd')}-${format(dateTo, 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="p-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Historie pohybu</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="vehicle-select">Vyberte vozidlo</Label>
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <SelectTrigger id="vehicle-select">
                <SelectValue placeholder="Vybrat vozidlo" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map(vehicle => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.spz} ({vehicle.znacka} {vehicle.model})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Časové období</Label>
              <div className="flex items-center space-x-1">
                <Badge 
                  variant={presetPeriod === '24h' ? 'default' : 'outline'} 
                  className="cursor-pointer h-6"
                  onClick={() => handlePresetChange('24h')}
                >24h</Badge>
                <Badge 
                  variant={presetPeriod === '7d' ? 'default' : 'outline'} 
                  className="cursor-pointer h-6"
                  onClick={() => handlePresetChange('7d')}
                >7d</Badge>
                <Badge 
                  variant={presetPeriod === '30d' ? 'default' : 'outline'} 
                  className="cursor-pointer h-6"
                  onClick={() => handlePresetChange('30d')}
                >30d</Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Od data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateFrom, 'PP', { locale: cs })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <DatePickerWithPresets
                      date={dateFrom}
                      setDate={(date) => {
                        if (date) {
                          setDateFrom(date);
                          setPresetPeriod('custom');
                        }
                      }}
                      fromYear={2020}
                      toYear={new Date().getFullYear() + 10}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Do data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateTo, 'PP', { locale: cs })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <DatePickerWithPresets
                      date={dateTo}
                      setDate={(date) => {
                        if (date) {
                          setDateTo(date);
                          setPresetPeriod('custom');
                        }
                      }}
                      fromYear={2020}
                      toYear={new Date().getFullYear() + 10}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Zobrazení</Label>
            <RadioGroup 
              value={displayMode} 
              onValueChange={(value: any) => setDisplayMode(value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="cursor-pointer">Vše</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="simplified" id="simplified" />
                <Label htmlFor="simplified" className="cursor-pointer">Zjednodušené</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="stops" id="stops" />
                <Label htmlFor="stops" className="cursor-pointer">Jen zastávky</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <Button onClick={fetchHistory} disabled={!selectedVehicle || isLoading} className="w-full">
            {isLoading ? <Skeleton className="h-4 w-4 rounded-full mr-2" /> : <Play className="mr-2 h-4 w-4" />}
            Zobrazit historii
          </Button>
          
          {historyData.length > 0 && (
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleExport} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleClear} className="flex-1">
                <X className="mr-2 h-4 w-4" />
                Vyčistit
              </Button>
            </div>
          )}
        </div>

        {error && (
          <div className="text-sm p-2 bg-red-50 text-red-700 rounded">{error}</div>
        )}

        {historyData.length > 0 && (
          <Accordion type="single" collapsible defaultValue="data">
            <AccordionItem value="data">
              <AccordionTrigger className="py-2">
                <span className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Detaily ({historyData.length} záznamů)
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-sm space-y-4">
                  {stats && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="text-xs text-muted-foreground">Ujetá vzdálenost</div>
                        <div className="font-medium">{stats.totalDistanceKm.toFixed(1)} km</div>
                      </div>
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="text-xs text-muted-foreground">Max. rychlost</div>
                        <div className="font-medium">{Math.round(stats.maxSpeed)} km/h</div>
                      </div>
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="text-xs text-muted-foreground">Prům. rychlost</div>
                        <div className="font-medium">{Math.round(stats.avgSpeed)} km/h</div>
                      </div>
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="text-xs text-muted-foreground">Počet zastávek</div>
                        <div className="font-medium">{stats.stopCount}</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground mb-1">
                    Časové rozpětí: {format(new Date(historyData[0].timestamp), 'Pp')} – {format(new Date(historyData[historyData.length - 1].timestamp), 'Pp')}
                  </div>
                  
                  <div className="max-h-40 overflow-auto border rounded">
                    <table className="w-full text-xs table-fixed">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Čas</th>
                          <th className="p-2 text-left">Rychlost</th>
                          <th className="p-2 text-left">Stav</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyData.map((point, index) => (
                          <tr key={point.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                            <td className="p-2">{format(new Date(point.timestamp), 'HH:mm:ss')}</td>
                            <td className="p-2">{point.rychlost} km/h</td>
                            <td className="p-2">
                              <Badge variant="outline" className={point.stav === 'stání' ? 'bg-gray-100' : 'bg-blue-100'}>
                                {point.stav}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
} 