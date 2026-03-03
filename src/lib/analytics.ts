import 'server-only'
import { prisma } from '@/lib/prisma'
import { db } from '@/lib/prisma'
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  addMonths,
  startOfDay,
  endOfDay,
} from 'date-fns'
import { cs } from 'date-fns/locale'

export type AnalyticsData = {
  kpis: {
    totalIncomeMonth: number
    totalExpensesMonth: number
    vehicleAvailability: { active: number; total: number }
    avgMaintenanceCost: number
  }
  incomeVsExpensesOverTime: { month: string; prijem: number; vydaj: number }[]
  vehicleStatus: { name: string; value: number }[]
  expensesByCategory: { name: string; value: number; fullName: string }[]
  maintenanceAndRepairsOverTime: { month: string; udrzba: number; oprava: number }[]
  stkTimeline: { month: string; count: number; vehicles: string[] }[]
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const now = new Date()
  const startOfCurrentMonth = startOfMonth(now)
  const endOfCurrentMonth = endOfMonth(now)
  const twelveMonthsAgo = subMonths(now, 12)

  // Parallel fetch all KPI and chart data
  const [
    incomeAggregate,
    expensesTransakceAggregate,
    expensesUdrzbaAggregate,
    expensesOpravaAggregate,
    vehicleCounts,
    maintenanceTotal,
    repairsTotal,
    transakceForCharts,
    udrzbyForCharts,
    opravyForCharts,
    autaWithStk,
    transakceByCategory,
    autaForStatus,
  ] = await Promise.all([
    // KPI 1: Celkový příjem (měsíc) – všechny transakce
    prisma.transakce.aggregate({
      where: {
        typ: 'příjem',
        datum: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
      },
      _sum: { castka: true },
    }),

    // KPI 2 (část 1): Transakce výdaje za měsíc – všechny transakce
    prisma.transakce.aggregate({
      where: {
        typ: 'výdaj',
        datum: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
      },
      _sum: { castka: true },
    }),

    // KPI 2 (část 2): Údržba za měsíc
    prisma.udrzba.aggregate({
      where: {
        status: 'COMPLETED',
        datumUdrzby: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
      },
      _sum: { cena: true },
    }),

    // KPI 2 (část 3): Opravy za měsíc
    prisma.oprava.aggregate({
      where: {
        datum: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
      },
      _sum: { cena: true },
    }),

    // KPI 3: Dostupnost vozidel
    Promise.all([
      db.auto.count({ where: { aktivni: true } }),
      db.auto.count({ where: { aktivni: true, stav: 'aktivní' } }),
    ]),

    // KPI 4: Celkové náklady údržby (všechny záznamy)
    prisma.udrzba.aggregate({
      _sum: { cena: true },
    }),

    // KPI 4 (část 2): Celkové náklady oprav
    prisma.oprava.aggregate({
      _sum: { cena: true },
    }),

    // Chart: Příjmy vs výdaje - všechny transakce za 12 měsíců (včetně čekajících)
    prisma.transakce.findMany({
      where: {
        datum: { gte: twelveMonthsAgo },
      },
      select: { datum: true, typ: true, castka: true },
    }),

    // Chart: Údržba v čase
    prisma.udrzba.findMany({
      where: {
        status: 'COMPLETED',
        datumUdrzby: { gte: twelveMonthsAgo },
      },
      select: { datumUdrzby: true, cena: true },
    }),

    // Chart: Opravy v čase
    prisma.oprava.findMany({
      where: {
        datum: { gte: twelveMonthsAgo },
      },
      select: { datum: true, cena: true },
    }),

    // Chart: STK termíny - vozidla s datumSTK (aktivní)
    db.auto.findMany({
      where: {
        aktivni: true,
        datumSTK: { not: null },
      },
      select: { spz: true, datumSTK: true },
    }),

    // Chart: Náklady podle kategorie (výdaje, včetně čekajících)
    prisma.transakce.findMany({
      where: {
        typ: 'výdaj',
        datum: { gte: twelveMonthsAgo },
        kategorieId: { not: null },
      },
      include: { kategorie: true },
    }),

    // Vehicle status for Pie chart
    db.auto.findMany({
      where: { aktivni: true },
      select: { stav: true },
    }),
  ])

  const totalIncomeMonth = incomeAggregate._sum.castka ?? 0
  const totalExpensesMonth =
    (expensesTransakceAggregate._sum.castka ?? 0) +
    (expensesUdrzbaAggregate._sum.cena ?? 0) +
    (expensesOpravaAggregate._sum.cena ?? 0)

  const [totalVehicles, activeVehicles] = vehicleCounts
  const totalMaintenanceCost = (maintenanceTotal._sum.cena ?? 0) + (repairsTotal._sum.cena ?? 0)
  const avgMaintenanceCost =
    activeVehicles > 0 ? Math.round(totalMaintenanceCost / activeVehicles) : 0

  // Build income vs expenses over time (monthly)
  const monthMap = new Map<
    string,
    { prijem: number; vydaj: number }
  >()
  for (let i = 0; i < 12; i++) {
    const m = subMonths(now, 11 - i)
    const key = format(m, 'yyyy-MM', { locale: cs })
    monthMap.set(key, { prijem: 0, vydaj: 0 })
  }
  for (const t of transakceForCharts) {
    const key = format(startOfMonth(new Date(t.datum)), 'yyyy-MM', { locale: cs })
    const entry = monthMap.get(key)
    if (entry) {
      if (t.typ === 'příjem') entry.prijem += t.castka
      else if (t.typ === 'výdaj') entry.vydaj += t.castka
    }
  }
  const incomeVsExpensesOverTime = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month: format(new Date(month + '-01'), 'M/y', { locale: cs }),
      prijem: data.prijem,
      vydaj: data.vydaj,
    }))

  // Vehicle status (Pie)
  const stavCounts = { aktivní: 0, servis: 0, vyřazeno: 0 }
  for (const a of autaForStatus) {
    if (a.stav in stavCounts) {
      stavCounts[a.stav as keyof typeof stavCounts]++
    }
  }
  const vehicleStatus = [
    { name: 'Aktivní', value: stavCounts['aktivní'] },
    { name: 'Servis', value: stavCounts['servis'] },
    { name: 'Vyřazeno', value: stavCounts['vyřazeno'] },
  ].filter((x) => x.value > 0)

  // Expenses by category (Bar) - top 7
  const categorySums = new Map<string, number>()
  const categoryFullNames = new Map<string, string>()
  for (const t of transakceByCategory) {
    const name = t.kategorie?.nazev ?? 'Bez kategorie'
    const key = name.length > 15 ? name.slice(0, 15) + '…' : name
    categoryFullNames.set(key, name)
    categorySums.set(key, (categorySums.get(key) ?? 0) + t.castka)
  }
  const expensesByCategory = Array.from(categorySums.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 7)
    .map(([key, value]) => ({
      name: key,
      value,
      fullName: categoryFullNames.get(key) ?? key,
    }))

  // Maintenance and repairs over time (Bar) – merged for stacked/grouped chart
  const maintRepairsMonthMap = new Map<
    string,
    { udrzba: number; oprava: number }
  >()
  for (let i = 0; i < 12; i++) {
    const m = subMonths(now, 11 - i)
    const key = format(m, 'yyyy-MM', { locale: cs })
    maintRepairsMonthMap.set(key, { udrzba: 0, oprava: 0 })
  }
  for (const u of udrzbyForCharts) {
    const key = format(startOfMonth(new Date(u.datumUdrzby)), 'yyyy-MM', { locale: cs })
    const entry = maintRepairsMonthMap.get(key)
    if (entry) {
      entry.udrzba += u.cena
    }
  }
  for (const o of opravyForCharts) {
    const key = format(startOfMonth(new Date(o.datum)), 'yyyy-MM', { locale: cs })
    const entry = maintRepairsMonthMap.get(key)
    if (entry) {
      entry.oprava += o.cena ?? 0
    }
  }
  const maintenanceAndRepairsOverTime = Array.from(maintRepairsMonthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month: format(new Date(month + '-01'), 'M/y', { locale: cs }),
      udrzba: data.udrzba,
      oprava: data.oprava,
    }))

  // STK timeline - next 6 months
  const stkMonthMap = new Map<
    string,
    { count: number; vehicles: string[] }
  >()
  for (let i = 0; i < 6; i++) {
    const m = addMonths(now, i)
    const key = format(m, 'yyyy-MM', { locale: cs })
    stkMonthMap.set(key, { count: 0, vehicles: [] })
  }
  for (const a of autaWithStk) {
    if (!a.datumSTK) continue
    const d = new Date(a.datumSTK)
    const key = format(d, 'yyyy-MM', { locale: cs })
    const entry = stkMonthMap.get(key)
    if (entry) {
      entry.count++
      entry.vehicles.push(a.spz)
    }
  }
  const stkTimeline = Array.from(stkMonthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month: format(new Date(month + '-01'), 'MMM yyyy', { locale: cs }),
      count: data.count,
      vehicles: data.vehicles,
    }))

  return {
    kpis: {
      totalIncomeMonth,
      totalExpensesMonth,
      vehicleAvailability: { active: activeVehicles, total: totalVehicles },
      avgMaintenanceCost,
    },
    incomeVsExpensesOverTime,
    vehicleStatus,
    expensesByCategory,
    maintenanceAndRepairsOverTime,
    stkTimeline,
  }
}
