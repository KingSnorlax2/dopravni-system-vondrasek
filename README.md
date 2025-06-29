# Dopravní systém

Systém pro správu vozového parku s GPS sledováním, údržbou a transakcemi.

## Funkce

- **Správa vozidel**: Přidávání, editace a archivace vozidel
- **GPS sledování**: Reálné sledování polohy vozidel
- **Údržba a servis**: Plánování a evidence údržby
- **Tankování**: Evidence tankování a spotřeby
- **Transakce**: Správa finančních transakcí
- **Fotogalerie**: Správa fotografií vozidel
- **Uživatelské účty**: Správa uživatelů a oprávnění
- **Reset hesla**: Zapomenuté heslo s emailovým resetem

## Instalace

1. Klonujte repozitář
2. Nainstalujte závislosti: `npm install`
3. Nastavte environment proměnné (viz níže)
4. Spusťte migrace: `npx prisma migrate dev`
5. Spusťte vývojový server: `npm run dev`

## Environment proměnné

Vytvořte soubor `.env.local` s následujícími proměnnými:

```env
# Databáze
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Email (pro reset hesla)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"

# Aplikace
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Nastavení emailu pro reset hesla

Pro Gmail:
1. Povolte 2FA na vašem Google účtu
2. Vygenerujte "App Password" v nastavení zabezpečení
3. Použijte tento app password jako `SMTP_PASS`

## Použití

### Reset hesla

1. Na přihlašovací stránce klikněte na "Zapomenuté heslo?"
2. Zadejte svůj email
3. Klikněte na "Odeslat email"
4. Zkontrolujte email a klikněte na odkaz pro reset
5. Zadejte nové heslo

### Vytvoření admin účtu

V development módu je k dispozici tlačítko pro vytvoření admin účtu:
- Email: `admin@example.com`
- Heslo: `admin123`

## Technologie

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Databáze**: PostgreSQL s Prisma ORM
- **Autentifikace**: NextAuth.js
- **Email**: Nodemailer
- **UI**: Shadcn/ui komponenty

## Struktura projektu

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API endpoints
│   ├── dashboard/      # Dashboard stránky
│   └── reset-password/ # Reset hesla stránka
├── components/         # React komponenty
├── lib/               # Utility funkce
└── types/             # TypeScript typy
```

## API Endpoints

### Autentifikace
- `POST /api/auth/reset-password` - Požádat o reset hesla
- `PUT /api/auth/reset-password` - Resetovat heslo s tokenem

### Vozidla
- `GET /api/auta` - Seznam vozidel
- `POST /api/auta` - Vytvořit vozidlo
- `PATCH /api/auta/[id]` - Upravit vozidlo
- `DELETE /api/auta/[id]` - Smazat vozidlo

### Uživatelé
- `GET /api/users` - Seznam uživatelů
- `POST /api/users` - Vytvořit uživatele
- `PUT /api/user/password` - Změnit heslo

## Vývoj

```bash
# Spustit vývojový server
npm run dev

# Spustit build
npm run build

# Spustit produkční server
npm start

# Spustit linting
npm run lint

# Spustit type checking
npm run type-check
```

## Databáze

```bash
# Spustit migrace
npx prisma migrate dev

# Zobrazit databázi
npx prisma studio

# Reset databáze
npx prisma migrate reset
```

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
