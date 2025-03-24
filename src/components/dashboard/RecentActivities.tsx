'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Car, Clock, MapPin, Wrench, CircleDollarSign } from "lucide-react";

interface Activity {
  id: string;
  vehicleId: string;
  spz: string;
  type: 'movement' | 'service' | 'refuel';
  description: string;
  location?: string;
  timestamp: string;
}

export function RecentActivities() {
  // Sample data - in a real app, this would come from props or API
  const activities: Activity[] = [
    {
      id: '1',
      vehicleId: '101',
      spz: '1AB 1234',
      type: 'movement',
      description: 'Jízda Praha - Brno',
      location: 'Brno',
      timestamp: '10:45'
    },
    {
      id: '2',
      vehicleId: '102',
      spz: '2CD 5678',
      type: 'service',
      description: 'Výměna oleje a filtrů',
      timestamp: '09:30'
    },
    {
      id: '3',
      vehicleId: '103',
      spz: '3EF 9012',
      type: 'refuel',
      description: 'Tankování 45.5l (1350 Kč)',
      location: 'OMV Liberec',
      timestamp: '08:15'
    },
  ];

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'movement':
        return <Car className="h-4 w-4" />;
      case 'service':
        return <Wrench className="h-4 w-4" />;
      case 'refuel':
        return <CircleDollarSign className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'movement':
        return 'bg-blue-100 text-blue-800';
      case 'service':
        return 'bg-yellow-100 text-yellow-800';
      case 'refuel':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nedávné aktivity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{activity.spz}</div>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {activity.timestamp}
                  </Badge>
                </div>
                
                <div className="text-sm mt-1">{activity.description}</div>
                
                {activity.location && (
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    {activity.location}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 