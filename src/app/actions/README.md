# Server Actions Dokumentace

## Úvod

Složka `src/app/actions/` obsahuje Server Actions - server-side funkce Next.js 14, které mohou být volány přímo z React komponent. Server Actions poskytují type-safe způsob komunikace mezi klientem a serverem bez nutnosti vytváření API routes.

## Co jsou Server Actions?

Server Actions jsou asynchronní funkce, které běží výhradně na serveru. Jsou označeny direktivou `'use server'` a mohou být volány přímo z Client Components nebo Server Components.

**Výhody Server Actions:**
- **Type Safety** - Plná podpora TypeScript mezi klientem a serverem
- **Automatická serializace** - Next.js automaticky serializuje parametry a návratové hodnoty
- **Bez API Routes** - Není potřeba vytvářet samostatné API endpointy
- **Revalidace** - Integrovaná podpora pro revalidaci cache
- **Progresivní enhancement** - Fungují i bez JavaScriptu (s form actions)

## Struktura

```
src/app/actions/
└── repairs.ts          # Server Actions pro správu oprav
```

## Dostupné Server Actions

### `repairs.ts` - Správa Oprav

Obsahuje Server Actions pro vytváření a načítání oprav vozidel.

#### `createRepair(data: CreateRepairInput)`

Vytvoří novou opravu vozidla.

**Vstupní typ:**
```typescript
type CreateRepairInput = {
  autoId: number
  kategorie: string
  popis: string
  datum: Date | string
  najezd: number
  poznamka?: string | null
  cena?: number | null
}
```

**Návratový typ:**
```typescript
{
  success: boolean
  data?: Oprava
  error?: string
  errors?: Record<string, string[]>
}
```

**Validace:**
- Používá Zod schema pro validaci vstupních dat
- Kontroluje existenci vozidla
- Validuje, že nájezd není záporný
- Validuje, že cena není záporná

**Side Effects:**
- Aktualizuje nájezd vozidla, pokud je nový nájezd větší
- Revaliduje cache pro `/dashboard/opravy` a detail vozidla

**Použití:**
```tsx
'use client'

import { createRepair } from '@/app/actions/repairs'
import { useForm } from 'react-hook-form'

function RepairForm({ vehicleId }: { vehicleId: number }) {
  const { register, handleSubmit } = useForm()

  const onSubmit = async (data: any) => {
    const result = await createRepair({
      autoId: vehicleId,
      kategorie: data.kategorie,
      popis: data.popis,
      datum: data.datum,
      najezd: Number(data.najezd),
      poznamka: data.poznamka || null,
      cena: data.cena ? Number(data.cena) : null,
    })

    if (result.success) {
      // Úspěch
      console.log('Oprava vytvořena:', result.data)
    } else {
      // Chyba
      console.error('Chyba:', result.error)
      if (result.errors) {
        console.error('Validační chyby:', result.errors)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Formulář */}
    </form>
  )
}
```

#### `getRepairs(autoId?: number)`

Načte seznam oprav. Pokud je zadáno `autoId`, vrátí pouze opravy pro dané vozidlo.

**Návratový typ:**
```typescript
{
  success: boolean
  data: Oprava[]
  error?: string
}
```

**Použití:**
```tsx
import { getRepairs } from '@/app/actions/repairs'

// Všechny opravy
const allRepairs = await getRepairs()

// Opravy pro konkrétní vozidlo
const vehicleRepairs = await getRepairs(vehicleId)

if (allRepairs.success) {
  console.log('Opravy:', allRepairs.data)
}
```

## Best Practices

### 1. Direktiva 'use server'

Vždy označte Server Actions direktivou `'use server'`:

```typescript
'use server'

export async function myAction() {
  // ...
}
```

### 2. Validace vstupů

Vždy validujte vstupní data pomocí Zod nebo jiné validace:

```typescript
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

export async function createUser(data: unknown) {
  try {
    const validated = schema.parse(data)
    // Použij validated
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.flatten() }
    }
  }
}
```

### 3. Error Handling

Vždy ošetřujte chyby a vracejte strukturované odpovědi:

```typescript
export async function myAction() {
  try {
    // Logika
    return { success: true, data: result }
  } catch (error) {
    console.error('Error:', error)
    return { 
      success: false, 
      error: 'Došlo k chybě' 
    }
  }
}
```

### 4. Revalidace Cache

Používejte `revalidatePath` nebo `revalidateTag` po mutacích:

```typescript
import { revalidatePath } from 'next/cache'

export async function updateVehicle(id: number, data: any) {
  // Update v databázi
  await prisma.auto.update({ where: { id }, data })
  
  // Revalidace
  revalidatePath('/dashboard/auta')
  revalidatePath(`/dashboard/auta/${id}`)
}
```

### 5. Type Safety

Exportujte TypeScript typy pro vstupy:

```typescript
import { z } from 'zod'

const schema = z.object({
  name: z.string(),
})

export type CreateUserInput = z.infer<typeof schema>

export async function createUser(input: CreateUserInput) {
  // ...
}
```

### 6. Autentizace a Autorizace

Vždy kontrolujte oprávnění v Server Actions:

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission } from '@/lib/accessControl'

export async function deleteVehicle(id: number) {
  const session = await getServerSession(authOptions)
  
  if (!hasPermission(session?.user, 'delete_vehicles')) {
    return { 
      success: false, 
      error: 'Nemáte oprávnění' 
    }
  }
  
  // Smazání vozidla
}
```

## Vytváření Nových Server Actions

### Template

```typescript
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Zod schema
const schema = z.object({
  // Definice schématu
})

export type ActionInput = z.infer<typeof schema>

export async function myAction(input: ActionInput) {
  try {
    // 1. Autentizace/autorizace
    const session = await getServerSession(authOptions)
    if (!session) {
      return { success: false, error: 'Nejste přihlášeni' }
    }

    // 2. Validace
    const validated = schema.parse(input)

    // 3. Business logika
    const result = await prisma.model.create({
      data: validated,
    })

    // 4. Revalidace
    revalidatePath('/relevant-path')

    // 5. Návrat výsledku
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Neplatná data',
        errors: error.flatten().fieldErrors,
      }
    }

    console.error('Error:', error)
    return {
      success: false,
      error: 'Nastala chyba',
    }
  }
}
```

## Server Actions vs API Routes

### Kdy použít Server Actions:
- ✅ Jednoduché CRUD operace
- ✅ Formulářové submity
- ✅ Mutace dat
- ✅ Když nepotřebujete REST API

### Kdy použít API Routes:
- ✅ Potřebujete REST API pro externí klienty
- ✅ Webhooky
- ✅ Komplexní API s více endpointy
- ✅ Když potřebujete více kontrol nad HTTP metodami

## Související dokumentace

- [App Router dokumentace](../README.md) - Routing a struktura aplikace
- [Root README](../../../README.md) - Obecná dokumentace projektu
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) - Oficiální dokumentace

