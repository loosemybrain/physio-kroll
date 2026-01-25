# V0 Components

Dieses Verzeichnis enthält Komponenten, die aus dem V0 Admin Panel generiert wurden.

## Struktur

```
v0/
  ├── README.md           # Diese Datei
  ├── [component-1].tsx  # V0-generierte Komponenten
  └── [component-2].tsx
```

## Integration in CMS

Um eine V0-Komponente als CMS-Block zu verwenden:

1. **Komponente hier ablegen** (z.B. `v0/MyComponent.tsx`)

2. **Block-Wrapper erstellen** in `components/blocks/`:
```typescript
// components/blocks/v0-my-component-block.tsx
import { MyComponent } from "@/components/v0/MyComponent"

export function V0MyComponentBlock(props) {
  return <MyComponent {...props} />
}
```

3. **Block-Typ hinzufügen** in `types/cms.ts`:
```typescript
export type BlockType = "hero" | "text" | ... | "v0MyComponent"
```

4. **In BlockRenderer registrieren**:
```typescript
case "v0MyComponent": {
  return <V0MyComponentBlock {...block.props} />
}
```

## Best Practices

- ✅ Nutze TypeScript für alle Komponenten
- ✅ Passe Imports an Projekt-Aliase an (`@/components`)
- ✅ Füge "use client" hinzu, wenn Hooks verwendet werden
- ✅ Teste Komponenten isoliert vor der CMS-Integration
- ✅ Nutze vorhandene UI-Komponenten aus `components/ui/`

## Automatische Integration

Nutze das Helper-Script:
```bash
node scripts/integrate-v0.js ComponentName ./path/to/v0-code.tsx
```
