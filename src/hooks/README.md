# Custom React Hooks Dokumentace

## Úvod

Složka `src/hooks/` obsahuje vlastní (custom) React hooks, které poskytují znovupoužitelnou logiku napříč komponentami aplikace. Custom hooks umožňují extrahovat stavovou logiku z komponent a sdílet ji mezi různými částmi aplikace.

## Proč Custom Hooks?

Custom hooks přinášejí následující výhody:

1. **Znovupoužitelnost** - Logika může být použita v více komponentách
2. **Testovatelnost** - Hooks lze testovat izolovaně
3. **Čistší komponenty** - Komponenty se zaměřují na renderování, logika je oddělena
4. **Sdílení stavu** - Sdílení stavové logiky mezi komponentami
5. **Type Safety** - Plná podpora TypeScript

## Dostupné Hooks

### `useAccessControl`

Hook pro kontrolu oprávnění a rolí uživatele v React komponentách.

**Účel:**
- Poskytuje jednoduché API pro kontrolu oprávnění v komponentách
- Integruje NextAuth session s access control systémem
- Zajišťuje type-safe kontroly oprávnění

**Použití:**
```tsx
import { useAccessControl } from "@/hooks/useAccessControl"

function AdminPanel() {
  const { 
    user, 
    isAuthenticated, 
    loading, 
    hasRole, 
    hasPermission 
  } = useAccessControl()

  if (loading) return <div>Načítání...</div>
  if (!isAuthenticated) return <div>Přihlaste se</div>

  // Kontrola role
  if (!hasRole("ADMIN")) {
    return <div>Nemáte oprávnění</div>
  }

  // Kontrola specifického oprávnění
  if (!hasPermission("manage_users")) {
    return <div>Nemáte oprávnění spravovat uživatele</div>
  }

  return <div>Admin panel</div>
}
```

**Vrácené hodnoty:**

| Vlastnost | Typ | Popis |
|-----------|-----|-------|
| `user` | `User \| undefined` | Uživatelský objekt ze session |
| `isAuthenticated` | `boolean` | Zda je uživatel přihlášen |
| `loading` | `boolean` | Zda se session načítá |
| `hasRole(role: string)` | `(role: string) => boolean` | Funkce pro kontrolu role |
| `hasPermission(permission: string)` | `(permission: string) => boolean` | Funkce pro kontrolu oprávnění |
| `hasAnyPermission(permissions: string[])` | `(permissions: string[]) => boolean` | Kontrola, zda má alespoň jedno oprávnění |
| `hasAllPermissions(permissions: string[])` | `(permissions: string[]) => boolean` | Kontrola, zda má všechna oprávnění |

**Příklady použití:**

#### Podmíněné zobrazení podle role
```tsx
function Dashboard() {
  const { hasRole } = useAccessControl()

  return (
    <div>
      {hasRole("ADMIN") && <AdminSection />}
      {hasRole("DRIVER") && <DriverSection />}
      <CommonSection />
    </div>
  )
}
```

#### Podmíněné zobrazení podle oprávnění
```tsx
function VehicleActions({ vehicleId }: { vehicleId: number }) {
  const { hasPermission } = useAccessControl()

  return (
    <div>
      {hasPermission("edit_vehicles") && (
        <Button onClick={() => editVehicle(vehicleId)}>
          Upravit
        </Button>
      )}
      {hasPermission("delete_vehicles") && (
        <Button onClick={() => deleteVehicle(vehicleId)}>
          Smazat
        </Button>
      )}
    </div>
  )
}
```

#### Kontrola více oprávnění
```tsx
function FinancialSection() {
  const { hasAnyPermission, hasAllPermissions } = useAccessControl()

  // Zobrazit, pokud má alespoň jedno z oprávnění
  if (!hasAnyPermission(["view_transactions", "view_reports"])) {
    return <div>Nemáte přístup</div>
  }

  // Vyžadovat všechna oprávnění pro kritické akce
  const canApprove = hasAllPermissions([
    "view_transactions",
    "approve_expenses"
  ])

  return (
    <div>
      <TransactionList />
      {canApprove && <ApproveButton />}
    </div>
  )
}
```

## Best Practices

### 1. Použití v Client Components

Custom hooks musí být použity pouze v Client Components (komponenty s `'use client'` direktivou):

```tsx
'use client'

import { useAccessControl } from "@/hooks/useAccessControl"

export function MyComponent() {
  const { hasPermission } = useAccessControl()
  // ...
}
```

### 2. Loading States

Vždy zkontrolujte loading stav před použitím hooku:

```tsx
function ProtectedComponent() {
  const { loading, isAuthenticated, hasPermission } = useAccessControl()

  if (loading) {
    return <Skeleton />
  }

  if (!isAuthenticated) {
    return <LoginPrompt />
  }

  if (!hasPermission("required_permission")) {
    return <AccessDenied />
  }

  return <ProtectedContent />
}
```

### 3. Optimalizace

Pro optimalizaci výkonu můžete použít `useMemo` pro memoizaci výsledků:

```tsx
function OptimizedComponent() {
  const { hasPermission } = useAccessControl()
  
  const canEdit = useMemo(
    () => hasPermission("edit_vehicles"),
    [hasPermission]
  )

  return canEdit ? <EditButton /> : null
}
```

### 4. Error Handling

Přidejte error handling pro edge cases:

```tsx
function SafeComponent() {
  const { user, hasPermission } = useAccessControl()

  // Fallback pro případy, kdy session není k dispozici
  const canAccess = user ? hasPermission("view_dashboard") : false

  return canAccess ? <Dashboard /> : <AccessDenied />
}
```

## Vytváření Nových Hooks

Při vytváření nových custom hooks dodržujte následující konvence:

### Konvence pojmenování

- Začněte názvem s `use` (např. `useVehicle`, `useTransactions`)
- Používejte camelCase
- Název by měl popisovat účel hooku

### Struktura Hooku

```tsx
import { useState, useEffect } from "react"

export function useVehicle(vehicleId: number) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchVehicle() {
      try {
        setLoading(true)
        const data = await fetch(`/api/vehicles/${vehicleId}`)
        const vehicle = await data.json()
        setVehicle(vehicle)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchVehicle()
  }, [vehicleId])

  return { vehicle, loading, error }
}
```

### TypeScript Typy

Vždy definujte TypeScript typy pro návratové hodnoty:

```tsx
interface UseVehicleReturn {
  vehicle: Vehicle | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useVehicle(vehicleId: number): UseVehicleReturn {
  // Implementace
}
```

## Související dokumentace

- [Root README](../../README.md) - Obecná dokumentace projektu
- [Komponenty dokumentace](../components/README.md) - Použití hooks v komponentách
- [Utility knihovny](../lib/README.md) - Access control utility funkce
- [React Hooks dokumentace](https://react.dev/reference/react) - Oficiální React dokumentace

