# Index Dokumentace - Fleet Management System

## Přehled

Tento dokument slouží jako centrální index všech README souborů a dokumentace v projektu. Všechna dokumentace je psána v češtině a je určena pro maturitní obhajobu.

## Hlavní Dokumentace

### 📄 [README.md](./README.md) - Hlavní dokumentace projektu
**Umístění:** Kořenový adresář  
**Obsah:**
- Úvod a popis projektu
- Technologický stack (Frontend, Backend, Nástroje)
- Instalace a spuštění
- Konfigurace (environment proměnné)
- Architektura s Mermaid diagramy:
  - Tok dat v systému
  - Systémový přehled
  - Autentizační flow
  - Hlavní use cases
  - Komponentová architektura
- Struktura projektu
- Odkazy na všechny poddokumentace

## Sekce Dokumentace

### 🗂️ App Router a Routing

#### [src/app/README.md](./src/app/README.md)
**Obsah:**
- Struktura Next.js App Router
- Route Groups a file-based routing
- Autentizace a ochrana cest
- Middleware integrace
- Mapování složek (api, actions, logined, newspaper)
- Navigační flow s Mermaid diagramem
- Best practices pro routing

#### [src/app/api/README.md](./src/app/api/README.md)
**Obsah:**
- RESTful API routes v Next.js
- Struktura API endpointů
- Hlavní API sekce (auta, transakce, auth, admin, gps, atd.)
- Template pro route handlery
- Autentizace a autorizace v API
- Validace vstupů
- HTTP status codes
- Best practices

#### [src/app/actions/README.md](./src/app/actions/README.md)
**Obsah:**
- Server Actions v Next.js 14
- Vytváření a použití Server Actions
- Validace pomocí Zod
- Revalidace cache
- Autentizace v Server Actions
- Best practices a template

### 🗄️ Databáze

#### [prisma/README.md](./prisma/README.md)
**Obsah:**
- Popis všech databázových modelů
- Entity Relationship Diagram (ERD) v Mermaid
- Vztahy mezi entitami
- České názvy atributů
- Prisma příkazy (migrate, generate, studio)
- Best practices pro práci s Prisma

### 🧩 Komponenty a UI

#### [src/components/README.md](./src/components/README.md)
**Obsah:**
- Design System (Shadcn/ui, Tailwind CSS)
- Struktura komponent (ui, layout, forms, dashboard, atd.)
- Příklady použití:
  - Button komponenta
  - Table komponenta
  - Dialog komponenta
  - Form s validací
- Best practices pro komponenty

### 🔧 Utility a Knihovny

#### [src/lib/README.md](./src/lib/README.md)
**Obsah:**
- Obecné utility funkce
- Prisma Client instance (db.ts)
- Autentizační konfigurace (auth.ts)
- Access Control (accessControl.ts)
- Email Service (emailService.ts)
- Image Utils (imageUtils.ts)
- Vztahy mezi moduly s Mermaid diagramem

#### [src/utils/README.md](./src/utils/README.md)
**Obsah:**
- Aplikace-specifické utility funkce
- Správa nastavení aplikace (settings.ts)
- Rozdíl mezi `src/lib/` a `src/utils/`
- Best practices pro utility funkce

### 🎣 React Hooks a Providers

#### [src/hooks/README.md](./src/hooks/README.md)
**Obsah:**
- Custom React hooks
- `useAccessControl` hook
- Příklady použití
- Best practices pro vytváření hooks
- Type safety

#### [src/providers/README.md](./src/providers/README.md)
**Obsah:**
- React Context Providers
- `SessionProvider` pro NextAuth
- Použití v komponentách
- Best practices pro providers
- Template pro nové providery

### 📝 TypeScript Typy

#### [src/types/README.md](./src/types/README.md)
**Obsah:**
- TypeScript typy a rozhraní
- NextAuth type extensions
- Typy pro vozidla, transakce, opravy
- Best practices pro práci s typy
- Vytváření nových typů

### 🔐 Bezpečnost a Autentizace

#### [src/MIDDLEWARE.md](./src/MIDDLEWARE.md)
**Obsah:**
- Next.js Middleware
- Autentizace a autorizace
- Route protection
- Token struktura
- allowedPages kontrola
- Best practices pro middleware
- Debugging a testování

### 📁 Statické Soubory

#### [public/README.md](./public/README.md)
**Obsah:**
- Statické soubory v Next.js
- Struktura uploads složky
- Bezpečnost nahraných souborů
- Validace uploadů
- Best practices

### 🛠️ Skripty

#### [scripts/README.md](./scripts/README.md)
**Obsah:**
- Pomocné skripty projektu
- Cloudflare Tunnel (tunnel.js)
- Cleanup skripty
- Vytváření nových skriptů
- Best practices a bezpečnost

## Mermaid Diagramy v Dokumentaci

Projekt obsahuje následující Mermaid diagramy:

1. **Architektura systému** (README.md)
   - Tok dat: Client → Next.js → Prisma → PostgreSQL

2. **Systémový přehled** (README.md)
   - Frontend, Backend, Data, Security, External Services vrstvy

3. **Autentizační flow** (README.md)
   - Sekvenční diagram procesu přihlášení

4. **Hlavní use cases** (README.md)
   - Flow diagram pro různé role (ADMIN, DRIVER, USER)

5. **Komponentová architektura** (README.md)
   - Vztahy mezi UI, Layout, Feature komponentami

6. **Navigační flow** (src/app/README.md)
   - Tok navigace uživatele v aplikaci

7. **Entity Relationship Diagram** (prisma/README.md)
   - ERD zobrazující vztahy mezi databázovými modely

8. **Vztahy mezi moduly** (src/lib/README.md)
   - Graf závislostí mezi utility moduly

## Struktura Dokumentace

```
dopravni-system-vondrasek/
├── README.md                    # Hlavní dokumentace
├── DOCUMENTATION_INDEX.md       # Tento soubor
│
├── prisma/
│   └── README.md                # Databázová dokumentace
│
├── public/
│   └── README.md                # Statické soubory
│
├── scripts/
│   └── README.md                # Skripty
│
└── src/
    ├── MIDDLEWARE.md            # Middleware dokumentace
    │
    ├── app/
    │   ├── README.md            # App Router
    │   ├── api/
    │   │   └── README.md        # API Routes
    │   └── actions/
    │       └── README.md        # Server Actions
    │
    ├── components/
    │   └── README.md            # Komponenty
    │
    ├── hooks/
    │   └── README.md            # Custom Hooks
    │
    ├── lib/
    │   └── README.md            # Utility knihovny
    │
    ├── providers/
    │   └── README.md            # React Providers
    │
    ├── types/
    │   └── README.md            # TypeScript Typy
    │
    └── utils/
        └── README.md            # Aplikace-specifické utility
```

## Jak používat tuto dokumentaci

1. **Začátek** - Začněte s [README.md](./README.md) pro obecný přehled
2. **Konkrétní téma** - Přejděte na příslušný README podle potřeby
3. **Hledání** - Použijte tento index pro rychlé nalezení dokumentace
4. **Maturitní obhajoba** - Všechny dokumenty jsou psány formálním stylem vhodným pro obhajobu

## Aktualizace dokumentace

Při přidávání nových funkcí nebo změnách v projektu:
1. Aktualizujte příslušný README soubor
2. Aktualizujte tento index, pokud je potřeba
3. Zkontrolujte odkazy mezi dokumenty

## Související dokumenty

Projekt obsahuje také další dokumentační soubory:
- `NETWORK_ACCESS.md` - Síťový přístup
- `DASHBOARD_MIGRATION_REPORT.md` - Zpráva o migraci dashboardu
- `DYNAMIC_ROLE_SYSTEM.md` - Dynamický systém rolí
- `USER_SETTINGS_DOCUMENTATION.md` - Dokumentace uživatelských nastavení
- `UNIFIED_DESIGN_GUIDE.md` - Průvodce jednotným designem

---

**Poslední aktualizace:** 2024  
**Jazyk:** Čeština  
**Účel:** Maturitní práce - Fleet Management System

