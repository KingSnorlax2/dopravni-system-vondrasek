'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ServiceForm } from '@/components/forms/ServiceForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MaintenanceForm } from '@/components/forms/MaintenanceForm';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

interface PageProps {
  params: {
    id: string
  }
}

export default function ServicePage({ params }: PageProps) {
  const router = useRouter();
  const [auto, setAuto] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('service');
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [isMaintenanceFormOpen, setIsMaintenanceFormOpen] = useState(false);

  useEffect(() => {
    const fetchCarDetails = async () => {
      try {
        const response = await fetch(`/api/auta/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch car details');
        }
        const data = await response.json();
        setAuto(data);
      } catch (error) {
        console.error('Error fetching car details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCarDetails();
  }, [params.id]);

  const handleServiceSubmit = async (data: any) => {
    try {
      const response = await fetch(`/api/auta/${params.id}/opravy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create service record');
      }
      
      toast({
        title: "Servis byl zaznamenán",
        description: "Záznam o servisu byl úspěšně uložen do databáze.",
      });
      
      // Navigate back to the car detail page
      router.push(`/dashboard/auta/${params.id}`);
    } catch (error) {
      console.error('Error creating service record:', error);
      toast({
        title: "Chyba při ukládání servisu",
        description: error instanceof Error ? error.message : "Nastala neočekávaná chyba.",
        variant: "destructive",
      });
    }
  };

  const handleMaintenanceSubmit = async (data: any) => {
    try {
      console.log("Submitting maintenance data:", data);
      
      const response = await fetch(`/api/auta/${params.id}/udrzba`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create maintenance record');
      }
      
      toast({
        title: "Údržba byla zaznamenána",
        description: "Záznam o údržbě byl úspěšně uložen do databáze.",
      });
      
      // Navigate back to the car detail page
      router.push(`/dashboard/auta/${params.id}`);
    } catch (error) {
      console.error('Error creating maintenance record:', error);
      toast({
        title: "Chyba při ukládání údržby",
        description: error instanceof Error ? error.message : "Nastala neočekávaná chyba.",
        variant: "destructive",
      });
    }
  };

  // Function to handle form state
  const handleServiceFormChange = (open: boolean) => {
    setIsServiceFormOpen(open);
  };
  
  const handleMaintenanceFormChange = (open: boolean) => {
    setIsMaintenanceFormOpen(open);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-900"></div>
      </div>
    );
  }

  if (!auto) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Vozidlo nenalezeno</h1>
        <Button onClick={() => router.push('/dashboard/auta')}>
          Zpět na seznam vozidel
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push(`/dashboard/auta/${params.id}`)}
          className="flex items-center text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Zpět na detail vozidla
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zaznamenat servis nebo údržbu</CardTitle>
          <CardDescription>{auto.znacka} {auto.model} - {auto.spz}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="service" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="service">Oprava / Servis</TabsTrigger>
              <TabsTrigger value="maintenance">Plánovaná údržba</TabsTrigger>
            </TabsList>
            
            <TabsContent value="service" className="mt-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Záznam opravy nebo servisní prohlídky</h3>
                <p className="text-muted-foreground mb-6">
                  Zaznamenejte informace o provedené opravě nebo servisní prohlídce vozidla
                </p>
                <Button 
                  className="w-full md:w-auto" 
                  onClick={() => setIsServiceFormOpen(true)}
                >
                  Zaznamenat opravu / servis
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="maintenance" className="mt-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Plánování údržby</h3>
                <p className="text-muted-foreground mb-6">
                  Naplánujte nebo zaznamenejte provedenou údržbu vozidla
                </p>
                <Button 
                  className="w-full md:w-auto" 
                  onClick={() => setIsMaintenanceFormOpen(true)}
                >
                  Zaznamenat / naplánovat údržbu
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {isServiceFormOpen && (
        <ServiceForm
          open={isServiceFormOpen}
          onOpenChange={handleServiceFormChange}
          autoId={params.id}
          currentMileage={auto.najezd}
          onSubmit={handleServiceSubmit}
        />
      )}

      {isMaintenanceFormOpen && (
        <MaintenanceForm
          open={isMaintenanceFormOpen}
          onOpenChange={handleMaintenanceFormChange}
          autoId={params.id}
          currentMileage={auto.najezd}
          onSubmit={handleMaintenanceSubmit}
        />
      )}
    </div>
  );
} 