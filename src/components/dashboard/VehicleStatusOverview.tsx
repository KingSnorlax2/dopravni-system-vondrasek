'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface VehicleStatusOverviewProps {
  data: {
    active: number;
    service: number;
    inactive: number;
  };
}

export function VehicleStatusOverview({ data }: VehicleStatusOverviewProps) {
  const chartData = [
    { name: 'Aktivní', value: data.active, color: '#22c55e' },
    { name: 'V servisu', value: data.service, color: '#eab308' },
    { name: 'Vyřazeno', value: data.inactive, color: '#94a3b8' },
  ];

  return (
    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => 
              `${name} ${(percent * 100).toFixed(0)}%`
            }
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
} 