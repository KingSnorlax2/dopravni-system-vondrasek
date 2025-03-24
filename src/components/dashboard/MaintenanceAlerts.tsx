'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

interface MaintenanceAlert {
  id: string;
  vehicleId: string;
  spz: string;
  type: string;
  date: string;
  daysRemaining: number;
}

interface MaintenanceAlertsProps {
  alerts: MaintenanceAlert[];
}

export function MaintenanceAlerts({ alerts }: MaintenanceAlertsProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
            Nadcházející údržba a kontroly
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length > 0 ? (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="border rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">{alert.spz}</div>
                    <div className="text-sm text-muted-foreground">{alert.type}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{alert.date}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 items-center">
                    <Badge variant={alert.daysRemaining <= 7 ? "destructive" : "outline"} className="whitespace-nowrap">
                      {alert.daysRemaining <= 0 
                        ? 'Již prošlo!' 
                        : `Zbývá ${alert.daysRemaining} dní`}
                    </Badge>
                    
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/dashboard/auta/${alert.vehicleId}`}>
                        Detail
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="mx-auto bg-muted rounded-full w-12 h-12 flex items-center justify-center mb-3">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium">Žádné nadcházející údržby</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Všechna vozidla mají aktuální kontroly a údržby
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 