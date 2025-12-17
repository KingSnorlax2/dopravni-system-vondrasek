# 🚀 Performance Refactoring Guide - Server Components Migration

## 📊 Analýza Současného Stavu

**Problém:** 139 souborů s `"use client"` direktivou
- Zbytečně velký JavaScript bundle
- Client-side data fetching místo server-side
- Horší SEO a první načtení stránky

## ✅ Refaktorované Stránky

### 1. `/dashboard/auta` (src/app/dashboard/auta/page.tsx)

**Před:**
- ❌ Client Component s `useState`, `useEffect`
- ❌ Client-side `fetch('/api/auta')`
- ❌ ~450 řádků kódu v jednom souboru

**Po:**
- ✅ Server Component (async, fetche data z Prisma)
- ✅ Client Component wrapper (`AutoPageClient`) pouze pro interaktivní části
- ✅ Data serializována (Date → string)
- ✅ `router.refresh()` pro aktualizaci po mutacích

**Výsledek:**
- 📉 Bundle size: ~-30KB (odhad)
- ⚡ Faster initial load: Data se načítají na serveru
- 🔍 Better SEO: Server-rendered content

### 2. `/dashboard` (src/app/dashboard/page.tsx)

**Před:**
- ❌ Client Component s `useEffect` a `fetch('/api/dashboard/fleet-overview')`
- ❌ Loading state na klientu

**Po:**
- ✅ Server Component fetche data přímo z Prisma
- ✅ Client Component (`DashboardPageClient`) pouze pro UI
- ✅ Žádný loading state (data jsou připravena před renderem)

## 🏗️ Architektonický Pattern

### Server Component (page.tsx)
```typescript
import { prisma } from '@/lib/prisma'

export default async function Page() {
  // ✅ Direct database query
  const data = await prisma.model.findMany()
  
  // ✅ Serialize dates for client
  const serialized = data.map(item => ({
    ...item,
    date: item.date?.toISOString() || null
  }))
  
  // ✅ Pass to client component
  return <ClientComponent data={serialized} />
}
```

### Client Component (Leaf Component)
```typescript
"use client"

import { useState, useEffect } from 'react'

export function ClientComponent({ data }: { data: SerializedData[] }) {
  // ✅ Only interactive logic
  const [isOpen, setIsOpen] = useState(false)
  
  // ✅ Update local state when props change
  useEffect(() => {
    // Handle prop updates
  }, [data])
  
  return (
    // Interactive UI only
  )
}
```

## 📋 Checklist pro Refaktoring

### Pro každou stránku:

- [ ] **Identifikovat data fetching**
  - Najít všechny `fetch()` volání
  - Najít všechny `useEffect` s data fetching

- [ ] **Vytvořit Server Component**
  - Odstranit `"use client"`
  - Přidat `async` k funkci
  - Přesunout `fetch()` → `prisma.query()`

- [ ] **Vytvořit Client Component wrapper**
  - Extrahovat interaktivní logiku
  - Předat data jako props
  - Použít `router.refresh()` pro aktualizace

- [ ] **Serializovat data**
  - Date → string (`.toISOString()`)
  - Zkontrolovat, že všechny props jsou serializovatelné

- [ ] **Testovat**
  - Ověřit, že data se načítají správně
  - Ověřit, že mutace fungují
  - Ověřit, že `router.refresh()` aktualizuje data

## 🎯 Další Stránky k Refaktoringu

### Priorita VYSOKÁ (často používané):
1. ✅ `/dashboard/auta` - **DOKONČENO**
2. ✅ `/dashboard` - **DOKONČENO**
3. ⏳ `/dashboard/transakce` - Má client-side fetch
4. ⏳ `/dashboard/auta/[id]` - Detail vozidla
5. ⏳ `/dashboard/opravy` - Seznam oprav

### Priorita STŘEDNÍ:
6. ⏳ `/dashboard/auta/archiv` - Archiv vozidel
7. ⏳ `/dashboard/auta/servis` - Servisní záznamy
8. ⏳ `/dashboard/users` - Správa uživatelů

### Priorita NÍZKÁ:
9. ⏳ `/dashboard/settings` - Nastavení
10. ⏳ `/dashboard/account` - Účet uživatele

## 🔧 Nástroje a Utility

### Pro aktualizaci dat po mutacích:

**Možnost 1: router.refresh()** (doporučeno)
```typescript
const router = useRouter()
await mutateData()
router.refresh() // Re-fetches Server Component data
```

**Možnost 2: Server Actions s revalidatePath**
```typescript
'use server'
import { revalidatePath } from 'next/cache'

export async function updateVehicle(id: number, data: any) {
  await prisma.auto.update({ where: { id }, data })
  revalidatePath('/dashboard/auta') // Automatically refreshes
}
```

## 📈 Očekávané Výsledky

### Bundle Size
- **Před:** ~500KB+ JavaScript
- **Po:** ~300KB JavaScript (odhad -40%)
- **Úspora:** ~200KB

### Performance Metrics
- **First Contentful Paint:** -200ms (odhad)
- **Time to Interactive:** -300ms (odhad)
- **Largest Contentful Paint:** -150ms (odhad)

### SEO
- ✅ Server-rendered content
- ✅ Better meta tags support
- ✅ Faster indexing

## ⚠️ Důležité Poznámky

1. **Date Serialization:** Vždy serializujte Date objekty na stringy před předáním do Client Component
   ```typescript
   datumSTK: date?.toISOString() || null
   ```

2. **Router Refresh:** `router.refresh()` re-renderuje Server Component, ale Client Component musí aktualizovat state z props
   ```typescript
   useEffect(() => {
     setData(initialData)
   }, [initialData])
   ```

3. **Composition Pattern:** Používejte composition pro předávání Server Components do Client wrappers
   ```typescript
   // ✅ Good
   <ClientWrapper>
     <ServerComponent data={data} />
   </ClientWrapper>
   ```

4. **Leaf Components:** Client Components by měly být "leaf nodes" - pouze pro interaktivitu, ne pro data fetching

## 🧪 Testování

### Co testovat:
1. ✅ Data se načítají správně při prvním načtení
2. ✅ Mutace (create/update/delete) fungují
3. ✅ `router.refresh()` aktualizuje data
4. ✅ Loading states fungují správně
5. ✅ Error handling funguje

### Performance testy:
```bash
# Build a zkontrolovat bundle size
npm run build

# Lighthouse audit
# Otevřít Chrome DevTools > Lighthouse > Performance
```

## 📚 Reference

- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [React Server Components](https://react.dev/reference/rsc/server-components)

---

**Status:** ✅ Částečně dokončeno (2/10 stránek)  
**Datum:** 2025-01-XX


