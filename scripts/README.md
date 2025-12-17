# Skripty Dokumentace

## Úvod

Složka `scripts/` obsahuje pomocné skripty a utility pro vývoj, testování a správu projektu. Tyto skripty automatizují běžné úlohy a zjednodušují workflow vývoje.

## Dostupné Skripty

### `tunnel.js` - Cloudflare Tunnel

Skript pro vytvoření veřejného tunelu k lokálnímu vývojovému serveru pomocí Cloudflare Tunnel.

**Účel:**
- Vytvoření veřejné URL pro lokální server
- Umožňuje testování aplikace z externích zařízení (mobily, tablety)
- Užitečné pro testování na různých zařízeních bez nutnosti nasazení

**Použití:**
```bash
# Spuštění tunelu
node scripts/tunnel.js

# Nebo pomocí npm skriptu
npm run tunnel
```

**Jak to funguje:**
1. Skript spustí Cloudflare Tunnel pomocí `npx cloudflared`
2. Vytvoří veřejnou URL, která přesměrovává na `http://localhost:3000`
3. Zobrazí veřejnou URL v konzoli
4. Tunel běží, dokud není ukončen (Ctrl+C)

**Výstup:**
```
🌐 Vytvářím Cloudflare Tunnel pro přístup z internetu...

⏳ Počkejte, až se zobrazí veřejná URL...

[cloudflared output]
https://random-subdomain.trycloudflare.com
```

**Ukončení:**
- Stiskněte `Ctrl+C` pro ukončení tunelu
- Skript automaticky ukončí cloudflared proces

**Požadavky:**
- Internetové připojení
- `npx` (součást Node.js)
- Cloudflare Tunnel se stáhne automaticky při prvním použití

**Poznámky:**
- URL je dočasná a změní se při každém spuštění
- Tunel je veřejný - nepoužívejte pro produkční data
- Vhodné pouze pro vývoj a testování

### `cleanup-categories.js` / `cleanup-categories.ts`

Skripty pro čištění a správu kategorií v databázi.

**Účel:**
- Odstranění nepoužívaných kategorií
- Konsolidace duplicitních kategorií
- Údržba databáze

**Použití:**
```bash
# JavaScript verze
node scripts/cleanup-categories.js

# TypeScript verze (vyžaduje ts-node)
npx ts-node scripts/cleanup-categories.ts
```

**Poznámka:** Před spuštěním si zkontrolujte, co skript dělá, abyste nepřišli o data.

## Vytváření Nových Skriptů

Při vytváření nových skriptů dodržujte následující konvence:

### 1. Konvence pojmenování

- Používejte kebab-case (např. `generate-reports.js`)
- Popisný název, který jasně říká, co skript dělá
- `.js` pro JavaScript, `.ts` pro TypeScript

### 2. Struktura Skriptu

```javascript
#!/usr/bin/env node

/**
 * Popis skriptu
 * 
 * Použití: node scripts/nazev-skriptu.js [argumenty]
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    // Hlavní logika skriptu
    console.log('Skript běží...')
    
    // Práce s databází
    // ...
    
    console.log('✅ Hotovo!')
  } catch (error) {
    console.error('❌ Chyba:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
```

### 3. Error Handling

Vždy přidejte error handling:

```javascript
try {
  // Kód
} catch (error) {
  console.error('Chyba:', error.message)
  process.exit(1)
} finally {
  // Cleanup (např. uzavření DB připojení)
}
```

### 4. Logging

Používejte konzistentní logging s emoji pro lepší čitelnost:

```javascript
console.log('✅ Úspěch')
console.log('❌ Chyba')
console.log('⏳ Probíhá...')
console.log('ℹ️  Informace')
console.log('⚠️  Varování')
```

### 5. TypeScript Skripty

Pro TypeScript skripty použijte `ts-node`:

```typescript
// scripts/my-script.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Logika
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Spuštění:
```bash
npx ts-node scripts/my-script.ts
```

### 6. Přidání do package.json

Přidejte skripty do `package.json` pro snadné spuštění:

```json
{
  "scripts": {
    "tunnel": "node scripts/tunnel.js",
    "cleanup:categories": "node scripts/cleanup-categories.js",
    "generate:reports": "ts-node scripts/generate-reports.ts"
  }
}
```

Pak lze spustit:
```bash
npm run cleanup:categories
npm run generate:reports
```

## Bezpečnost

**Důležité bezpečnostní poznámky:**

1. **Nikdy necommitněte citlivé údaje** do skriptů
2. **Používejte environment proměnné** pro konfiguraci
3. **Ověřte, co skript dělá** před spuštěním na produkci
4. **Zálohujte data** před destruktivními operacemi
5. **Testujte skripty** nejprve na vývojovém prostředí

**Příklad bezpečného skriptu:**

```javascript
// Použití environment proměnných
const DRY_RUN = process.env.DRY_RUN === 'true'
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL není nastavena')
  process.exit(1)
}

if (DRY_RUN) {
  console.log('⚠️  DRY RUN mode - žádné změny nebudou provedeny')
}
```

## Užitečné Nástroje

Pro vytváření skriptů můžete použít:

- **Prisma Client** - Pro práci s databází
- **fs/promises** - Pro práci se soubory
- **path** - Pro práci s cestami
- **dotenv** - Pro načítání .env souborů

**Příklad s dotenv:**

```javascript
require('dotenv').config()

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Nyní máte přístup k process.env proměnným
```

## Související dokumentace

- [Root README](../README.md) - Obecná dokumentace projektu
- [Databázová dokumentace](../prisma/README.md) - Prisma a databáze
- [package.json](../package.json) - NPM skripty

