# V0 Integration Guide

Dieses Dokument erklärt, wie du dein V0-Projekt aus dem V0 Admin Panel in dieses Next.js-Projekt integrierst.

## Option 1: V0 CLI (Empfohlen)

### Schritt 1: V0 CLI installieren

```bash
npm install -g v0-cli
# oder
npx v0-cli
```

### Schritt 2: Projekt verbinden

```bash
# Im Projekt-Root ausführen
v0 sync
```

Folge den Anweisungen, um dein V0-Projekt zu verbinden.

### Schritt 3: Code synchronisieren

```bash
# Code aus V0 in das lokale Projekt pullen
v0 pull

# Oder Code zum V0-Projekt pushen
v0 push
```

## Option 2: Manuelle Integration

### Schritt 1: Code aus V0 kopieren

1. Öffne dein V0-Projekt im [V0 Admin Panel](https://v0.dev/admin)
2. Navigiere zu deinem Projekt
3. Kopiere den generierten Code

### Schritt 2: Komponenten integrieren

V0 generiert normalerweise:
- Komponenten in `components/`
- Seiten in `app/`
- Styles (bereits vorhanden via Tailwind)

**Empfohlene Struktur:**
```
src/
  components/
    v0/              # V0-generierte Komponenten
      [component-name].tsx
    blocks/          # Deine CMS-Blocks (bereits vorhanden)
    ui/              # Shared UI Components (bereits vorhanden)
```

### Schritt 3: V0-Komponenten in CMS-Blocks integrieren

Du kannst V0-Komponenten als neue Block-Typen hinzufügen:

1. **Neuen Block-Typ in `types/cms.ts` hinzufügen:**
```typescript
export type BlockType = "hero" | "text" | "imageText" | "featureGrid" | "cta" | "v0Component"
```

2. **V0-Komponente in `components/blocks/` erstellen:**
```typescript
import { YourV0Component } from "@/components/v0/your-component"

export function V0ComponentBlock({ props }) {
  return <YourV0Component {...props} />
}
```

3. **In `BlockRenderer.tsx` registrieren:**
```typescript
case "v0Component": {
  return <V0ComponentBlock {...block.props} />
}
```

## Option 3: V0 API Integration (Advanced)

Falls V0 eine API anbietet, kannst du Komponenten dynamisch laden:

```typescript
// lib/v0/client.ts
export async function fetchV0Component(componentId: string) {
  // V0 API Call
}
```

## Best Practices

### 1. Komponenten-Organisation

- **V0-Komponenten**: `src/components/v0/`
- **Eigene Komponenten**: `src/components/blocks/`
- **Shared UI**: `src/components/ui/` (bereits vorhanden)

### 2. Styling-Konsistenz

V0 verwendet Tailwind CSS (bereits konfiguriert). Stelle sicher, dass:
- Die gleichen Tailwind-Konfigurationen verwendet werden
- Die Theme-Variablen (`--foreground`, `--background`, etc.) kompatibel sind

### 3. TypeScript-Typen

- V0-Komponenten sollten vollständig typisiert sein
- Nutze die vorhandenen Typen aus `types/cms.ts` für CMS-Integration

### 4. Brand-Integration

Wenn V0-Komponenten Brand-spezifisch sein sollen:
- Nutze `BrandShell` Context (bereits vorhanden)
- Passe Komponenten an, um `BrandKey` zu unterstützen

## Beispiel: V0-Komponente als CMS-Block

```typescript
// components/blocks/v0-custom-block.tsx
"use client"

import { YourV0Component } from "@/components/v0/your-component"
import type { BrandKey } from "@/components/brand/brandAssets"

interface V0CustomBlockProps {
  title: string
  content: string
  brand?: BrandKey
}

export function V0CustomBlock({ title, content, brand }: V0CustomBlockProps) {
  return (
    <YourV0Component 
      title={title}
      content={content}
      variant={brand}
    />
  )
}
```

## Troubleshooting

### Problem: Styling-Konflikte
**Lösung**: Prüfe, ob V0-Komponenten die gleichen Tailwind-Konfigurationen verwenden.

### Problem: TypeScript-Fehler
**Lösung**: Stelle sicher, dass alle V0-Komponenten korrekt typisiert sind.

### Problem: Brand-Kontext nicht verfügbar
**Lösung**: Nutze `BrandShell` oder den `useBrand` Hook (falls vorhanden).

## Nächste Schritte

1. **V0-Projekt verbinden**: Nutze V0 CLI oder kopiere Code manuell
2. **Komponenten organisieren**: Lege V0-Komponenten in `components/v0/` ab
3. **CMS-Integration**: Füge V0-Komponenten als neue Block-Typen hinzu
4. **Testen**: Teste die Integration lokal mit `npm run dev`

## Ressourcen

- [V0 Documentation](https://v0.dev/docs)
- [V0 Admin Panel](https://v0.dev/admin)
- [Next.js Documentation](https://nextjs.org/docs)
