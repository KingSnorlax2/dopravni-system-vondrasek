# Utility Funkce Dokumentace

## Úvod

Složka `src/utils/` obsahuje utility funkce specifické pro aplikaci, které se liší od obecných utility funkcí v `src/lib/`. Tyto funkce jsou zaměřené na konkrétní funkcionality aplikace, jako je správa nastavení, formátování dat specifických pro doménu, a další pomocné funkce.

## Rozdíl mezi `src/lib/` a `src/utils/`

- **`src/lib/`** - Obecné utility funkce, které by mohly být použity v jakémkoli projektu (např. `cn()`, `db`, `accessControl`)
- **`src/utils/`** - Aplikace-specifické utility funkce, které jsou vázané na business logiku tohoto projektu

## Dostupné Utility Funkce

### `settings.ts` - Správa Nastavení Aplikace

Poskytuje funkce pro správu uživatelských nastavení aplikace ukládaných v localStorage.

**Účel:**
- Ukládání a načítání uživatelských preferencí
- Persistence nastavení mezi relacemi
- Výchozí hodnoty pro všechna nastavení

**Rozhraní:**

```typescript
export interface AppSettings {
  // Nastavení zobrazení tabulky
  itemsPerPage: number
  sortField: string
  sortOrder: 'asc' | 'desc'
  
  // Nastavení filtrů
  filterStav: string
  filterSTK: string
  dateFrom: string | null
  dateTo: string | null
  mileageFrom: string | null
  mileageTo: string | null
  
  // Nastavení aplikace
  enableNotifications: boolean
  stkWarningDays: number
}
```

**Funkce:**

#### `loadSettings(): AppSettings`

Načte nastavení z localStorage nebo vrátí výchozí hodnoty.

```typescript
import { loadSettings } from "@/utils/settings"

const settings = loadSettings()
console.log(settings.itemsPerPage) // 10 (výchozí)
console.log(settings.sortField) // 'spz' (výchozí)
```

**Chování:**
- Pokud není `window` dostupný (SSR), vrátí výchozí nastavení
- Pokud není v localStorage nic uloženo, vrátí výchozí nastavení
- Pokud dojde k chybě při parsování, vrátí výchozí nastavení

#### `saveSettings(settings: Partial<AppSettings>): void`

Uloží nastavení do localStorage. Přijímá pouze částečné nastavení a sloučí ho s existujícími.

```typescript
import { saveSettings } from "@/utils/settings"

// Uložení pouze jednoho nastavení
saveSettings({ itemsPerPage: 20 })

// Uložení více nastavení najednou
saveSettings({
  itemsPerPage: 25,
  sortField: 'znacka',
  sortOrder: 'asc',
  enableNotifications: false
})
```

**Chování:**
- Sloučí nová nastavení s existujícími (merge)
- Pokud není `window` dostupný (SSR), funkce nic neudělá
- Pokud dojde k chybě, chyba je zalogována do konzole

**Použití v komponentách:**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { loadSettings, saveSettings } from '@/utils/settings'

function VehicleTable() {
  const [settings, setSettings] = useState(loadSettings)

  useEffect(() => {
    // Načtení nastavení při mount
    setSettings(loadSettings())
  }, [])

  const handleItemsPerPageChange = (value: number) => {
    const newSettings = { ...settings, itemsPerPage: value }
    setSettings(newSettings)
    saveSettings({ itemsPerPage: value })
  }

  return (
    <div>
      <select 
        value={settings.itemsPerPage} 
        onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
      >
        <option value={10}>10</option>
        <option value={25}>25</option>
        <option value={50}>50</option>
      </select>
      {/* Tabulka s itemsPerPage */}
    </div>
  )
}
```

**Výchozí nastavení:**

```typescript
const DEFAULT_SETTINGS: AppSettings = {
  itemsPerPage: 10,
  sortField: 'spz',
  sortOrder: 'desc',
  filterStav: 'vse',
  filterSTK: 'vse',
  dateFrom: null,
  dateTo: null,
  mileageFrom: null,
  mileageTo: null,
  enableNotifications: true,
  stkWarningDays: 30
}
```

## Best Practices

### 1. SSR Safety

Všechny funkce, které používají `localStorage` nebo `window`, musí kontrolovat, zda běží na klientu:

```typescript
if (typeof window === 'undefined') {
  // SSR - vrať výchozí hodnoty
  return DEFAULT_SETTINGS
}
```

### 2. Error Handling

Vždy ošetřujte chyby při práci s localStorage:

```typescript
try {
  const saved = localStorage.getItem('key')
  return saved ? JSON.parse(saved) : defaultValue
} catch (error) {
  console.error('Failed to load:', error)
  return defaultValue
}
```

### 3. Partial Updates

Při ukládání nastavení používejte merge pattern:

```typescript
// ✅ Dobře - sloučí s existujícími
saveSettings({ itemsPerPage: 20 })

// ❌ Špatně - přepíše všechna nastavení
saveSettings({ itemsPerPage: 20 }) // Ztratí ostatní nastavení
```

### 4. Type Safety

Vždy používejte TypeScript typy pro nastavení:

```typescript
import type { AppSettings } from '@/utils/settings'

function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings())
  // ...
}
```

## Vytváření Nových Utility Funkcí

Při vytváření nových utility funkcí v této složce:

1. **Zaměřte se na aplikaci-specifické funkce** - Obecné utility patří do `src/lib/`
2. **Používejte TypeScript** - Všechny funkce by měly být type-safe
3. **Dokumentujte** - Přidejte JSDoc komentáře
4. **SSR Safety** - Kontrolujte `typeof window` pro browser-only API
5. **Error Handling** - Vždy ošetřujte chyby

**Příklad nové utility funkce:**

```typescript
// utils/vehicle-utils.ts

/**
 * Formátuje SPZ pro zobrazení
 */
export function formatSPZ(spz: string): string {
  return spz.toUpperCase().replace(/\s+/g, '')
}

/**
 * Vypočítá průměrnou spotřebu vozidla
 */
export function calculateAverageConsumption(
  totalLiters: number,
  totalKm: number
): number {
  if (totalKm === 0) return 0
  return (totalLiters / totalKm) * 100 // L/100km
}
```

## Související dokumentace

- [Root README](../../README.md) - Obecná dokumentace projektu
- [Utility knihovny dokumentace](../lib/README.md) - Obecné utility funkce
- [Komponenty dokumentace](../components/README.md) - Použití utility v komponentách

