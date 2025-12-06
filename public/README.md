# Statické Soubory Dokumentace

## Úvod

Složka `public/` obsahuje statické soubory, které jsou servovány přímo Next.js serverem. Tyto soubory jsou dostupné na kořenové URL aplikace a neprocházejí procesem buildování nebo transpilace.

## Struktura

```
public/
├── *.svg              # SVG ikony a obrázky
├── uploads/           # Nahrané soubory uživatelů
│   ├── *.png          # Nahrané obrázky
│   └── invoices/       # Faktury a dokumenty
│       ├── *.png
│       └── *.pdf
└── README.md          # Tento soubor
```

## Jak to funguje

Soubory ve složce `public/` jsou dostupné na kořenové URL aplikace:

- `public/file.svg` → `http://localhost:3000/file.svg`
- `public/uploads/image.png` → `http://localhost:3000/uploads/image.png`

**Důležité:**
- Nepoužívejte absolutní cesty začínající `/public/`
- Používejte relativní cesty od kořene: `/file.svg`, `/uploads/image.png`

## Použití v Komponentách

### Obrázky

```tsx
// ✅ Správně
<img src="/file.svg" alt="File icon" />
<img src="/uploads/image.png" alt="User image" />

// ❌ Špatně
<img src="/public/file.svg" alt="File icon" />
<img src="public/file.svg" alt="File icon" />
```

### Next.js Image Komponenta

Pro optimalizaci obrázků použijte Next.js `Image` komponentu:

```tsx
import Image from 'next/image'

function MyComponent() {
  return (
    <Image
      src="/file.svg"
      alt="File icon"
      width={24}
      height={24}
    />
  )
}
```

### Dynamické cesty

```tsx
function UserAvatar({ userId, avatarPath }: { userId: string, avatarPath?: string }) {
  if (avatarPath) {
    return <img src={`/uploads/${avatarPath}`} alt="Avatar" />
  }
  return <img src="/default-avatar.svg" alt="Default avatar" />
}
```

## Nahrané Soubory (`uploads/`)

Složka `uploads/` obsahuje soubory nahrané uživateli během běhu aplikace.

### Struktura uploads

```
uploads/
├── [timestamp]-[id].png        # Nahrané obrázky
└── invoices/                     # Faktury a dokumenty
    ├── invoice-[id]-[timestamp].png
    └── invoice-[id]-[timestamp].pdf
```

### Bezpečnost

**Důležité bezpečnostní poznámky:**

1. **Validace souborů** - Vždy validujte nahrané soubory na serveru
2. **MIME typy** - Kontrolujte MIME typy souborů
3. **Velikost souborů** - Omezte maximální velikost nahraných souborů
4. **Názvy souborů** - Používejte bezpečné názvy souborů (bez speciálních znaků)
5. **Přístup** - Zvažte ochranu citlivých souborů (faktury, dokumenty)

### Příklad validace uploadu

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  // Validace typu
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Nepovolený typ souboru' },
      { status: 400 }
    )
  }

  // Validace velikosti
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: 'Soubor je příliš velký' },
      { status: 400 }
    )
  }

  // Uložení souboru
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const filename = `${Date.now()}-${file.name}`
  const filepath = path.join(process.cwd(), 'public', 'uploads', filename)

  await writeFile(filepath, buffer)

  return NextResponse.json({ 
    success: true, 
    url: `/uploads/${filename}` 
  })
}
```

## SVG Ikony

Soubory `.svg` ve složce `public/` jsou obvykle ikony používané v aplikaci.

### Použití SVG jako komponenty

Pro lepší kontrolu a styling můžete importovat SVG jako React komponenty:

```tsx
import FileIcon from '/file.svg?react' // Pokud je podporováno

// Nebo použijte jako obrázek
<img src="/file.svg" alt="File" className="w-6 h-6" />
```

### Inline SVG

Pro malé ikony zvažte použití inline SVG v komponentách:

```tsx
function FileIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="..." fill="currentColor" />
    </svg>
  )
}
```

## Best Practices

### 1. Organizace souborů

- **Ikony** - Ukládejte do kořene `public/` nebo `public/icons/`
- **Obrázky** - Ukládejte do `public/images/`
- **Nahrané soubory** - Ukládejte do `public/uploads/`
- **Dokumenty** - Ukládejte do `public/uploads/documents/` nebo podobně

### 2. Názvy souborů

- Používejte kebab-case: `user-avatar.png`
- Přidávejte timestamp pro unikátnost: `user-avatar-1234567890.png`
- Vyhněte se mezerám a speciálním znakům

### 3. Optimalizace

- **Obrázky** - Komprimujte obrázky před nahráním
- **SVG** - Optimalizujte SVG soubory (odstraňte nepotřebné metadata)
- **Next.js Image** - Používejte Next.js Image komponentu pro automatickou optimalizaci

### 4. Gitignore

Zvažte přidání `public/uploads/` do `.gitignore`:

```gitignore
# Nahrané soubory (necommitovat)
public/uploads/
!public/uploads/.gitkeep
```

### 5. Backup

Nahrané soubory by měly být zálohovány samostatně, ne jako součást Git repozitáře.

## Produkční Nasazení

V produkčním prostředí:

1. **CDN** - Zvažte použití CDN pro statické soubory
2. **Storage** - Pro nahrané soubory použijte cloud storage (AWS S3, Cloudflare R2, atd.)
3. **Backup** - Pravidelně zálohujte nahrané soubory
4. **Monitoring** - Monitorujte velikost a počet nahraných souborů

## Související dokumentace

- [Root README](../README.md) - Obecná dokumentace projektu
- [Next.js Static Files](https://nextjs.org/docs/app/building-your-application/optimizing/static-assets) - Next.js dokumentace
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images) - Optimalizace obrázků

