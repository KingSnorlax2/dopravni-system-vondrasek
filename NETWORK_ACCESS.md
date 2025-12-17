# 🌐 Přístup k aplikaci přes síť a internet

## Lokální síť (stejná Wi‑Fi)

Pro přístup z jiných zařízení ve stejné síti:

1. Spusťte server:
   ```bash
   npm run dev
   # nebo
   pnpm dev
   ```

2. Použijte adresu: `http://10.0.1.11:3000` (nebo vaši IP adresu)

## Internet (z jakékoliv sítě)

Pro přístup z internetu z jakékoliv sítě:

### Metoda 1: Cloudflare Tunnel (doporučeno)

1. **Spusťte server s tunelem**:
   ```bash
   npm run dev:tunnel
   # nebo
   pnpm dev:tunnel
   ```

2. Počkejte, až se zobrazí **veřejná URL** (např. `https://xxxxx.trycloudflare.com`)

3. **Sdílejte tuto URL** s kýmkoliv na internetu - budou moci přistupovat k vaší aplikaci!

### Metoda 2: Ngrok (alternativa)

Pokud Cloudflare Tunnel nefunguje, použijte ngrok:

1. **Spusťte Next.js server** (v jednom terminálu):
   ```bash
   npm run dev
   ```

2. **Spusťte ngrok** (v druhém terminálu):
   ```bash
   npx ngrok http 3000
   ```

3. Zkopírujte **Forwarding URL** z ngrok výstupu

## Důležité poznámky

- ⚠️ **Bezpečnost**: Veřejný tunel je přístupný komukoliv, kdo má URL. Používejte pouze pro vývoj/testování.
- 🔒 **Produkce**: Pro produkční nasazení použijte správné hosting řešení (Vercel, AWS, atd.)
- 🛑 **Ukončení**: Pro zastavení serveru stiskněte `Ctrl+C`

## Řešení problémů

### Chyba "endpoint IP is not correct"
- Použijte Cloudflare Tunnel (metoda 1 výše) nebo ngrok (metoda 2)
- localtunnel může mít dočasné problémy

### Cloudflare Tunnel nefunguje
- Zkuste nainstalovat cloudflared ručně: `npm install -g cloudflared`
- Nebo použijte ngrok: `npx ngrok http 3000`

### Port 3000 je obsazený
- Zastavte jiný proces na portu 3000
- Nebo změňte port: `next dev -H 0.0.0.0 -p 3001` a upravte tunel na port 3001

