# API Routes Dokumentace

## Úvod

Složka `src/app/api/` obsahuje všechny API routes (RESTful endpointy) aplikace. API routes v Next.js App Router jsou implementovány pomocí `route.ts` souborů, které exportují HTTP metody (GET, POST, PUT, DELETE, atd.).

## Struktura API Routes

Next.js App Router používá file-based routing pro API routes. Každá složka může obsahovat `route.ts` soubor, který definuje API endpoint.

**Příklad struktury:**
```
src/app/api/
├── auta/
│   ├── route.ts              # GET /api/auta, POST /api/auta
│   └── [id]/
│       └── route.ts          # GET /api/auta/:id, PUT /api/auta/:id
└── transakce/
    └── route.ts              # GET /api/transakce, POST /api/transakce
```

## Hlavní API Sekce

### `/api/auta` - Správa Vozidel

CRUD operace pro vozidla (Auto).

**Endpoints:**
- `GET /api/auta` - Seznam všech vozidel
- `GET /api/auta/[id]` - Detail vozidla
- `POST /api/auta` - Vytvoření nového vozidla
- `PUT /api/auta/[id]` - Aktualizace vozidla
- `DELETE /api/auta/[id]` - Smazání vozidla

**Další endpoints:**
- `GET /api/auta/all` - Všechna vozidla (včetně neaktivních)
- `POST /api/auta/bulk-update` - Hromadná aktualizace
- `POST /api/auta/bulk-archivovat` - Hromadná archivace
- `GET /api/auta/check-spz` - Kontrola dostupnosti SPZ
- `GET /api/auta/locations` - GPS polohy vozidel

### `/api/transakce` - Finanční Transakce

Správa finančních transakcí.

**Endpoints:**
- `GET /api/transakce` - Seznam transakcí
- `POST /api/transakce` - Vytvoření transakce
- `GET /api/transakce/[id]` - Detail transakce
- `PUT /api/transakce/[id]` - Aktualizace transakce
- `GET /api/transakce/[id]/invoice` - Stáhnutí faktury

### `/api/auth` - Autentizace

NextAuth.js endpointy pro autentizaci.

**Endpoints:**
- `POST /api/auth/[...nextauth]` - NextAuth handler (signin, signout, session)
- `POST /api/auth/init` - Inicializace (vytvoření prvního admina)
- `POST /api/auth/reset-password` - Resetování hesla

### `/api/admin` - Administrační Funkce

Administrační endpointy vyžadující ADMIN roli.

**Sekce:**
- `/api/admin/users` - Správa uživatelů
- `/api/admin/roles` - Správa rolí
- `/api/admin/settings` - Systémová nastavení
- `/api/admin/page-settings` - Nastavení stránek

### `/api/gps` - GPS Sledování

Endpoints pro GPS data.

**Endpoints:**
- `POST /api/gps/receive` - Příjem GPS dat z externích zařízení

### `/api/driver-login` - Řidičské Přihlášení

Endpoints pro řidičské funkce.

**Endpoints:**
- `POST /api/driver-login` - Přihlášení řidiče
- `GET /api/driver-login/lock-status` - Status zámku
- `GET /api/driver-login/restriction-status` - Status omezení

### `/api/user` - Uživatelské Funkce

Endpoints pro uživatelské operace.

**Endpoints:**
- `GET /api/user/profile` - Profil uživatele
- `PUT /api/user/profile` - Aktualizace profilu
- `PUT /api/user/password` - Změna hesla
- `GET /api/user/preferences` - Uživatelské preference
- `PUT /api/user/preferences` - Aktualizace preferencí

## Struktura Route Handleru

### Základní Template

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 1. Autentizace
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Nejste přihlášeni' },
        { status: 401 }
      )
    }

    // 2. Autorizace (pokud je potřeba)
    // if (!hasPermission(session.user, 'view_vehicles')) { ... }

    // 3. Business logika
    const data = await prisma.auto.findMany()

    // 4. Návrat odpovědi
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Nastala chyba' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Nejste přihlášeni' },
        { status: 401 }
      )
    }

    // Parsování těla požadavku
    const body = await request.json()

    // Validace (např. pomocí Zod)
    // const validated = schema.parse(body)

    // Vytvoření záznamu
    const data = await prisma.auto.create({ data: body })

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Nastala chyba' },
      { status: 500 }
    )
  }
}
```

## Best Practices

### 1. Autentizace

Vždy kontrolujte autentizaci na začátku každého handleru:

```typescript
const session = await getServerSession(authOptions)
if (!session) {
  return NextResponse.json(
    { error: 'Nejste přihlášeni' },
    { status: 401 }
  )
}
```

### 2. Autorizace

Kontrolujte oprávnění před provedením akce:

```typescript
import { hasPermission } from '@/lib/accessControl'

if (!hasPermission(session.user, 'edit_vehicles')) {
  return NextResponse.json(
    { error: 'Nemáte oprávnění' },
    { status: 403 }
  )
}
```

### 3. Validace Vstupů

Vždy validujte vstupní data:

```typescript
import { z } from 'zod'

const schema = z.object({
  spz: z.string().min(1),
  znacka: z.string().min(1),
})

try {
  const validated = schema.parse(body)
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Neplatná data', errors: error.flatten() },
      { status: 400 }
    )
  }
}
```

### 4. Error Handling

Vždy ošetřujte chyby:

```typescript
try {
  // Logika
} catch (error) {
  console.error('Error:', error)
  return NextResponse.json(
    { error: 'Nastala chyba' },
    { status: 500 }
  )
}
```

### 5. HTTP Status Codes

Používejte správné HTTP status kódy:

- `200` - Úspěch (GET, PUT)
- `201` - Vytvořeno (POST)
- `204` - Bez obsahu (DELETE)
- `400` - Špatný požadavek (validace)
- `401` - Neautorizován
- `403` - Zakázáno (bez oprávnění)
- `404` - Nenalezeno
- `500` - Chyba serveru

### 6. Type Safety

Používejte TypeScript typy:

```typescript
interface CreateVehicleRequest {
  spz: string
  znacka: string
  model: string
  // ...
}

export async function POST(request: NextRequest) {
  const body: CreateVehicleRequest = await request.json()
  // ...
}
```

## Dynamické Routy

Pro dynamické parametry použijte složky s hranatými závorkami:

```
api/
└── auta/
    └── [id]/
        └── route.ts    # /api/auta/:id
```

**Přístup k parametrům:**

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  // ...
}
```

## Query Parametry

Pro query parametry použijte `URLSearchParams`:

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = searchParams.get('page')
  const limit = searchParams.get('limit')
  // ...
}
```

## Související dokumentace

- [App Router dokumentace](../README.md) - Routing a struktura
- [Server Actions dokumentace](../actions/README.md) - Alternativa k API routes
- [Middleware dokumentace](../../MIDDLEWARE.md) - Autentizace middleware
- [Access Control dokumentace](../../lib/accessControl.ts) - Kontrola oprávnění
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) - Oficiální dokumentace

