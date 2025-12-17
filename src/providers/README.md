# React Providers Dokumentace

## Úvod

Složka `src/providers/` obsahuje React Context Providers, které poskytují sdílený stav a funkcionalitu napříč komponentami aplikace. Providers obalují části aplikace a poskytují kontext, který mohou komponenty spotřebovávat pomocí React hooks.

## Proč Providers?

React Providers umožňují:

1. **Sdílení stavu** - Sdílení dat mezi komponentami bez prop drilling
2. **Globální konfigurace** - Centrální konfigurace pro celou aplikaci
3. **Context API** - Využití React Context API pro předávání dat
4. **Znovupoužitelnost** - Providers lze použít na různých úrovních aplikace

## Dostupné Providers

### `SessionProvider.tsx` - NextAuth Session Provider

Provider pro NextAuth.js session management v React komponentách.

**Účel:**
- Poskytuje NextAuth session kontext pro celou aplikaci
- Umožňuje komponentám přístup k session datům pomocí `useSession()` hooku
- Zajišťuje správné načítání a aktualizaci session

**Použití:**

#### 1. Obalení aplikace v Root Layout

```tsx
// src/app/layout.tsx
import { SessionProvider } from "@/providers/SessionProvider"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

#### 2. Použití v komponentách

```tsx
'use client'

import { useSession } from "next-auth/react"

function UserProfile() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div>Načítání...</div>
  }

  if (status === "unauthenticated") {
    return <div>Přihlaste se</div>
  }

  return (
    <div>
      <h1>Vítejte, {session?.user?.name}</h1>
      <p>Email: {session?.user?.email}</p>
      <p>Role: {session?.user?.role}</p>
    </div>
  )
}
```

**Vlastnosti SessionProvider:**

- **Automatické načítání session** - Session se načte automaticky při mount
- **Refresh session** - Automatické obnovování session v pravidelných intervalech
- **Type safety** - Plná podpora TypeScript s rozšířenými typy z `src/types/next-auth.d.ts`
- **SSR support** - Správná práce s server-side renderingem

**Session Object Structure:**

```typescript
{
  user: {
    id: string
    email: string
    name: string | null
    role: string
    permissions: string[]
    allowedPages: string[]
    defaultLandingPage: string
  },
  expires: string
}
```

**Příklady použití:**

#### Kontrola autentizace

```tsx
'use client'

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

function ProtectedComponent() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  if (status === "loading") return <LoadingSpinner />
  if (!session) return null

  return <div>Chráněný obsah</div>
}
```

#### Kontrola rolí a oprávnění

```tsx
'use client'

import { useSession } from "next-auth/react"
import { useAccessControl } from "@/hooks/useAccessControl"

function AdminPanel() {
  const { hasRole, hasPermission } = useAccessControl()

  if (!hasRole("ADMIN")) {
    return <div>Nemáte oprávnění</div>
  }

  return (
    <div>
      {hasPermission("manage_users") && <UserManagement />}
      {hasPermission("view_reports") && <Reports />}
    </div>
  )
}
```

#### Zobrazení uživatelských informací

```tsx
'use client'

import { useSession } from "next-auth/react"

function UserMenu() {
  const { data: session } = useSession()

  return (
    <div>
      <Avatar src={session?.user?.avatar} />
      <div>
        <p>{session?.user?.name}</p>
        <p className="text-sm text-muted-foreground">
          {session?.user?.email}
        </p>
        <Badge>{session?.user?.role}</Badge>
      </div>
    </div>
  )
}
```

## Best Practices

### 1. Umístění Provideru

Provider by měl být umístěn co nejvýše v komponentovém stromu, ideálně v root layoutu:

```tsx
// ✅ Dobře - v root layoutu
// app/layout.tsx
<SessionProvider>
  {children}
</SessionProvider>

// ❌ Špatně - příliš nízko v hierarchii
<SomeComponent>
  <SessionProvider>
    {children}
  </SessionProvider>
</SomeComponent>
```

### 2. Client Components

Providers musí být použity v Client Components (s `'use client'` direktivou):

```tsx
'use client'

import { SessionProvider } from "@/providers/SessionProvider"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

### 3. Kombinace více Providerů

Pokud máte více providerů, můžete je vnořit:

```tsx
'use client'

import { SessionProvider } from "@/providers/SessionProvider"
import { ThemeProvider } from "@/providers/ThemeProvider"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
```

### 4. Error Boundaries

Zvažte použití Error Boundary kolem providerů:

```tsx
<ErrorBoundary>
  <SessionProvider>
    {children}
  </SessionProvider>
</ErrorBoundary>
```

## Vytváření Nových Providerů

Při vytváření nových providerů dodržujte následující strukturu:

### Template pro nový Provider

```tsx
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface MyContextType {
  value: string
  setValue: (value: string) => void
}

const MyContext = createContext<MyContextType | undefined>(undefined)

export function MyProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<string>('')

  useEffect(() => {
    // Inicializace nebo načtení dat
  }, [])

  return (
    <MyContext.Provider value={{ value, setValue }}>
      {children}
    </MyContext.Provider>
  )
}

export function useMyContext() {
  const context = useContext(MyContext)
  if (context === undefined) {
    throw new Error('useMyContext must be used within MyProvider')
  }
  return context
}
```

### Příklad: Theme Provider

```tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    // Načtení z localStorage
    const saved = localStorage.getItem('theme') as Theme
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    // Aplikace tématu
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
```

## Související dokumentace

- [Root README](../../README.md) - Obecná dokumentace projektu
- [Custom Hooks dokumentace](../hooks/README.md) - Hooks používající providers
- [NextAuth dokumentace](https://next-auth.js.org/) - Oficiální NextAuth dokumentace
- [React Context dokumentace](https://react.dev/reference/react/createContext) - Oficiální React dokumentace

