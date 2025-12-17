# TypeScript Typy Dokumentace

## Úvod

Složka `src/types/` obsahuje TypeScript typy, rozhraní (interfaces) a type definitions pro celou aplikaci. Centralizace typů zajišťuje konzistenci, znovupoužitelnost a type safety napříč celým projektem.

## Proč Centralizovat Typy?

Centralizace typů přináší následující výhody:

1. **Konzistence** - Stejné typy jsou použity všude v aplikaci
2. **Znovupoužitelnost** - Typy lze importovat a používat v různých souborech
3. **Type Safety** - TypeScript může kontrolovat správnost použití typů
4. **Autocomplete** - IDE poskytuje lepší autocomplete a IntelliSense
5. **Refaktoring** - Změny typů se automaticky propagují všude
6. **Dokumentace** - Typy slouží jako dokumentace struktury dat

## Struktura Typů

### `index.ts` - Hlavní Export

Soubor `index.ts` slouží jako centrální export point pro všechny typy. Umožňuje importovat typy z jednoho místa:

```typescript
// Místo importu z jednotlivých souborů
import { Auto } from "@/types/auto"
import { Transakce } from "@/types/transakce"

// Můžete importovat z index.ts
import { Auto, Transakce } from "@/types"
```

### `auto.ts` - Typy pro Vozidla

Obsahuje typy a rozhraní související s vozidly (Auto).

**Hlavní typy:**

```typescript
export interface Auto {
  id: number
  spz: string
  znacka: string
  model: string
  rokVyroby: number
  najezd: number
  stav: "aktivní" | "servis" | "vyřazeno"
  fotky?: { id: string }[]
  datumSTK: string | undefined
  poznamka?: string
  pripnuto?: boolean
  poznatky?: { id: string; text: string; createdAt: string }[]
  thumbnailUrl?: any
}
```

**Použití:**
```typescript
import { Auto } from "@/types"

function VehicleCard({ vehicle }: { vehicle: Auto }) {
  return (
    <div>
      <h2>{vehicle.spz}</h2>
      <p>{vehicle.znacka} {vehicle.model}</p>
    </div>
  )
}
```

### `transakce.ts` - Typy pro Finanční Transakce

Obsahuje typy pro finanční transakce.

**Použití:**
```typescript
import { Transakce } from "@/types"

function TransactionList({ transactions }: { transactions: Transakce[] }) {
  return (
    <ul>
      {transactions.map(t => (
        <li key={t.id}>{t.nazev}: {t.castka} Kč</li>
      ))}
    </ul>
  )
}
```

### `oprava.ts` - Typy pro Opravy

Obsahuje typy pro opravy vozidel.

**Použití:**
```typescript
import { Oprava } from "@/types"

function RepairForm({ repair }: { repair?: Oprava }) {
  // Formulář pro opravu
}
```

### `next-auth.d.ts` - NextAuth Type Extensions

Rozšiřuje typy NextAuth.js pro přidání vlastních vlastností do session a user objektů.

**Účel:**
- Přidává vlastní vlastnosti do `Session` typu
- Rozšiřuje `User` typ o role a oprávnění
- Zajišťuje type safety pro NextAuth v aplikaci

**Obsah:**
```typescript
import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      role: string
      permissions: string[]
      allowedPages: string[]
      defaultLandingPage: string
    }
  }

  interface User {
    id: string
    email: string
    name: string | null
    role: string
    permissions: string[]
    allowedPages: string[]
    defaultLandingPage: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    name: string | null
    role: string
    permissions: string[]
    allowedPages: string[]
    defaultLandingPage: string
  }
}
```

**Výhody:**
- TypeScript zná strukturu session objektu
- Autocomplete pro `session.user.role`, `session.user.permissions`, atd.
- Kompilátor zachytí chyby při přístupu k neexistujícím vlastnostem

**Použití:**
```typescript
import { useSession } from "next-auth/react"

function MyComponent() {
  const { data: session } = useSession()
  
  // TypeScript ví o těchto vlastnostech
  const userRole = session?.user.role // ✅ Type-safe
  const permissions = session?.user.permissions // ✅ Type-safe
}
```

### `lucide-react.d.ts` - Lucide Icons Type Definitions

Type definitions pro Lucide React ikony (pokud jsou potřeba custom typy).

## Best Practices

### 1. Použití Union Types

Pro hodnoty s omezeným počtem možností použijte union types:

```typescript
// ✅ Dobře
type VehicleStatus = "aktivní" | "servis" | "vyřazeno"

// ❌ Špatně
type VehicleStatus = string
```

### 2. Optional Properties

Označte volitelné vlastnosti pomocí `?`:

```typescript
interface Auto {
  id: number // Povinné
  poznamka?: string // Volitelné
  fotky?: Foto[] // Volitelné
}
```

### 3. Readonly Properties

Pro neměnitelné vlastnosti použijte `readonly`:

```typescript
interface Auto {
  readonly id: number // Nelze změnit po vytvoření
  readonly createdAt: Date
  spz: string // Lze změnit
}
```

### 4. Generic Types

Pro znovupoužitelné typy použijte generics:

```typescript
interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}

type VehicleResponse = ApiResponse<Auto>
type UserResponse = ApiResponse<User>
```

### 5. Type Guards

Vytvářejte type guards pro runtime type checking:

```typescript
export function isAuto(obj: any): obj is Auto {
  return (
    typeof obj === "object" &&
    typeof obj.id === "number" &&
    typeof obj.spz === "string" &&
    typeof obj.znacka === "string"
  )
}

// Použití
if (isAuto(data)) {
  // TypeScript ví, že data je typu Auto
  console.log(data.spz)
}
```

### 6. Export z index.ts

Vždy exportujte typy z `index.ts` pro snadný import:

```typescript
// types/index.ts
export type { Auto } from "./auto"
export type { Transakce } from "./transakce"
export type { Oprava } from "./oprava"
```

## Vytváření Nových Typů

Při vytváření nových typů:

1. **Vytvořte nový soubor** v `src/types/` (např. `maintenance.ts`)
2. **Definujte typy** s TypeScript syntaxí
3. **Exportujte typy** z nového souboru
4. **Přidejte export** do `index.ts`

**Příklad:**

```typescript
// types/maintenance.ts
export interface Maintenance {
  id: number
  autoId: number
  datumUdrzby: Date
  popis: string
  cena: number
  typUdrzby: "pravidelná" | "oprava" | "výměna"
  stav: MaintenanceStatus
}

export type MaintenanceStatus = 
  | "PENDING" 
  | "APPROVED" 
  | "IN_PROGRESS" 
  | "COMPLETED" 
  | "CANCELLED"

// types/index.ts
export type { Maintenance, MaintenanceStatus } from "./maintenance"
```

## Prisma Typy

Pro typy generované z Prisma schema použijte:

```typescript
import { Auto, User, Transakce } from "@prisma/client"

// Pro typy s relations
import { Auto, User, Transakce } from "@prisma/client"
import type { AutoWithRelations } from "@/types"
```

## Související dokumentace

- [Root README](../../README.md) - Obecná dokumentace projektu
- [Databázová dokumentace](../../prisma/README.md) - Prisma schema a modely
- [TypeScript dokumentace](https://www.typescriptlang.org/docs/) - Oficiální TypeScript dokumentace

