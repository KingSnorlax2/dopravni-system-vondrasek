---
name: Kompletni README dokumentace
overview: Vytvorit jednotny, kompletni root README v cestine pro vyvojare i uzivatele, ktery pokryje setup, architekturu, funkce, role, API prehled, databazi, provoz i troubleshooting, a sjednoti nesrovnalosti v existujici dokumentaci.
todos:
  - id: doc-audit
    content: Projit existujici dokumentacni soubory a vytahnout overena fakta do jednotne osnovy README
    status: completed
  - id: readme-structure
    content: Navrhnout finalni strukturu README pro kombinovane publikum (uzivatel + vyvojar) a poradi sekci
    status: completed
  - id: setup-env
    content: Zkompletovat sekci instalace, spusteni, skripty a .env promenne podle realneho kodu
    status: completed
  - id: features-routes
    content: Zdokumentovat hlavni moduly aplikace, dashboard sekce, role/opravneni a specialni toky (maintenance, reset hesla, driver flow)
    status: completed
  - id: backend-data
    content: "Zdokumentovat backend prehled: API domény, auth flow, Prisma modely/migrace/seed a cron/email integrace"
    status: completed
  - id: operations-security
    content: Doplnit provozni a bezpecnostni poznamky (seed credentialy, CRON_SECRET, SMTP_PASS vs SMTP_PASSWORD, mazani DB pri resetu)
    status: completed
  - id: verification-pass
    content: Provest finalni konzistencni kontrolu README, odkazu a prikladu prikazu
    status: completed
isProject: false
---

# Plan: Kompletni README dokumentace

## Cíl

Vytvorit jedno centralni `README.md` v cestine, ktere srozumitelne pokryje cely projekt pro dve skupiny: koncove uzivatele/adminy i vyvojare. README bude slouzit jako hlavni vstupni bod a propoji existujici detailni dokumenty.

## Co uz je zmapovano

- Projekt je Next.js 14 + React 18 + TypeScript + Prisma + NextAuth + Tailwind.
- Klicove runtime oblasti jsou ve `src/app`, API ve `src/app/api`, DB schema a migrace v `prisma`.
- Existuje vice dokumentacnich souboru (root + modulove README), ktere je potreba sjednotit do jedne konzistentni hlavni dokumentace.
- Byly nalezeny dulezite provozni body k explicitnimu uvedeni v README (SMTP promenne, cron secret, seed ucty, reset databaze).

## Implementacni kroky

### 1) Audit a sjednoceni zdroju pravdy

- Projit a porovnat existujici docs:
  - [C:/Users/petrv/Desktop/dopravni-system-vondrasek/README.md](C:/Users/petrv/Desktop/dopravni-system-vondrasek/README.md)
  - [C:/Users/petrv/Desktop/dopravni-system-vondrasek/DOCUMENTATION_INDEX.md](C:/Users/petrv/Desktop/dopravni-system-vondrasek/DOCUMENTATION_INDEX.md)
  - [C:/Users/petrv/Desktop/dopravni-system-vondrasek/src/app/README.md](C:/Users/petrv/Desktop/dopravni-system-vondrasek/src/app/README.md)
  - [C:/Users/petrv/Desktop/dopravni-system-vondrasek/src/app/api/README.md](C:/Users/petrv/Desktop/dopravni-system-vondrasek/src/app/api/README.md)
  - [C:/Users/petrv/Desktop/dopravni-system-vondrasek/prisma/README.md](C:/Users/petrv/Desktop/dopravni-system-vondrasek/prisma/README.md)
- Ověřit fakta proti kodu (skripty, env, auth flow, middleware, API domény), neprepisovat README podle zastaralych tvrzeni.

### 2) Navrh finalni osnovy README

- README bude mit dve rychle vstupni cesty:
  - „Jsem uzivatel/admin“ (jak pouzivat system)
  - „Jsem vyvojar“ (jak nainstalovat, spustit, vyvijet)
- Navrzene hlavni sekce:
  - O projektu
  - Hlavni funkce (auta, transakce, opravy, grafy, admin, driver flow)
  - Role a opravneni
  - Architektura a struktura projektu
  - Rychly start (lokalne)
  - Konfigurace `.env`
  - Databaze (Prisma, migrace, seed)
  - API prehled (domény + auth pravidla)
  - Provoz (cron, emaily, maintenance)
  - Bezpecnostni a provozni upozorneni
  - Troubleshooting
  - Odkazy na detailni docs

### 3) Setup a konfigurace podle realneho projektu

- Zdrojove soubory pro setup:
  - [C:/Users/petrv/Desktop/dopravni-system-vondrasek/package.json](C:/Users/petrv/Desktop/dopravni-system-vondrasek/package.json)
  - [C:/Users/petrv/Desktop/dopravni-system-vondrasek/prisma/schema.prisma](C:/Users/petrv/Desktop/dopravni-system-vondrasek/prisma/schema.prisma)
  - [C:/Users/petrv/Desktop/dopravni-system-vondrasek/vercel.json](C:/Users/petrv/Desktop/dopravni-system-vondrasek/vercel.json)
- Do README doplnit:
  - podporovane Node verze
  - vsechny script prikazy a kdy je pouzit
  - presny seznam env promennych, vcetne vysvetleni (DB/Auth/SMTP/Cron/GPS)
  - sjednoceni nazvu SMTP promenne na realne pouzivanou (`SMTP_PASS`).

### 4) Funkcni a produktova dokumentace (uzivatelska cast)

- Zmapovat a popsat hlavni obrazovky a workflow:
  - [C:/Users/petrv/Desktop/dopravni-system-vondrasek/src/app/page.tsx](C:/Users/petrv/Desktop/dopravni-system-vondrasek/src/app/page.tsx)
  - [C:/Users/petrv/Desktop/dopravni-system-vondrasek/src/app/homepage/page.tsx](C:/Users/petrv/Desktop/dopravni-system-vondrasek/src/app/homepage/page.tsx)
  - [C:/Users/petrv/Desktop/dopravni-system-vondrasek/src/app/dashboard](C:/Users/petrv/Desktop/dopravni-system-vondrasek/src/app/dashboard)
  - [C:/Users/petrv/Desktop/dopravni-system-vondrasek/src/app/reset-password](C:/Users/petrv/Desktop/dopravni-system-vondrasek/src/app/reset-password)
  - [C:/Users/petrv/Desktop/dopravni-system-vondrasek/src/app/maintenance](C:/Users/petrv/Desktop/dopravni-system-vondrasek/src/app/maintenance)
- Pridat stručny „Jak pouzivat“ tok pro admina a bezneho uzivatele.

### 5) Technicka dokumentace (vyvojarska cast)

- Auth/permissions popsat podle:
  - [C:/Users/petrv/Desktop/dopravni-system-vondrasek/src/lib/auth.config.ts](C:/Users/petrv/Desktop/dopravni-system-vondrasek/src/lib/auth.config.ts)
  - [C:/Users/petrv/Desktop/dopravni-system-vondrasek/src/middleware.ts](C:/Users/petrv/Desktop/dopravni-system-vondrasek/src/middleware.ts)
  - [C:/Users/petrv/Desktop/dopravni-system-vondrasek/src/types/next-auth.d.ts](C:/Users/petrv/Desktop/dopravni-system-vondrasek/src/types/next-auth.d.ts)
- Backend/API/DB prehled podle:
  - [C:/Users/petrv/Desktop/dopravni-system-vondrasek/src/app/api](C:/Users/petrv/Desktop/dopravni-system-vondrasek/src/app/api)
  - [C:/Users/petrv/Desktop/dopravni-system-vondrasek/src/lib/prisma.ts](C:/Users/petrv/Desktop/dopravni-system-vondrasek/src/lib/prisma.ts)
  - [C:/Users/petrv/Desktop/dopravni-system-vondrasek/prisma/seed.ts](C:/Users/petrv/Desktop/dopravni-system-vondrasek/prisma/seed.ts)
- Pridat prehled API domén a autorizacniho modelu (bez nutnosti vypisovat vsech ~60 endpointu detailne).

### 6) Provozni a bezpecnostni sekce

- Explicitne uvést:
  - riziko default seed uctu v neprodukcnim prostredi
  - potrebu `CRON_SECRET` pro cron endpointy
  - dopad prikazu, ktere resetuji DB data
  - rozdily dev/prod chovani (napr. fallback URL, test endpointy)

### 7) Finalizace a kontrola kvality

- Zkontrolovat konzistenci terminologie, odkazu, prikazu a env nazvu.
- Overit, ze README je citelne bez znalosti kodu a soucasne dostatecne konkretni pro vyvojare.
- Zachovat detailni hlubsi docs jako doplnky, README jako hlavni navigacni bod.

## Vystup

- Aktualizovany centralni soubor:
  - [C:/Users/petrv/Desktop/dopravni-system-vondrasek/README.md](C:/Users/petrv/Desktop/dopravni-system-vondrasek/README.md)
- README bude kompletni, cesky psane, a obsahove pokryje „everything“ na urovni hlavni projektove dokumentace s odkazy na detailni podklady.

