# Komponenty a UI Dokumentace

## Úvod

Složka `src/components/` obsahuje všechny React komponenty aplikace. Komponenty jsou organizovány do logických skupin podle jejich účelu a použití. Aplikace využívá moderní design systém založený na Shadcn/ui a Tailwind CSS pro konzistentní a přístupné uživatelské rozhraní.

## Design System

### Shadcn/ui

Aplikace používá [Shadcn/ui](https://ui.shadcn.com/), což je kolekce přístupných, vysoce kvalitních komponent postavených na Radix UI a Tailwind CSS. Shadcn/ui není tradiční knihovna komponent, ale kolekce kopírovatelných komponent, které můžete upravit podle svých potřeb.

**Výhody Shadcn/ui:**
- **Přístupnost** - Komponenty jsou postaveny na Radix UI, který poskytuje vynikající přístupnost (a11y)
- **Přizpůsobitelnost** - Komponenty jsou součástí vašeho kódu, takže je můžete libovolně upravovat
- **Type Safety** - Plná podpora TypeScript
- **Styling** - Používá Tailwind CSS pro konzistentní styling
- **Dark Mode** - Vestavěná podpora pro tmavý režim

### Tailwind CSS

[Tailwind CSS](https://tailwindcss.com/) je utility-first CSS framework, který umožňuje rychlý vývoj uživatelského rozhraní pomocí utility tříd.

**Klíčové vlastnosti:**
- **Utility-first** - Malé, jednorázové utility třídy místo předpřipravených komponent
- **Responsive Design** - Vestavěné breakpointy pro responzivní design
- **Customization** - Snadné přizpůsobení pomocí konfiguračního souboru
- **Performance** - PurgeCSS automaticky odstraňuje nepoužité CSS

### Utility Funkce

Pro kombinování Tailwind tříd se používá funkce `cn()` z `@/lib/utils`, která kombinuje `clsx` a `tailwind-merge`:

```typescript
import { cn } from "@/lib/utils"

// Kombinuje třídy a řeší konflikty
<div className={cn("base-class", condition && "conditional-class")} />
```

## Struktura Komponent

Komponenty jsou organizovány do následujících kategorií:

```
src/components/
├── ui/                    # Základní UI komponenty (Shadcn/ui)
├── layout/                # Layout komponenty (Sidebar, Nav, Header)
├── forms/                 # Formulářové komponenty
├── dashboard/             # Dashboard specifické komponenty
├── auta/                  # Komponenty pro správu vozidel
├── maps/                  # Mapové komponenty (Leaflet)
├── modals/                # Modální okna a dialogy
├── admin/                 # Administrační komponenty
├── newspaper/             # Komponenty pro distribuci novin
├── repairs/               # Komponenty pro správu oprav
└── ...                    # Další specializované komponenty
```

### UI Komponenty (`/ui`)

Základní stavební kameny uživatelského rozhraní. Tyto komponenty jsou založeny na Shadcn/ui a poskytují konzistentní vzhled a chování napříč aplikací.

**Dostupné komponenty:**
- `button.tsx` - Tlačítka s různými variantami
- `input.tsx` - Vstupní pole
- `table.tsx` - Tabulky pro zobrazení dat
- `dialog.tsx` - Modální dialogy
- `card.tsx` - Karty pro seskupení obsahu
- `form.tsx` - Formulářové komponenty s validací
- `select.tsx` - Výběrová pole
- `toast.tsx` - Notifikace (toast messages)
- `badge.tsx` - Odznaky a štítky
- `avatar.tsx` - Uživatelské avatary
- A další...

### Layout Komponenty (`/layout`)

Komponenty pro strukturu stránky a navigaci.

- `Sidebar.tsx` - Boční navigační panel
- `MainSidebar.tsx` - Hlavní sidebar s menu
- `DashboardNav.tsx` - Navigace pro dashboard
- `HomepageNav.tsx` - Navigace pro homepage
- `PageHeader.tsx` - Hlavička stránky s titulkem a akcemi
- `UnifiedLayout.tsx` - Sjednocený layout pro celou aplikaci

### Formulářové Komponenty (`/forms`)

Specializované formuláře pro různé entity.

- `AutoForm.tsx` - Formulář pro vytvoření/editaci vozidla
- `AutoDetailForm.tsx` - Detailní formulář vozidla
- `TransactionForm.tsx` - Formulář pro finanční transakce
- `MaintenanceForm.tsx` - Formulář pro údržbu
- `OpravaForm.tsx` - Formulář pro opravy
- `ServiceForm.tsx` - Formulář pro servis
- `GpsDeviceForm.tsx` - Formulář pro GPS zařízení

### Dashboard Komponenty (`/dashboard`)

Komponenty specifické pro dashboard sekci.

- `VehicleDashboard.tsx` - Hlavní dashboard vozidel
- `AutoTable.tsx` - Tabulka vozidel
- `AutoDetail.tsx` - Detail vozidla
- `TransactionTable.tsx` - Tabulka transakcí
- `MaintenanceAlerts.tsx` - Upozornění na údržbu
- `RecentActivities.tsx` - Nedávné aktivity
- `VehicleStatusOverview.tsx` - Přehled stavu vozidel

### Mapové Komponenty (`/maps`)

Komponenty pro zobrazení map a GPS sledování (založeno na Leaflet).

- `VehicleMap.tsx` - Mapa s vozidly
- `VehicleHistory.tsx` - Historie poloh vozidla
- `VehicleMapControls.tsx` - Ovládací prvky mapy
- `NewspaperDistribution.tsx` - Mapa distribuce novin
- `ZoneManagement.tsx` - Správa zón

## Příklad Použití Komponent

### Button Komponenta

Button komponenta podporuje různé varianty a velikosti:

```tsx
import { Button } from "@/components/ui/button"

// Základní použití
<Button>Klikni mě</Button>

// S variantou
<Button variant="destructive">Smazat</Button>
<Button variant="outline">Zrušit</Button>
<Button variant="ghost">Akce</Button>

// S velikostí
<Button size="sm">Malé tlačítko</Button>
<Button size="lg">Velké tlačítko</Button>
<Button size="icon">
  <Icon />
</Button>

// S ikonou
<Button>
  <PlusIcon className="mr-2" />
  Přidat vozidlo
</Button>

// S loading stavem
<Button disabled={isLoading}>
  {isLoading ? "Načítání..." : "Odeslat"}
</Button>
```

**Dostupné varianty:**
- `default` - Výchozí primární tlačítko
- `destructive` - Pro destruktivní akce (smazat)
- `outline` - Tlačítko s ohraničením
- `secondary` - Sekundární tlačítko
- `ghost` - Průhledné tlačítko
- `link` - Tlačítko stylizované jako odkaz

**Dostupné velikosti:**
- `default` - Výchozí velikost (h-10)
- `sm` - Malá velikost (h-9)
- `lg` - Velká velikost (h-11)
- `icon` - Čtvercové tlačítko pro ikony (h-10 w-10)

### Table Komponenta

Table komponenta poskytuje strukturované zobrazení dat:

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>SPZ</TableHead>
      <TableHead>Značka</TableHead>
      <TableHead>Model</TableHead>
      <TableHead>Stav</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {vehicles.map((vehicle) => (
      <TableRow key={vehicle.id}>
        <TableCell>{vehicle.spz}</TableCell>
        <TableCell>{vehicle.znacka}</TableCell>
        <TableCell>{vehicle.model}</TableCell>
        <TableCell>{vehicle.stav}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Dialog Komponenta

Modální okna pro dialogy a formuláře:

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

<Dialog>
  <DialogTrigger asChild>
    <Button>Otevřít dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Nadpis dialogu</DialogTitle>
      <DialogDescription>
        Popis dialogu
      </DialogDescription>
    </DialogHeader>
    {/* Obsah dialogu */}
    <DialogFooter>
      <Button variant="outline">Zrušit</Button>
      <Button>Potvrdit</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Form Komponenta s Validací

Formulář s React Hook Form a Zod validací:

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const formSchema = z.object({
  spz: z.string().min(1, "SPZ je povinná"),
  znacka: z.string().min(1, "Značka je povinná"),
})

export function VehicleForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      spz: "",
      znacka: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Zpracování formuláře
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="spz"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SPZ</FormLabel>
              <FormControl>
                <Input placeholder="ABC-1234" {...field} />
              </FormControl>
              <FormDescription>
                Státní poznávací značka vozidla
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Odeslat</Button>
      </form>
    </Form>
  )
}
```

## Best Practices

### 1. Kompozice Komponent

Využívejte kompozici pro vytváření komplexních komponent z jednoduchých:

```tsx
// ❌ Špatně - monolitická komponenta
function VehicleCard({ vehicle }) {
  return (
    <div className="card">
      {/* Všechno v jednom */}
    </div>
  )
}

// ✅ Dobře - kompozice
function VehicleCard({ vehicle }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{vehicle.spz}</CardTitle>
      </CardHeader>
      <CardContent>
        <VehicleDetails vehicle={vehicle} />
      </CardContent>
      <CardFooter>
        <VehicleActions vehicle={vehicle} />
      </CardFooter>
    </Card>
  )
}
```

### 2. Type Safety

Vždy používejte TypeScript typy pro props:

```tsx
interface VehicleCardProps {
  vehicle: {
    id: number
    spz: string
    znacka: string
    model: string
  }
  onEdit?: (id: number) => void
}

export function VehicleCard({ vehicle, onEdit }: VehicleCardProps) {
  // ...
}
```

### 3. Přístupnost (Accessibility)

- Používejte semantické HTML elementy
- Přidávejte `aria-label` pro ikony bez textu
- Zajišťujte klávesnicovou navigaci
- Testujte s screen readery

```tsx
<Button aria-label="Smazat vozidlo">
  <TrashIcon />
</Button>
```

### 4. Performance

- Používejte `React.memo()` pro komponenty, které se často re-renderují
- Lazy loading pro těžké komponenty
- Optimalizace obrázků pomocí Next.js Image komponenty

```tsx
import { memo } from "react"

export const VehicleCard = memo(function VehicleCard({ vehicle }) {
  // ...
})
```

### 5. Styling

- Preferujte Tailwind utility třídy před custom CSS
- Používejte `cn()` pro podmíněné třídy
- Využívejte CSS proměnné pro theming

```tsx
<div className={cn(
  "base-classes",
  isActive && "active-classes",
  className // Pro možnost přepsání zvenčí
)} />
```

## Custom Hooks

Pro sdílenou logiku mezi komponentami vytvářejte custom hooks:

```tsx
// hooks/useVehicle.ts
export function useVehicle(vehicleId: number) {
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVehicle(vehicleId).then(setVehicle).finally(() => setLoading(false))
  }, [vehicleId])

  return { vehicle, loading }
}

// Použití v komponentě
function VehicleDetail({ id }) {
  const { vehicle, loading } = useVehicle(id)
  // ...
}
```

## Související dokumentace

- [Root README](../../README.md) - Obecná dokumentace projektu
- [App Router dokumentace](../app/README.md) - Použití komponent v routách
- [Utility knihovny](../lib/README.md) - Pomocné funkce pro komponenty
- [Shadcn/ui dokumentace](https://ui.shadcn.com/) - Oficiální dokumentace
- [Tailwind CSS dokumentace](https://tailwindcss.com/docs) - Tailwind dokumentace

