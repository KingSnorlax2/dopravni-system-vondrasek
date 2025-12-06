# Fleet Management System

## Úvod

Fleet Management System je komplexní webová aplikace určená pro správu vozového parku. Systém umožňuje efektivní správu vozidel, jejich údržby, finančních transakcí, GPS sledování a distribuce novin. Aplikace je navržena s důrazem na škálovatelnost, bezpečnost a uživatelskou přívětivost.

Hlavní funkcionality systému zahrnují:
- Správa vozového parku (přidávání, editace, archivace vozidel)
- Sledování údržby a servisních záznamů
- Finanční management (transakce, faktury, schvalování výdajů)
- GPS sledování vozidel v reálném čase
- Správa uživatelů a rolí s pokročilým systémem oprávnění
- Distribuce novin s plánováním tras
- Generování reportů a analytických přehledů

## Technologický Stack

Aplikace je postavena na moderním technologickém stacku založeném na Next.js frameworku:

### Frontend
- **Next.js 14** - React framework s App Router pro server-side rendering a optimalizaci výkonu
- **React 18** - Knihovna pro stavbu uživatelského rozhraní
- **TypeScript** - Typovaný nadstavba JavaScriptu pro zvýšení bezpečnosti kódu
- **Tailwind CSS** - Utility-first CSS framework pro rychlý vývoj UI
- **Shadcn/ui** - Sada přístupných UI komponent založených na Radix UI
- **Framer Motion** - Knihovna pro animace a přechody
- **React Hook Form** - Efektivní správa formulářů s validací
- **Zod** - TypeScript-first schema validation
- **Recharts** - Knihovna pro vytváření grafů a vizualizací
- **Leaflet** - Open-source JavaScript knihovna pro interaktivní mapy

### Backend
- **Next.js API Routes** - Server-side API endpointy integrované do Next.js
- **Server Actions** - Next.js funkce pro server-side operace
- **Prisma ORM** - Moderní ORM pro TypeScript s type-safe databázovými dotazy
- **PostgreSQL** - Relační databázový systém pro ukládání dat
- **NextAuth.js 4** - Kompletní autentizační řešení pro Next.js
- **bcryptjs** - Hashování hesel pro bezpečné ukládání

### Nástroje a Utility
- **date-fns** - Moderní knihovna pro práci s datumy
- **js-cookie** - Práce s cookies v prohlížeči
- **nodemailer** - Odesílání e-mailů
- **react-pdf** - Generování a zobrazení PDF dokumentů
- **qrcode.react** - Generování QR kódů

## Instalace a Spuštění

### Předpoklady

Před instalací projektu je nutné mít nainstalované:
- **Node.js** (verze 18 nebo vyšší)
- **npm** nebo **yarn** package manager
- **PostgreSQL** databázový server (lokální nebo vzdálený)

### Kroky instalace

1. **Klonování repozitáře**
   ```bash
   git clone <repository-url>
   cd dopravni-system-vondrasek
   ```

2. **Instalace závislostí**
   ```bash
   npm install
   ```

3. **Konfigurace prostředí**
   
   Vytvořte soubor `.env` v kořenovém adresáři projektu a nastavte následující proměnné:
   ```env
   # Databáze
   DATABASE_URL="postgresql://user:password@localhost:5432/database_name?schema=public"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   
   # E-mail (volitelné, pro resetování hesla)
   SMTP_HOST="smtp.example.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@example.com"
   SMTP_PASSWORD="your-email-password"
   SMTP_FROM="noreply@example.com"
   ```

4. **Nastavení databáze**
   ```bash
   # Generování Prisma Client
   npx prisma generate
   
   # Spuštění migrací
   npx prisma migrate dev
   
   # (Volitelné) Naplnění databáze testovacími daty
   npm run db:seed
   ```

5. **Spuštění vývojového serveru**
   ```bash
   npm run dev
   ```

   Aplikace bude dostupná na adrese `http://localhost:3000`

### Další dostupné skripty

- `npm run build` - Vytvoření produkční build
- `npm run start` - Spuštění produkčního serveru
- `npm run lint` - Kontrola kódu pomocí ESLint
- `npm run dev:tunnel` - Spuštění vývojového serveru s lokálním tunelem (pro testování na mobilních zařízeních)

## Konfigurace

### Požadované environment proměnné

| Proměnná | Popis | Povinná |
|---------|-------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Ano |
| `NEXTAUTH_URL` | URL aplikace (např. http://localhost:3000) | Ano |
| `NEXTAUTH_SECRET` | Tajný klíč pro NextAuth (vygenerujte pomocí `openssl rand -base64 32`) | Ano |
| `SMTP_HOST` | SMTP server pro odesílání e-mailů | Ne |
| `SMTP_PORT` | Port SMTP serveru | Ne |
| `SMTP_USER` | Uživatelské jméno pro SMTP | Ne |
| `SMTP_PASSWORD` | Heslo pro SMTP | Ne |
| `SMTP_FROM` | E-mailová adresa odesílatele | Ne |

### Next.js konfigurace

Konfigurace Next.js se nachází v souboru `next.config.js`. Aktuální nastavení:
- Ignorování TypeScript chyb během buildu (pro vývoj)
- Ignorování ESLint chyb během buildu (pro vývoj)

**Poznámka:** V produkčním prostředí by měly být tyto možnosti vypnuty pro zajištění kvality kódu.

## Architektura

Aplikace využívá architekturu založenou na Next.js App Router, která umožňuje efektivní server-side rendering a optimalizaci výkonu. Níže je znázorněn tok dat v systému:

```mermaid
graph TD
    A[Client Browser] -->|HTTP Request| B[Next.js App Router]
    B -->|Route Matching| C{Page Type}
    C -->|Server Component| D[Server Component]
    C -->|Client Component| E[Client Component]
    C -->|API Route| F[API Route Handler]
    
    D -->|Server Actions| G[Server Actions]
    E -->|Client-side Logic| H[React Hooks]
    E -->|API Calls| F
    F -->|Database Queries| I[Prisma ORM]
    G -->|Database Queries| I
    
    I -->|SQL Queries| J[(PostgreSQL Database)]
    J -->|Query Results| I
    I -->|Type-safe Data| G
    I -->|Type-safe Data| F
    
    G -->|Response| D
    F -->|JSON Response| E
    D -->|Rendered HTML| B
    E -->|Interactive UI| A
    
    style A fill:#e1f5ff
    style B fill:#fff4e1
    style I fill:#ffe1f5
    style J fill:#e1ffe1
```

### Vysvětlení architektury

1. **Client Browser** - Uživatelský prohlížeč, který odesílá HTTP požadavky
2. **Next.js App Router** - Směrování požadavků na základě URL struktury
3. **Server Components** - Komponenty renderované na serveru pro lepší výkon
4. **Client Components** - Interaktivní komponenty s React hooks
5. **API Routes** - RESTful endpointy pro komunikaci s frontendem
6. **Server Actions** - Server-side funkce volané přímo z komponent
7. **Prisma ORM** - Type-safe databázová vrstva
8. **PostgreSQL** - Relační databáze pro trvalé ukládání dat

### Bezpečnostní vrstvy

- **Middleware** - Ověřování autentizace a autorizace před přístupem k routám
- **NextAuth.js** - Správa session a autentizace uživatelů
- **Role-based Access Control** - Systém rolí a oprávnění pro kontrolu přístupu
- **Password Hashing** - Hesla jsou hashována pomocí bcryptjs

### Systémový Přehled

Níže je znázorněn celkový přehled systému a jeho hlavních komponent:

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React Components] --> B[Next.js App Router]
        B --> C[Server Components]
        B --> D[Client Components]
        D --> E[React Hooks]
    end
    
    subgraph "Backend Layer"
        F[API Routes] --> G[Server Actions]
        G --> H[Business Logic]
        H --> I[Prisma ORM]
    end
    
    subgraph "Data Layer"
        I --> J[(PostgreSQL)]
        J --> K[Vehicle Data]
        J --> L[User Data]
        J --> M[Transaction Data]
    end
    
    subgraph "Security Layer"
        N[Middleware] --> O[NextAuth.js]
        O --> P[Role-Based Access]
        P --> Q[Permission Check]
    end
    
    subgraph "External Services"
        R[GPS Devices] --> S[GPS API]
        T[Email Service] --> U[SMTP Server]
    end
    
    B --> N
    F --> N
    G --> N
    S --> F
    H --> T
    
    style A fill:#e1f5ff
    style I fill:#ffe1f5
    style J fill:#e1ffe1
    style N fill:#fff4e1
    style O fill:#fff4e1
```

### Autentizační Flow

Sekvenční diagram znázorňující proces autentizace uživatele:

```mermaid
sequenceDiagram
    participant U as Uživatel
    participant B as Browser
    participant M as Middleware
    participant A as NextAuth.js
    participant DB as Database
    participant S as Session
    
    U->>B: Zadá přihlašovací údaje
    B->>A: POST /api/auth/signin
    A->>DB: Ověření uživatele
    DB-->>A: Uživatelské údaje + role
    A->>A: Hashování hesla (bcrypt)
    A->>A: Vytvoření JWT tokenu
    A->>S: Uložení session
    A-->>B: Session cookie
    B->>M: Požadavek na chráněnou stránku
    M->>A: Ověření JWT tokenu
    A-->>M: Token validní + role/permissions
    M->>M: Kontrola allowedPages
    M-->>B: Povolen přístup / Přesměrování
    B-->>U: Zobrazení stránky
```

### Hlavní Use Cases

Flow diagram pro hlavní případy použití systému:

```mermaid
flowchart TD
    Start([Uživatel přistupuje k systému]) --> Auth{Je přihlášen?}
    Auth -->|Ne| Login[Přihlášení]
    Auth -->|Ano| CheckRole{Kontrola role}
    
    Login --> Verify[Ověření údajů]
    Verify -->|Neúspěch| Login
    Verify -->|Úspěch| CheckRole
    
    CheckRole --> Admin{ADMIN?}
    CheckRole --> Driver{DRIVER?}
    CheckRole --> User{USER?}
    
    Admin --> AdminDash[Admin Dashboard]
    AdminDash --> ManageVehicles[Správa vozidel]
    AdminDash --> ManageUsers[Správa uživatelů]
    AdminDash --> ViewReports[Zobrazení reportů]
    AdminDash --> ApproveExpenses[Schvalování výdajů]
    
    Driver --> DriverDash[Driver Dashboard]
    DriverDash --> ViewAssigned[Zobrazení přiřazených vozidel]
    DriverDash --> ReportIssues[Hlášení problémů]
    DriverDash --> UpdateStatus[Aktualizace stavu vozidla]
    
    User --> UserDash[User Dashboard]
    UserDash --> ViewVehicles[Zobrazení vozidel]
    UserDash --> ViewTransactions[Zobrazení transakcí]
    UserDash --> ViewMaintenance[Zobrazení údržby]
    
    ManageVehicles --> End([Konec])
    ManageUsers --> End
    ViewReports --> End
    ApproveExpenses --> End
    ViewAssigned --> End
    ReportIssues --> End
    UpdateStatus --> End
    ViewVehicles --> End
    ViewTransactions --> End
    ViewMaintenance --> End
    
    style Admin fill:#ffcccc
    style Driver fill:#ccffcc
    style User fill:#ccccff
    style AdminDash fill:#ffe1f5
    style DriverDash fill:#e1ffe1
    style UserDash fill:#e1f5ff
```

### Komponentová Architektura

Přehled hlavních komponent a jejich vztahů:

```mermaid
graph LR
    subgraph "UI Components"
        A[Button] --> B[Form]
        C[Table] --> D[DataTable]
        E[Dialog] --> F[Modal]
        G[Card] --> H[Dashboard]
    end
    
    subgraph "Layout Components"
        I[Sidebar] --> J[MainLayout]
        K[Navbar] --> J
        L[PageHeader] --> J
    end
    
    subgraph "Feature Components"
        M[VehicleList] --> N[VehicleDetail]
        O[TransactionForm] --> P[TransactionTable]
        Q[MaintenanceForm] --> R[MaintenanceList]
        S[MapView] --> T[GPS Tracking]
    end
    
    subgraph "Forms"
        U[AutoForm] --> V[Validation]
        W[UserForm] --> V
        X[ServiceForm] --> V
    end
    
    J --> H
    B --> U
    B --> W
    B --> X
    H --> M
    H --> O
    H --> Q
    H --> S
    
    style A fill:#e1f5ff
    style M fill:#ffe1f5
    style J fill:#fff4e1
    style V fill:#e1ffe1
```

## Struktura projektu

```
dopravni-system-vondrasek/
├── prisma/              # Prisma schema a migrace
├── public/              # Statické soubory
├── src/
│   ├── app/            # Next.js App Router (routy, stránky)
│   ├── components/     # React komponenty
│   ├── lib/            # Utility funkce a knihovny
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript typy a definice
│   └── middleware.ts   # Next.js middleware pro autentizaci
├── scripts/            # Pomocné skripty
├── next.config.js      # Next.js konfigurace
└── package.json        # Projektové závislosti
```

Pro detailnější popis jednotlivých částí projektu viz příslušné README soubory:
- [App Router dokumentace](./src/app/README.md)
- [Databázová dokumentace](./prisma/README.md)
- [Komponenty dokumentace](./src/components/README.md)
- [Utility knihovny dokumentace](./src/lib/README.md)

## Licence

Tento projekt je vytvořen pro vzdělávací účely v rámci maturitní práce.
