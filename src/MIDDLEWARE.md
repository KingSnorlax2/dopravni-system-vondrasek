# Middleware Dokumentace

## Úvod

Soubor `src/middleware.ts` obsahuje Next.js middleware, který se spouští před každým požadavkem na server. Middleware je klíčovou součástí bezpečnostního systému aplikace a zajišťuje autentizaci a autorizaci uživatelů před přístupem k chráněným routám.

## Co je Middleware?

Middleware v Next.js je funkce, která se spouští před dokončením požadavku. Umožňuje upravit požadavek nebo odpověď, provést redirecty, nebo blokovat přístup k určitým routám.

**Výhody:**
- **Centralizovaná autentizace** - Jedno místo pro kontrolu přihlášení
- **Autorizace** - Kontrola oprávnění před načtením stránky
- **Performance** - Blokování neautorizovaných požadavků před renderováním
- **Bezpečnost** - Ochrana citlivých rout na úrovni middleware

## Jak to funguje

Middleware se spouští pro každý požadavek, který odpovídá `matcher` konfiguraci. Proces probíhá následovně:

1. **Získání JWT tokenu** - Middleware načte JWT token z cookies pomocí `getToken()`
2. **Kontrola autentizace** - Ověří, zda je uživatel přihlášen
3. **Kontrola autorizace** - Ověří oprávnění uživatele (role, allowedPages)
4. **Akce** - Podle výsledku buď povolí přístup, nebo přesměruje

## Struktura Middleware

### Matcher Konfigurace

```typescript
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)"
  ]
}
```

**Význam:**
- Middleware se spouští pro všechny routy KROMĚ:
  - `/api/*` - API routes (mají vlastní autentizaci)
  - `/_next/static/*` - Statické soubory
  - `/_next/image/*` - Optimalizované obrázky
  - `/favicon.ico` - Favicon

### Hlavní Logika

#### 1. Přihlašovací stránka (`/`)

```typescript
if (isAuthPage) {
  if (token) {
    // Uživatel je přihlášen - přesměrovat na landing page
    const landing = String(token.defaultLandingPage || "/homepage");
    return NextResponse.redirect(new URL(landing, request.url));
  }
  return NextResponse.next(); // Povolit přístup
}
```

**Chování:**
- Pokud je uživatel přihlášen → přesměrování na výchozí stránku
- Pokud není přihlášen → povolen přístup k přihlašovací stránce

#### 2. Homepage (`/homepage`)

```typescript
if (isHomepage) {
  if (!token) {
    // Není přihlášen - přesměrovat na přihlášení
    return NextResponse.redirect(new URL("/", request.url));
  }
  // Kontrola allowedPages
  const allowedPages = Array.isArray(token.allowedPages) ? token.allowedPages : [];
  const isAllowed = allowedPages.some(page => 
    path === page || path.startsWith(page + "/")
  );
  if (!isAllowed) {
    return NextResponse.redirect(new URL("/403", request.url));
  }
  return NextResponse.next();
}
```

**Chování:**
- Kontrola přihlášení
- Kontrola, zda má uživatel přístup k stránce (allowedPages)
- Pokud nemá přístup → přesměrování na `/403`

#### 3. Dashboard routy (`/dashboard/*`)

```typescript
if (isDashboardPage) {
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  // Stejná kontrola allowedPages jako u homepage
  // ...
}
```

**Chování:**
- Stejná logika jako u homepage
- Všechny dashboard routy jsou chráněny

## Route Permissions

Middleware podporuje mapování rout na požadované role:

```typescript
const routePermissions: { pattern: RegExp; permission?: string; role?: string }[] = [
  { pattern: /^\/dashboard\/admin(\/|$)/, role: "ADMIN" },
  { pattern: /^\/api\/admin\//, role: "ADMIN" },
  { pattern: /^\/dashboard\/noviny\/distribuce\/driver-route(\/|$)/, role: "DRIVER" },
];
```

**Poznámka:** Tato funkcionalita je připravena, ale aktuálně se používá kontrola `allowedPages` z tokenu.

## Token Struktura

JWT token obsahuje následující informace:

```typescript
{
  id: string
  email: string
  name: string | null
  role: string
  permissions: string[]
  allowedPages: string[]
  defaultLandingPage: string
}
```

### allowedPages

Seznam stránek, ke kterým má uživatel přístup. Middleware kontroluje:
- Přesnou shodu: `path === page`
- Prefix match: `path.startsWith(page + "/")` (pro podstránky)

**Příklad:**
```typescript
allowedPages: ["/dashboard/auta", "/dashboard/transakce"]
// Povolí:
// - /dashboard/auta ✅
// - /dashboard/auta/123 ✅
// - /dashboard/transakce ✅
// Nepovolí:
// - /dashboard/admin ❌
```

## Best Practices

### 1. Přidávání Nových Chráněných Rout

Při přidávání nové chráněné routy:

```typescript
// Přidejte kontrolu do middleware
const isNewRoute = request.nextUrl.pathname.startsWith("/new-route");

if (isNewRoute) {
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  // Kontrola oprávnění
  // ...
}
```

### 2. Role-based Access

Pro routy vyžadující specifickou roli:

```typescript
if (isAdminRoute) {
  if (!token || token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/403", request.url));
  }
}
```

### 3. Public Routes

Pro veřejné routy (např. `/about`, `/contact`):

```typescript
const publicRoutes = ["/about", "/contact", "/public-page"];

if (publicRoutes.includes(request.nextUrl.pathname)) {
  return NextResponse.next(); // Povolit bez kontroly
}
```

### 4. Performance

- Middleware běží na Edge runtime - měl by být rychlý
- Minimalizujte databázové dotazy v middleware
- Používejte cache pro často dotazovaná data

## Debugging

### Logování

Pro debugging můžete přidat logování:

```typescript
console.log('Middleware:', {
  path: request.nextUrl.pathname,
  hasToken: !!token,
  role: token?.role,
  allowedPages: token?.allowedPages,
});
```

### Testování

Testování middleware:

1. **Bez tokenu** - Ověřte přesměrování na `/`
2. **S tokenem bez oprávnění** - Ověřte přesměrování na `/403`
3. **S tokenem s oprávněním** - Ověřte povolený přístup

## Bezpečnostní Poznámky

1. **Nikdy nevěřte klientovi** - Všechny kontroly musí být na serveru
2. **Validujte tokeny** - NextAuth automaticky validuje JWT tokeny
3. **Https v produkci** - Vždy používejte HTTPS pro zabezpečení cookies
4. **Session timeout** - NextAuth automaticky expiruje session po 30 dnech
5. **Rate limiting** - Zvažte přidání rate limitingu pro ochranu před útoky

## Související dokumentace

- [Root README](../README.md) - Obecná dokumentace projektu
- [App Router dokumentace](./app/README.md) - Routing a stránky
- [NextAuth dokumentace](./auth.ts) - Autentizační konfigurace
- [Access Control dokumentace](./lib/accessControl.ts) - Kontrola oprávnění
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware) - Oficiální dokumentace

