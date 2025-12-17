# 🔐 Authentication & Authorization Implementation Guide

Tento dokument popisuje implementaci robustního systému autentizace a autorizace pro Fleet Management System.

## 📋 Přehled

Systém používá:
- **NextAuth.js** s Credentials Provider
- **Role-Based Access Control (RBAC)** s enum `Role` (ADMIN, DISPECER, RIDIC)
- **bcryptjs** pro hashování hesel
- **Zod** pro validaci
- **Czech column names** v databázi (Uzivatel model)

## 🗄️ Databázové Schéma

### Model Uzivatel

```prisma
enum Role {
  ADMIN
  DISPECER
  RIDIC
}

model Uzivatel {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  heslo     String   // Hashed password (bcrypt)
  jmeno     String?
  role      Role     @default(RIDIC)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([email])
}
```

### Migrace

Po přidání modelu do `schema.prisma`:

```bash
# Generovat Prisma Client
npx prisma generate

# Vytvořit migraci
npx prisma migrate dev --name add_uzivatel_model

# Nebo použít db push (pro vývoj)
npx prisma db push
```

## 🔧 Konfigurace

### 1. Environment Variables

Přidejte do `.env`:

```env
NEXTAUTH_SECRET="your-secret-key-here"  # Vygenerujte: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Vytvoření Prvního Uživatele

Vytvořte seed script nebo použijte Prisma Studio:

```typescript
// prisma/seed.ts (příklad)
import { PrismaClient, Role } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcryptjs.hash('admin123', 10)
  
  await prisma.uzivatel.create({
    data: {
      email: 'admin@example.com',
      heslo: hashedPassword,
      jmeno: 'Administrátor',
      role: Role.ADMIN,
    },
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

## 🛡️ Použití Auth Guard Utilities

### V API Routes

```typescript
import { validateUserSession, authorizeRole, createErrorResponse } from "@/lib/auth-guard"
import { Role } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    // ✅ Pouze ověření přihlášení
    const session = await validateUserSession()
    
    // ✅ Ověření přihlášení + role
    const session = await authorizeRole([Role.ADMIN])
    
    // ... váš kód
    
    return NextResponse.json({ data: result })
  } catch (error) {
    return createErrorResponse(error)
  }
}
```

### V Server Actions

```typescript
"use server"

import { validateUserSession, authorizeRole } from "@/lib/auth-guard"
import { Role } from "@prisma/client"

export async function createVehicle(data: VehicleData) {
  try {
    // ✅ Ověření přihlášení + role
    const session = await authorizeRole([Role.ADMIN, Role.DISPECER])
    
    // session.user.id - ID uživatele
    // session.user.role - role uživatele
    
    // ... váš kód
    
    return { success: true, data: result }
  } catch (error) {
    if (error.name === "AuthenticationError" || error.name === "AuthorizationError") {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Nastala chyba" }
  }
}
```

## 🔐 Role Hierarchy

Systém podporuje hierarchii rolí:

- **ADMIN** (nejvyšší) - plný přístup
- **DISPECER** (střední) - dispečerské funkce
- **RIDIC** (základní) - řidičské funkce

Middleware automaticky kontroluje hierarchii (ADMIN má přístup ke všemu).

## 🚦 Middleware Protection

Middleware automaticky chrání:

- `/dashboard/*` - vyžaduje přihlášení
- `/dashboard/admin/*` - vyžaduje ADMIN
- `/api/admin/*` - vyžaduje ADMIN

Neautentizovaní uživatelé jsou přesměrováni na `/login`.

## 📝 Validace Formulářů

### Login Form

```typescript
import { loginSchema } from "@/lib/validations/auth"
import { zodResolver } from "@hookform/resolvers/zod"

const form = useForm({
  resolver: zodResolver(loginSchema),
  defaultValues: {
    email: "",
    password: "",
  },
})
```

## 🔄 Migrace z Existujícího Systému

Pokud máte existující `User` model, můžete:

1. **Vytvořit migrační script** pro kopírování dat
2. **Použít oba modely současně** (dočasně)
3. **Postupně migrovat** uživatele na nový model

Příklad migračního scriptu:

```typescript
// scripts/migrate-users.ts
import { prisma } from "@/lib/prisma"
import bcryptjs from "bcryptjs"

async function migrateUsers() {
  const oldUsers = await prisma.user.findMany()
  
  for (const user of oldUsers) {
    // Mapování rolí (přizpůsobte podle vašeho systému)
    let role = Role.RIDIC
    if (user.roles?.some(r => r.role.name === "ADMIN")) {
      role = Role.ADMIN
    } else if (user.roles?.some(r => r.role.name === "MANAGER")) {
      role = Role.DISPECER
    }
    
    await prisma.uzivatel.create({
      data: {
        email: user.email,
        heslo: user.password, // Už je hashované
        jmeno: user.name,
        role,
      },
    })
  }
}
```

## ✅ Checklist Implementace

- [x] Přidán `Uzivatel` model do Prisma schema
- [x] Vytvořen `auth.config.ts` s NextAuth konfigurací
- [x] Vytvořen `auth-guard.ts` s utility funkcemi
- [x] Vytvořen NextAuth API route
- [x] Aktualizován middleware pro ochranu rout
- [x] Vytvořeny Zod validační schémata
- [x] Aktualizovány TypeScript typy
- [ ] Spuštěna migrace databáze
- [ ] Vytvořen seed script pro prvního admina
- [ ] Aktualizovány existující API routes
- [ ] Aktualizovány existující Server Actions
- [ ] Vytvořen login formulář
- [ ] Otestována autentizace a autorizace

## 🧪 Testování

### Test Autentizace

```typescript
// Test: Neautentizovaný přístup
const response = await fetch("/api/auta")
// Očekáváno: 401 Unauthorized

// Test: Autentizovaný přístup
const response = await fetch("/api/auta", {
  headers: {
    Cookie: "next-auth.session-token=valid-token"
  }
})
// Očekáváno: 200 OK s daty
```

### Test Autorizace

```typescript
// Test: RIDIC se snaží přistupovat k admin route
const response = await fetch("/api/admin/users", {
  headers: {
    Cookie: "next-auth.session-token=driver-token"
  }
})
// Očekáváno: 403 Forbidden
```

## 📚 Související Soubory

- `prisma/schema.prisma` - Databázové schéma
- `src/lib/auth.config.ts` - NextAuth konfigurace
- `src/lib/auth-guard.ts` - Auth guard utility
- `src/lib/validations/auth.ts` - Zod schémata
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API route
- `src/middleware.ts` - Route protection
- `src/types/next-auth.d.ts` - TypeScript typy

## 🆘 Troubleshooting

### "Nesprávný email nebo heslo"

- Zkontrolujte, že heslo je správně hashované (bcrypt)
- Ověřte, že email existuje v databázi
- Zkontrolujte, že `NEXTAUTH_SECRET` je nastaven

### "Neautorizovaný přístup"

- Zkontrolujte, že uživatel je přihlášen
- Ověřte, že session cookie je nastaven
- Zkontrolujte middleware konfiguraci

### "Nemáte oprávnění"

- Ověřte, že uživatel má správnou roli
- Zkontrolujte `authorizeRole()` volání
- Ověřte role hierarchy v middleware

---

**Vytvořeno:** 2025-01-XX  
**Verze:** 1.0.0


