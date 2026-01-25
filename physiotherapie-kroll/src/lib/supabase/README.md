# Supabase Setup

## Installation

Supabase ist bereits installiert. Stelle sicher, dass die Umgebungsvariablen gesetzt sind:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Nur für Server-Side
```

## Datenbank-Setup

1. Öffne dein Supabase Dashboard
2. Gehe zu SQL Editor
3. Führe die SQL-Migration aus: `migrations.sql`
4. Die Tabellen `pages` und `page_blocks` werden erstellt

## Verwendung

### Beispiel: Seite laden

```typescript
import { getPageBySlugAndBrand } from "@/lib/supabase/queries"
import { CMSRenderer } from "@/components/cms/BlockRenderer"

// In einer Server Component oder API Route
const page = await getPageBySlugAndBrand("home", "physiotherapy")

if (page) {
  return <CMSRenderer blocks={page.blocks} />
}
```

### Beispiel: Alle Seiten eines Brands laden

```typescript
import { getPagesByBrand } from "@/lib/supabase/queries"

const pages = await getPagesByBrand("physiotherapy")
```

## Tabellen-Struktur

### `pages`
- `id` (UUID) - Primärschlüssel
- `title` (TEXT) - Seitentitel
- `slug` (TEXT) - URL-Slug (eindeutig pro Brand)
- `brand` (brand_key) - Brand-Zuordnung
- `meta_description` (TEXT) - Meta-Beschreibung
- `meta_keywords` (TEXT[]) - Meta-Keywords
- `published` (BOOLEAN) - Veröffentlichungsstatus
- `created_at` (TIMESTAMPTZ) - Erstellungsdatum
- `updated_at` (TIMESTAMPTZ) - Aktualisierungsdatum

### `page_blocks`
- `id` (UUID) - Primärschlüssel
- `page_id` (UUID) - Foreign Key zu pages
- `block_type` (block_type) - Typ des Blocks
- `block_props` (JSONB) - Block-Eigenschaften
- `sort_order` (INTEGER) - Sortierreihenfolge
- `created_at` (TIMESTAMPTZ) - Erstellungsdatum
- `updated_at` (TIMESTAMPTZ) - Aktualisierungsdatum

## TypeScript-Typen

Die Typen werden automatisch aus der Datenbank-Struktur generiert. Siehe:
- `src/types/database.ts` - Datenbank-Typen
- `src/types/supabase.ts` - Supabase-Schema-Definition
