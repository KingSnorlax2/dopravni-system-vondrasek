'use client'

import React from 'react'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AnalyticsData } from '@/lib/analytics'
import {
  TrendingUp,
  TrendingDown,
  Car,
  Wrench,
} from 'lucide-react'

const COLORS = ['#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c']

function formatCastka(value: number) {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0,
  }).format(value)
}

interface GrafyPageClientProps {
  data: AnalyticsData
}

function hasIncomeExpensesData(series: { prijem: number; vydaj: number }[]) {
  return series.some((d) => d.prijem !== 0 || d.vydaj !== 0)
}
function hasMaintenanceRepairsData(series: { udrzba: number; oprava: number }[]) {
  return series.some((d) => d.udrzba !== 0 || d.oprava !== 0)
}
export function GrafyPageClient({ data }: GrafyPageClientProps) {
  const { kpis } = data

  return (
    <>
      {/* KPI Cards */}
      <div className="unified-grid-stats">
        <Card className="unified-card">
          <CardHeader className="unified-card-header">
            <CardTitle className="unified-card-title">
              <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
              Celkový příjem (měsíc)
            </CardTitle>
          </CardHeader>
          <CardContent className="unified-card-content">
            <div className="text-2xl font-bold text-green-700">
              {formatCastka(kpis.totalIncomeMonth)}
            </div>
            <div className="text-sm text-muted-foreground">
              Příjmy za aktuální měsíc
            </div>
          </CardContent>
        </Card>

        <Card className="unified-card">
          <CardHeader className="unified-card-header">
            <CardTitle className="unified-card-title">
              <TrendingDown className="mr-2 h-5 w-5 text-red-600" />
              Celkové výdaje (měsíc)
            </CardTitle>
          </CardHeader>
          <CardContent className="unified-card-content">
            <div className="text-2xl font-bold text-red-700">
              {formatCastka(kpis.totalExpensesMonth)}
            </div>
            <div className="text-sm text-muted-foreground">
              Transakce + údržba + opravy
            </div>
          </CardContent>
        </Card>

        <Card className="unified-card">
          <CardHeader className="unified-card-header">
            <CardTitle className="unified-card-title">
              <Car className="mr-2 h-5 w-5 text-primary" />
              Dostupnost vozidel
            </CardTitle>
          </CardHeader>
          <CardContent className="unified-card-content">
            <div className="text-2xl font-bold">
              {kpis.vehicleAvailability.active}/{kpis.vehicleAvailability.total}
            </div>
            <div className="text-sm text-muted-foreground">
              Aktivních vozidel z celkového počtu
            </div>
          </CardContent>
        </Card>

        <Card className="unified-card">
          <CardHeader className="unified-card-header">
            <CardTitle className="unified-card-title">
              <Wrench className="mr-2 h-5 w-5 text-primary" />
              Prům. náklady údržby
            </CardTitle>
          </CardHeader>
          <CardContent className="unified-card-content">
            <div className="text-2xl font-bold">
              {formatCastka(kpis.avgMaintenanceCost)}
            </div>
            <div className="text-sm text-muted-foreground">
              Údržba + opravy na jedno vozidlo (celkem)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts - Grid 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Příjmy vs. výdaje */}
        <Card className="unified-card">
          <CardHeader className="unified-card-header">
            <CardTitle className="unified-card-title">Příjmy vs. výdaje v čase</CardTitle>
          </CardHeader>
          <CardContent className="unified-card-content">
            <div className="h-[300px] w-full">
              {hasIncomeExpensesData(data.incomeVsExpensesOverTime) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.incomeVsExpensesOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => formatCastka(v)} />
                    <Tooltip formatter={(value: number) => formatCastka(value)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="prijem"
                      name="Příjmy"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="vydaj"
                      name="Výdaje"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <p className="font-medium">Žádná data</p>
                  <p className="text-sm">Pro zobrazení grafu přidejte transakce (příjmy nebo výdaje).</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stav vozového parku */}
        <Card className="unified-card">
          <CardHeader className="unified-card-header">
            <CardTitle className="unified-card-title">Stav vozového parku</CardTitle>
          </CardHeader>
          <CardContent className="unified-card-content">
            <div className="h-[300px] w-full">
              {data.vehicleStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.vehicleStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.vehicleStatus.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, 'Počet']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Žádná data
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Náklady podle kategorie */}
        <Card className="unified-card">
          <CardHeader className="unified-card-header">
            <CardTitle className="unified-card-title">Náklady podle kategorie</CardTitle>
          </CardHeader>
          <CardContent className="unified-card-content">
            <div className="h-[300px] w-full">
              {data.expensesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.expensesByCategory}
                    layout="vertical"
                    margin={{ left: 20, right: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => formatCastka(v)} />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => formatCastka(value)}
                      content={({ active, payload }) =>
                        active && payload?.[0] ? (
                          <div className="rounded-lg border bg-white p-3 shadow-md">
                            <p className="font-medium">
                              {(payload[0].payload as { fullName?: string }).fullName ?? payload[0].name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatCastka(payload[0].value as number)}
                            </p>
                          </div>
                        ) : null
                      }
                    />
                    <Bar dataKey="value" name="Výdaje" fill="#8884d8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Žádná data
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Údržba a opravy v čase */}
        <Card className="unified-card">
          <CardHeader className="unified-card-header">
            <CardTitle className="unified-card-title">Údržba a opravy v čase</CardTitle>
          </CardHeader>
          <CardContent className="unified-card-content">
            <div className="h-[300px] w-full">
              {hasMaintenanceRepairsData(data.maintenanceAndRepairsOverTime) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.maintenanceAndRepairsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => formatCastka(v)} />
                    <Tooltip
                      formatter={(value: number) => formatCastka(value)}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length > 0) {
                          const p = payload[0].payload as {
                            month: string
                            udrzba: number
                            oprava: number
                          }
                          return (
                            <div className="rounded-lg border bg-white p-3 shadow-md">
                              <p className="font-medium">{p.month}</p>
                              <p className="text-sm text-muted-foreground">
                                Údržba: {formatCastka(p.udrzba)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Opravy: {formatCastka(p.oprava)}
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="udrzba"
                      name="Údržba"
                      stackId="a"
                      fill="#3b82f6"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="oprava"
                      name="Opravy"
                      stackId="a"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <p className="font-medium">Žádná data</p>
                  <p className="text-sm">Přidejte záznamy údržby nebo oprav k vozidlům.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* STK termíny */}
        <Card className="unified-card">
          <CardHeader className="unified-card-header">
            <CardTitle className="unified-card-title">STK termíny</CardTitle>
          </CardHeader>
          <CardContent className="unified-card-content">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.stkTimeline} layout="vertical" margin={{ left: 50, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="month" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [value, 'Vozidel']}
                    content={({ active, payload }) => {
                      if (active && payload?.[0]) {
                        const p = payload[0].payload as { month: string; count: number; vehicles: string[] }
                        return (
                          <div className="rounded-lg border bg-white p-3 shadow-md">
                            <p className="font-medium">{p.month}: {p.count} vozidel</p>
                            {p.vehicles.length > 0 && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                SPZ: {p.vehicles.join(', ')}
                              </p>
                            )}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="count" name="Vozidel" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>
    </>
  )
}
