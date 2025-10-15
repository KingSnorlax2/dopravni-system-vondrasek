"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Clock, MapPin, Truck, AlertTriangle, Lock, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface DriverInfo {
  name: string;
  vehicle: string;
  currentRoute: string;
  progress: number;
  estimatedCompletion: string;
  status: 'active' | 'paused' | 'completed';
}

export default function DriverRestrictedPage() {
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simulate loading driver data
    setTimeout(() => {
      setDriverInfo({
        name: "Řidič Jan Novák",
        vehicle: "Ford Transit - 1A1 1234",
        currentRoute: "Trasa A - Praha 4",
        progress: 65,
        estimatedCompletion: "14:30",
        status: 'active'
      });
      setLoading(false);
    }, 1000);
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/dashboard/noviny/distribuce/driver-login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-lg text-gray-600">Načítám informace o trasě...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Lock Warning */}
        <div className="mb-6">
          <Alert className="border-orange-200 bg-orange-50">
            <Lock className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Navigace uzamčena:</strong> Máte omezený přístup k systému. Pro odemčení kontaktujte administrátora.
            </AlertDescription>
          </Alert>
        </div>

        {/* Driver Info Card */}
        <Card className="mb-6 shadow-lg">
          <CardHeader className="bg-blue-600 text-white">
            <CardTitle className="flex items-center space-x-2">
              <Truck className="h-5 w-5" />
              <span>Informace o řidiči</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Jméno řidiče</p>
                <p className="font-semibold text-lg">{driverInfo?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Vozidlo</p>
                <p className="font-semibold text-lg">{driverInfo?.vehicle}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Aktuální trasa</p>
                <p className="font-semibold text-lg">{driverInfo?.currentRoute}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge 
                  variant={driverInfo?.status === 'active' ? 'default' : 'secondary'}
                  className="text-sm"
                >
                  {driverInfo?.status === 'active' ? 'Aktivní' : 'Pozastaveno'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Route Progress */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-green-600" />
              <span>Průběh trasy</span>
            </CardTitle>
            <CardDescription>
              Aktuální stav doručování na trase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Dokončeno</span>
                  <span>{driverInfo?.progress}%</span>
                </div>
                <Progress value={driverInfo?.progress} className="h-3" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Odhadovaný konec</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{driverInfo?.estimatedCompletion}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Zbývající body</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round(((100 - (driverInfo?.progress || 0)) / 100) * 25)} z 25
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>Rychlé akce</CardTitle>
            <CardDescription>
              Dostupné funkce pro řidiče
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-16 text-left justify-start"
                disabled
              >
                <MapPin className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <div className="font-medium">Zobrazit mapu trasy</div>
                  <div className="text-sm text-gray-500">Funkce dočasně nedostupná</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-16 text-left justify-start"
                disabled
              >
                <Clock className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <div className="font-medium">Historie tras</div>
                  <div className="text-sm text-gray-500">Funkce dočasně nedostupná</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-16 text-left justify-start"
                disabled
              >
                <Truck className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <div className="font-medium">Stav vozidla</div>
                  <div className="text-sm text-gray-500">Funkce dočasně nedostupná</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-16 text-left justify-start"
                disabled
              >
                <AlertTriangle className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <div className="font-medium">Nahlásit problém</div>
                  <div className="text-sm text-gray-500">Funkce dočasně nedostupná</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logout Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-red-600">Ukončit práci</CardTitle>
            <CardDescription>
              Odhlásit se ze systému
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Po odhlášení budete přesměrováni na přihlašovací stránku. 
                Všechny neuložené změny budou ztraceny.
              </p>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Odhlásit se
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Systém distribuce novin • Omezený přístup</p>
          <p className="mt-1">Pro plný přístup kontaktujte administrátora</p>
        </div>
      </div>
    </div>
  );
}
