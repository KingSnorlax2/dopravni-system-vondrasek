# 🔍 Auditní Zpráva - Fleet Management System

**Datum auditu:** 2025-01-XX  
**Auditor:** Senior Next.js Architect  
**Cíl:** Komplexní revize kódu a architektury pro maturitní projekt

---

## 📋 Executive Summary

Projekt **Fleet Management System** je solidně postavený na moderním Next.js 14 stacku s App Router. Systém má dobré základy, ale identifikoval jsem několik **kritických bezpečnostních problémů** a **architektonických nedostatků**, které by mohly ovlivnit hodnocení. Na druhou stranu, projekt má potenciál pro přidání několika "wow faktorů", které by výrazně zvýšily hodnocení.

**Celkové hodnocení:** 7/10  
**Priorita oprav:** VYSOKÁ (kritické bezpečnostní problémy)

---

## 🔴 1. Kritické Problémy (MUSÍ být opraveny)

### 1.1 Chybějící Autentizace v API Routes

**Lokace:** `src/app/api/auta/route.ts` (POST endpoint)

**Problém:**
```typescript
export async function POST(request: Request) {
  try {
    const data = await request.json();
    // ❌ ŽÁDNÁ KONTROLA AUTENTIZACE!
    // ❌ ŽÁDNÁ KONTROLA OPRÁVNĚNÍ!
    
    const vehicle = await prisma.auto.create({
      data: { ...validatedData, aktivni: true }
    });
```

**Riziko:** Kdokoliv může vytvářet vozidla bez přihlášení. **KRITICKÁ BEZPEČNOSTNÍ CHYBA.**

**Řešení:**
```typescript
export async function POST(request: Request) {
  try {
    // ✅ Přidat autentizaci
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nejste přihlášeni' },
        { status: 401 }
      );
    }

    // ✅ Přidat autorizaci
    const hasPermission = await checkDynamicPermission(
      'create_vehicles',
      { userId: session.user.id }
    );
    
    if (!hasPermission.allowed) {
      return NextResponse.json(
        { error: 'Nemáte oprávnění' },
        { status: 403 }
      );
    }

    const data = await request.json();
    // ... zbytek kódu
```

**Ovlivněné soubory:**
- `src/app/api/auta/route.ts` (POST, PATCH, DELETE)
- `src/app/api/auta/[id]/route.ts` (všechny metody)
- `src/app/api/auta/bulk-*` (všechny bulk operace)

---

### 1.2 Chybějící Bezpečnostní Kontroly v Server Actions

**Lokace:** `src/app/actions/repairs.ts`

**Problém:**
```typescript
export async function createRepair(data: CreateRepairInput) {
  try {
    // ❌ ŽÁDNÁ KONTROLA AUTENTIZACE!
    // ❌ ŽÁDNÁ KONTROLA OPRÁVNĚNÍ!
    
    const validatedData = createRepairSchema.parse(data);
    const repair = await prisma.oprava.create({ ... });
```

**Riziko:** Kdokoliv může vytvářet opravy bez kontroly oprávnění.

**Řešení:**
```typescript
export async function createRepair(data: CreateRepairInput) {
  try {
    // ✅ Přidat autentizaci
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Nejste přihlášeni'
      };
    }

    // ✅ Přidat autorizaci
    const hasPermission = await checkDynamicPermission(
      'create_repairs',
      { userId: session.user.id }
    );
    
    if (!hasPermission.allowed) {
      return {
        success: false,
        error: 'Nemáte oprávnění k vytváření oprav'
      };
    }

    // ... zbytek kódu
```

**Ovlivněné soubory:**
- `src/app/actions/repairs.ts` (všechny funkce)
- Potenciálně další Server Actions bez kontroly

---

### 1.3 Duplikace Zod Schémat (DRY Porušení)

**Problém:** Stejné Zod schéma je definováno na 4+ místech:

1. `src/components/forms/AutoForm.tsx` - `autoSchema`
2. `src/components/forms/AutoDetailForm.tsx` - `formSchema`
3. `src/components/dashboard/AutoEditForm.tsx` - `formSchema`
4. `src/app/api/auta/route.ts` - `autoSchema`
5. `src/app/dashboard/admin/cars/car-form.tsx` - `carFormSchema`

**Riziko:**
- Při změně validace musíte upravit 5 souborů
- Riziko nekonzistence
- Porušení DRY principu

**Řešení:** Vytvořit sdílené schéma v `src/lib/schemas/vehicle.ts`:

```typescript
// src/lib/schemas/vehicle.ts
import { z } from 'zod';

export const vehicleSchema = z.object({
  spz: z.string().min(7, "SPZ musí mít minimálně 7 znaků").max(8, "SPZ může mít maximálně 8 znaků"),
  znacka: z.string().min(2, "Značka musí mít alespoň 2 znaky").max(20, "Značka může mít maximálně 20 znaků"),
  model: z.string().min(1, "Model je povinný").max(20, "Model může mít maximálně 20 znaků"),
  rokVyroby: z.number()
    .min(1900, "Rok výroby musí být od roku 1900")
    .max(new Date().getFullYear(), "Rok výroby nemůže být v budoucnosti"),
  najezd: z.number().min(0, "Nájezd nemůže být záporný"),
  stav: z.enum(["aktivní", "servis", "vyřazeno"]),
  poznamka: z.string().max(300, "Poznámka může mít maximálně 300 znaků").optional().or(z.literal('')),
  datumSTK: z.date().optional().or(z.string().optional()),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;
```

**Použití:**
```typescript
// V komponentách
import { vehicleSchema } from '@/lib/schemas/vehicle';
const form = useForm({ resolver: zodResolver(vehicleSchema) });

// V API routes
import { vehicleSchema } from '@/lib/schemas/vehicle';
const validated = vehicleSchema.parse(data);
```

---

### 1.4 Příliš Mnoho Client Components

**Problém:** 139 souborů s `"use client"` direktivou.

**Riziko:**
- Zbytečně velký JavaScript bundle
- Horší SEO (méně Server Components)
- Pomalejší první načtení stránky

**Doporučení:** 
- Přesunout logiku na server, kde je to možné
- Client Components používat pouze pro interaktivní UI (formuláře, modaly, animace)
- Data fetching přesunout do Server Components

**Příklad refaktoringu:**
```typescript
// ❌ PŘED: Client Component s fetch
"use client"
export function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  useEffect(() => {
    fetch('/api/auta').then(...);
  }, []);
  // ...
}

// ✅ PO: Server Component
export async function VehicleList() {
  const vehicles = await prisma.auto.findMany({ where: { aktivni: true } });
  return <VehicleListClient vehicles={vehicles} />;
}
```

---

## 🟡 2. Vylepšení (Refaktoring, Kvalita Kódu)

### 2.1 Struktura Složek - Chybí Features Pattern

**Aktuální struktura:**
```
src/
├── app/
│   ├── api/
│   ├── dashboard/
│   └── actions/
├── components/
│   ├── forms/
│   ├── dashboard/
│   └── ...
```

**Problém:** Plochá struktura, komponenty nejsou seskupené podle funkcionalit.

**Doporučení:** Přesunout na features-based strukturu:

```
src/
├── app/
│   └── (routes)/
├── features/
│   ├── vehicles/
│   │   ├── components/
│   │   │   ├── VehicleForm.tsx
│   │   │   ├── VehicleList.tsx
│   │   │   └── VehicleDetail.tsx
│   │   ├── api/
│   │   │   └── route.ts
│   │   ├── actions/
│   │   │   └── vehicle-actions.ts
│   │   └── schemas/
│   │       └── vehicle.ts
│   ├── maintenance/
│   ├── transactions/
│   └── users/
```

**Výhody:**
- Lepší organizace kódu
- Snadnější navigace
- Jasné oddělení funkcionalit
- Snadnější testování

---

### 2.2 Nekonzistentní Error Handling

**Problém:** Různé způsoby zpracování chyb:

1. Některé komponenty používají `toast()` z `sonner`
2. Jiné používají `useToast()` z `@/components/ui/toast`
3. Některé API routes vracejí jen `console.error()`

**Doporučení:** Standardizovat error handling:

```typescript
// src/lib/error-handler.ts
import { toast } from 'sonner';

export function handleError(error: unknown, context?: string) {
  const message = error instanceof Error 
    ? error.message 
    : 'Nastala neočekávaná chyba';
  
  console.error(`[${context}]`, error);
  
  toast.error('Chyba', {
    description: message,
  });
  
  return { success: false, error: message };
}
```

**Použití:**
```typescript
try {
  // ...
} catch (error) {
  return handleError(error, 'createVehicle');
}
```

---

### 2.3 Soft Delete - Částečná Implementace

**Stav:** 
- ✅ Model `Auto` má pole `aktivni: Boolean`
- ✅ Model `ArchivedAuto` existuje
- ❌ Ale některé dotazy nefiltrují podle `aktivni`

**Problém v kódu:**
```typescript
// ❌ Někde se načítají i neaktivní vozidla
const auta = await prisma.auto.findMany(); // Chybí where: { aktivni: true }
```

**Doporučení:** Vytvořit helper funkci:

```typescript
// src/lib/prisma-helpers.ts
export const vehicleQueries = {
  findActive: () => prisma.auto.findMany({
    where: { aktivni: true }
  }),
  
  findActiveOrId: (id: number) => prisma.auto.findFirst({
    where: {
      OR: [
        { id, aktivni: true },
        { id } // Pro archivaci
      ]
    }
  })
};
```

---

### 2.4 Chybějící Type Safety v API Routes

**Problém:** Některé API routes nemají TypeScript typy pro request/response.

**Doporučení:**
```typescript
// src/types/api.ts
export interface CreateVehicleRequest {
  spz: string;
  znacka: string;
  // ...
}

export interface CreateVehicleResponse {
  success: boolean;
  data?: Auto;
  error?: string;
}

// V route.ts
export async function POST(
  request: Request
): Promise<NextResponse<CreateVehicleResponse>> {
  // ...
}
```

---

## 🟢 3. Feature Roadmap - 3 "Killer Features"

### 3.1 🤖 Automatické Upozornění na Údržbu podle Nájezdu

**Popis:** Systém automaticky upozorní, když vozidlo dosáhne určitého nájezdu (např. každých 10 000 km).

**Proč je to "wow":**
- Prokazuje pochopení business logiky
- Automatizace = moderní přístup
- Praktické využití

**Implementace:**

**Krok 1:** Přidat do Prisma schema:
```prisma
model MaintenanceSchedule {
  id          Int      @id @default(autoincrement())
  autoId      Int
  auto        Auto     @relation(fields: [autoId], references: [id])
  intervalKm  Int      // Interval v km (např. 10000)
  lastMaintenanceKm Int // Nájezd při poslední údržbě
  nextMaintenanceKm  Int // Nájezd při příští údržbě
  typUdrzby   String   // "Olej", "Filtry", "Brzdy", atd.
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Krok 2:** Vytvořit Server Action:
```typescript
// src/app/actions/maintenance-alerts.ts
'use server'

export async function checkMaintenanceAlerts() {
  const vehicles = await prisma.auto.findMany({
    where: { aktivni: true },
    include: {
      maintenanceSchedules: { where: { isActive: true } },
      udrzby: { orderBy: { datumUdrzby: 'desc' }, take: 1 }
    }
  });

  const alerts = [];
  
  for (const vehicle of vehicles) {
    for (const schedule of vehicle.maintenanceSchedules) {
      const kmUntilMaintenance = schedule.nextMaintenanceKm - vehicle.najezd;
      
      if (kmUntilMaintenance <= 1000) { // Upozornění při 1000 km do údržby
        alerts.push({
          vehicleId: vehicle.id,
          spz: vehicle.spz,
          typUdrzby: schedule.typUdrzby,
          kmUntilMaintenance,
          isUrgent: kmUntilMaintenance <= 0
        });
      }
    }
  }

  return alerts;
}
```

**Krok 3:** Komponenta pro zobrazení:
```typescript
// src/components/dashboard/MaintenanceMileageAlerts.tsx
'use client'

import { useEffect, useState } from 'react';
import { checkMaintenanceAlerts } from '@/app/actions/maintenance-alerts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export function MaintenanceMileageAlerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    checkMaintenanceAlerts().then(setAlerts);
  }, []);

  return (
    <div className="space-y-2">
      {alerts.map(alert => (
        <Alert key={alert.vehicleId} variant={alert.isUrgent ? "destructive" : "default"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {alert.spz} - {alert.typUdrzby}
          </AlertTitle>
          <AlertDescription>
            {alert.isUrgent 
              ? `⚠️ Údržba je již opožděná o ${Math.abs(alert.kmUntilMaintenance)} km!`
              : `Upozornění: Údržba za ${alert.kmUntilMaintenance} km`
            }
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
```

**Krok 4:** Přidat do dashboardu:
```typescript
// src/app/dashboard/page.tsx
import { MaintenanceMileageAlerts } from '@/components/dashboard/MaintenanceMileageAlerts';

export default function DashboardPage() {
  return (
    <div>
      <MaintenanceMileageAlerts />
      {/* ... zbytek dashboardu */}
    </div>
  );
}
```

**Časová náročnost:** ~2-3 hodiny  
**Dopad:** VYSOKÝ ⭐⭐⭐

---

### 3.2 📄 PDF Export "Knihy Jízd" (Driving Log)

**Popis:** Generování profesionálního PDF dokumentu s historií jízd vozidla (GPS záznamy, tankování, údržba).

**Proč je to "wow":**
- Praktické využití (účetnictví, audity)
- Prokazuje znalost PDF generování
- Profesionální výstup

**Implementace:**

**Krok 1:** Vytvořit PDF template:
```typescript
// src/lib/pdf/driving-log.tsx
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10 },
  title: { fontSize: 18, marginBottom: 20, fontWeight: 'bold' },
  table: { display: 'flex', flexDirection: 'column', marginTop: 10 },
  row: { flexDirection: 'row', borderBottom: 1, padding: 5 },
  cell: { flex: 1 }
});

export function DrivingLogPDF({ vehicle, gpsRecords, refuelings, maintenance }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Kniha jízd - {vehicle.spz}</Text>
        
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={styles.cell}>Datum</Text>
            <Text style={styles.cell}>Trasa</Text>
            <Text style={styles.cell}>Vzdálenost</Text>
            <Text style={styles.cell}>Spotřeba</Text>
          </View>
          {gpsRecords.map(record => (
            <View key={record.id} style={styles.row}>
              <Text style={styles.cell}>{format(record.cas, 'dd.MM.yyyy HH:mm')}</Text>
              <Text style={styles.cell}>{record.latitude}, {record.longitude}</Text>
              <Text style={styles.cell}>-</Text>
              <Text style={styles.cell}>-</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
```

**Krok 2:** API Route pro generování:
```typescript
// src/app/api/auta/[id]/driving-log/route.ts
import { DrivingLogPDF } from '@/lib/pdf/driving-log';
import { renderToBuffer } from '@react-pdf/renderer';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const vehicle = await prisma.auto.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      gpsZaznamy: { orderBy: { cas: 'desc' }, take: 100 },
      tankovani: { orderBy: { datum: 'desc' }, take: 50 },
      udrzby: { orderBy: { datumUdrzby: 'desc' }, take: 20 }
    }
  });

  const pdfDoc = <DrivingLogPDF 
    vehicle={vehicle}
    gpsRecords={vehicle.gpsZaznamy}
    refuelings={vehicle.tankovani}
    maintenance={vehicle.udrzby}
  />;

  const pdfBuffer = await renderToBuffer(pdfDoc);

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="kniha-jizd-${vehicle.spz}.pdf"`
    }
  });
}
```

**Krok 3:** Tlačítko v UI:
```typescript
// V VehicleDetail komponentě
<Button onClick={async () => {
  const response = await fetch(`/api/auta/${vehicleId}/driving-log`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kniha-jizd-${vehicle.spz}.pdf`;
  a.click();
}}>
  <FileText className="mr-2" />
  Exportovat Knihu Jízd (PDF)
</Button>
```

**Časová náročnost:** ~3-4 hodiny  
**Dopad:** VYSOKÝ ⭐⭐⭐

---

### 3.3 📊 Pokročilé Dashboard Analytics s Recharts

**Popis:** Interaktivní dashboard s grafy spotřeby, nákladů, využití vozidel pomocí Recharts.

**Proč je to "wow":**
- Vizuálně působivé
- Prokazuje znalost datové analýzy
- Praktické business insights

**Implementace:**

**Krok 1:** Vytvořit data fetching:
```typescript
// src/app/actions/analytics.ts
'use server'

export async function getVehicleAnalytics(vehicleId: number, period: 'month' | 'year' = 'month') {
  const startDate = period === 'month' 
    ? subMonths(new Date(), 1)
    : subYears(new Date(), 1);

  const [refuelings, maintenance, transactions] = await Promise.all([
    prisma.tankovani.findMany({
      where: { autoId: vehicleId, datum: { gte: startDate } },
      orderBy: { datum: 'asc' }
    }),
    prisma.udrzba.findMany({
      where: { autoId: vehicleId, datumUdrzby: { gte: startDate } }
    }),
    prisma.transakce.findMany({
      where: { autoId: vehicleId, datum: { gte: startDate } }
    })
  ]);

  // Výpočet spotřeby
  const consumptionData = refuelings.map((refueling, index) => {
    if (index === 0) return null;
    const prevRefueling = refuelings[index - 1];
    const km = refueling.najezd - prevRefueling.najezd;
    const liters = refueling.litry;
    const consumption = (liters / km) * 100; // l/100km
    
    return {
      date: refueling.datum,
      consumption,
      km
    };
  }).filter(Boolean);

  // Náklady v čase
  const costData = transactions.map(t => ({
    date: t.datum,
    amount: t.castka,
    category: t.kategorie?.nazev || 'Ostatní'
  }));

  return {
    consumptionData,
    costData,
    totalCost: transactions.reduce((sum, t) => sum + t.castka, 0),
    totalMaintenance: maintenance.reduce((sum, m) => sum + m.cena, 0)
  };
}
```

**Krok 2:** Komponenta s grafy:
```typescript
// src/components/dashboard/VehicleAnalytics.tsx
'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function VehicleAnalytics({ vehicleId }: { vehicleId: number }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    getVehicleAnalytics(vehicleId).then(setData);
  }, [vehicleId]);

  if (!data) return <div>Načítání...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Spotřeba paliva</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart width={400} height={300} data={data.consumptionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis label={{ value: 'l/100km', angle: -90 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="consumption" stroke="#8884d8" name="Spotřeba" />
          </LineChart>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Náklady v čase</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart width={400} height={300} data={data.costData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="amount" fill="#82ca9d" name="Náklady (Kč)" />
          </BarChart>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Přehled nákladů</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Celkové náklady:</span>
              <span className="font-bold">{data.totalCost} Kč</span>
            </div>
            <div className="flex justify-between">
              <span>Údržba:</span>
              <span>{data.totalMaintenance} Kč</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Krok 3:** Přidat do detailu vozidla:
```typescript
// src/app/dashboard/auta/[id]/page.tsx
import { VehicleAnalytics } from '@/components/dashboard/VehicleAnalytics';

export default function VehicleDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      {/* ... ostatní obsah */}
      <VehicleAnalytics vehicleId={parseInt(params.id)} />
    </div>
  );
}
```

**Časová náročnost:** ~4-5 hodin  
**Dopad:** VYSOKÝ ⭐⭐⭐

---

## ✅ 4. Akční Plán - 5 Okamžitých Kroků

### Krok 1: Opravit Bezpečnostní Chyby (PRIORITA 1)
- [ ] Přidat autentizaci do `src/app/api/auta/route.ts` (POST, PATCH, DELETE)
- [ ] Přidat autorizaci do `src/app/actions/repairs.ts`
- [ ] Zkontrolovat všechny API routes v `src/app/api/auta/`
- [ ] Přidat RBAC kontroly do všech Server Actions

**Čas:** 2-3 hodiny  
**Důležitost:** 🔴 KRITICKÁ

---

### Krok 2: Vytvořit Sdílené Zod Schémata (PRIORITA 2)
- [ ] Vytvořit `src/lib/schemas/` složku
- [ ] Přesunout `vehicleSchema` do `src/lib/schemas/vehicle.ts`
- [ ] Přesunout další schémata (transaction, maintenance, atd.)
- [ ] Refaktorovat všechny komponenty a API routes na použití sdílených schémat

**Čas:** 1-2 hodiny  
**Důležitost:** 🟡 VYSOKÁ

---

### Krok 3: Implementovat Feature #1 - Maintenance Alerts (PRIORITA 3)
- [ ] Přidat `MaintenanceSchedule` model do Prisma
- [ ] Vytvořit migraci
- [ ] Implementovat Server Action `checkMaintenanceAlerts`
- [ ] Vytvořit komponentu `MaintenanceMileageAlerts`
- [ ] Přidat do dashboardu

**Čas:** 2-3 hodiny  
**Důležitost:** 🟢 STŘEDNÍ (ale vysoký "wow" faktor)

---

### Krok 4: Standardizovat Error Handling (PRIORITA 4)
- [ ] Vytvořit `src/lib/error-handler.ts`
- [ ] Refaktorovat všechny try/catch bloky
- [ ] Zajistit konzistentní použití `toast()` z `sonner`

**Čas:** 1 hodina  
**Důležitost:** 🟡 STŘEDNÍ

---

### Krok 5: Přidat Type Safety do API Routes (PRIORITA 5)
- [ ] Vytvořit `src/types/api.ts` s typy pro request/response
- [ ] Přidat TypeScript typy do všech API routes
- [ ] Zkontrolovat type safety v Server Actions

**Čas:** 1-2 hodiny  
**Důležitost:** 🟡 STŘEDNÍ

---

## 📊 Shrnutí Priorit

| Priorita | Úkol | Čas | Důležitost | "Wow" Faktor |
|----------|------|-----|------------|--------------|
| 🔴 P1 | Opravit bezpečnostní chyby | 2-3h | KRITICKÁ | - |
| 🟡 P2 | Sdílená Zod schémata | 1-2h | VYSOKÁ | - |
| 🟢 P3 | Maintenance Alerts | 2-3h | STŘEDNÍ | ⭐⭐⭐ |
| 🟡 P4 | Error Handling | 1h | STŘEDNÍ | - |
| 🟡 P5 | Type Safety | 1-2h | STŘEDNÍ | - |
| 🟢 Bonus | PDF Export | 3-4h | NÍZKÁ | ⭐⭐⭐ |
| 🟢 Bonus | Analytics Dashboard | 4-5h | NÍZKÁ | ⭐⭐⭐ |

**Celkový čas na kritické opravy:** ~5-7 hodin  
**Celkový čas včetně "wow" features:** ~15-20 hodin

---

## 🎯 Závěrečná Doporučení

1. **Okamžitě opravit bezpečnostní chyby** - bez toho projekt nemůže být hodnocen jako bezpečný
2. **Implementovat alespoň 1 "wow" feature** - výrazně zvýší hodnocení
3. **Zdokumentovat změny** - připravit krátký dokument o tom, co jste opravili
4. **Připravit demo** - mít připravené demo všech funkcí pro obhajobu
5. **Testovat edge cases** - otestovat, co se stane při chybných vstupech, neautorizovaném přístupu, atd.

---

**Hodně štěstí u maturity! 🎓**

