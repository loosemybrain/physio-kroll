/**
 * Font Presets System - Implementation Guide
 * 
 * This system manages font selection for the website with GDPR compliance.
 * All fonts are either locally hosted or imported via next/font/google (build-time, no external API).
 */

# Font Presets System

## Overview

- **Local Fonts**: Inter, Playfair Display (GDPR-safe, no external requests)
- **Google Fonts**: 8 curated fonts via `next/font/google` (build-time, self-hosted)
- **CSP Protection**: `font-src 'self'` blocks external font requests
- **Admin UI**: `/admin/settings/fonts` for preset selection + audit

## Files

```
src/lib/fonts/
  ├─ presets.ts                    # Font preset definitions + Google Font imports
  ├─ storage.server.ts             # Supabase integration (getSansFontPreset, updateSansFontPreset)
  ├─ storage.custom.ts             # Custom font management (getCustomFonts, uploadFontFile, etc.)
  └─ README.md                      # This file

src/lib/supabase/
  └─ migrations-custom-fonts.sql   # Database schema for custom fonts

src/lib/security/
  └─ headers.ts                     # CSP headers configuration

src/styles/
  └─ globals.css                    # Font @font-face + preset CSS classes

src/components/admin/
  ├─ UploadFontComponent.tsx        # Font upload UI with drag-and-drop
  └─ CustomFontsList.tsx             # Manage and delete custom fonts

src/app/admin/api/fonts/
  ├─ update-preset/route.ts        # Update default font preset
  ├─ upload-custom/route.ts        # Upload custom font to Supabase Storage
  ├─ delete-custom/route.ts        # Delete custom font
  ├─ list-custom/route.ts          # List all custom fonts
  └─ audit/route.ts                # Audit for external font requests

src/app/
  ├─ layout.tsx                     # Root layout: applies font preset + Google font vars
  └─ admin/settings/fonts/page.tsx  # Admin UI for font management
```

## Database Schema

```sql
-- Preset storage
CREATE TABLE site_settings (
  id uuid PRIMARY KEY,
  sans_preset text DEFAULT 'inter-local',
  created_at timestamptz,
  updated_at timestamptz
);

-- Custom fonts storage (NEU)
CREATE TABLE custom_fonts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  file_name text NOT NULL,
  file_url text NOT NULL,
  font_weight text DEFAULT '100 900',
  font_style text DEFAULT 'normal',
  source text DEFAULT 'custom',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  active boolean DEFAULT true
);
```

**Run migrations**:
- `src/lib/supabase/migrations-font-presets.sql` (existing presets)
- `src/lib/supabase/migrations-custom-fonts.sql` (custom fonts)

## Usage

### Admin: Select Font Preset

1. Visit `/admin/settings/fonts`
2. Select from dropdown (local or Google fonts)
3. Click "Font speichern"
4. Automatic CSP headers block external requests

### Developer: Add New Font

In `src/lib/fonts/presets.ts`:

```typescript
import { NewFont } from "next/font/google"

export const fontNewFont = NewFont({
  variable: "--font-new-font",
  subsets: ["latin"],
  display: "swap",
})

// Add to GOOGLE_FONTS_VARIABLES_CLASSNAMES
// Add to GOOGLE_PRESETS array with FontPreset object
// Add CSS class to globals.css
```

### Audit for External Requests

```bash
curl http://localhost:3000/admin/api/fonts/audit
```

Returns: List of files with external Google Font references (should be empty).

## Security

- ✅ CSP: `font-src 'self'` (blocks googleapis.com, gstatic.com)
- ✅ No external font API calls (all build-time)
- ✅ GDPR-safe: Local fonts + next/font/google (no tracking)

## Wie man neue Fonts hinzufügt

### Option 1: Lokale Font-Datei hinzufügen

1. **Font-Datei besorgen** (z.B. von Google Fonts)
   - Format: `.woff2` (Variable Font bevorzugt)
   - Beispiel: `MyFont-Variable.woff2`

2. **In `/public/fonts/` ablegen**
   ```
   public/fonts/
     ├─ InterVariable.woff2
     ├─ PlayfairDisplayVariable.woff2
     └─ MyFont-Variable.woff2  ← neu
   ```

3. **CSS @font-face hinzufügen** in `src/styles/globals.css`
   ```css
   @font-face {
     font-family: "My Font";
     src: url("/fonts/MyFont-Variable.woff2") format("woff2");
     font-weight: 100 900;
     font-style: normal;
     font-display: swap;
   }
   ```

4. **CSS Klasse hinzufügen** in `src/styles/globals.css`
   ```css
   .font-my-font {
     --font-sans: "My Font", system-ui, sans-serif;
   }
   ```

5. **Preset hinzufügen** in `src/lib/fonts/presets.ts`
   ```typescript
   const LOCAL_PRESETS: FontPreset[] = [
     // ... existing
     {
       id: "my-font",
       label: "My Font (Local)",
       source: "local",
       description: "Meine neue Schrift",
       applyClass: "font-my-font",
     },
   ]
   ```

6. **Rebuild & Test**
   ```bash
   npm run build
   npm run dev
   ```

### Option 2: Google Font hinzufügen (build-time)

1. **Font importieren** in `src/lib/fonts/presets.ts`
   ```typescript
   import { Lato } from "next/font/google"

   export const fontLato = Lato({
     variable: "--font-lato",
     weight: ["400", "700"],
     subsets: ["latin"],
     display: "swap",
   })
   ```

2. **CSS Variable hinzufügen** in `GOOGLE_FONTS_VARIABLES_CLASSNAMES`
   ```typescript
   export const GOOGLE_FONTS_VARIABLES_CLASSNAMES = [
     // ... existing
     fontLato.variable,  // ← neu
   ]
   ```

3. **CSS Klasse hinzufügen** in `src/styles/globals.css`
   ```css
   .font-lato {
     --font-sans: var(--font-lato), system-ui, sans-serif;
   }
   ```

4. **Preset hinzufügen** in `src/lib/fonts/presets.ts`
   ```typescript
   const GOOGLE_PRESETS: FontPreset[] = [
     // ... existing
     {
       id: "lato",
       label: "Lato (Google)",
       source: "google",
       description: "Friendly sans-serif font",
       applyClass: "font-lato",
     },
   ]
   ```

5. **Rebuild & Test**
   ```bash
   npm run build
   npm run dev
   ```

## Admin UI für Font-Verwaltung

Alle Fonts können in `/admin/settings/fonts` eingesehen und verwaltet werden:

- **Font auswählen**: Dropdown mit allen verfügbaren Presets
- **Vorschau**: Live-Vorschau des ausgewählten Fonts
- **Speichern**: Speichert die Wahl in Supabase
- **Custom Font hochladen** (NEU):
  - Drag-and-drop oder Datei-Browser
  - .woff2 Format (bis 10MB)
  - Metadaten eingeben (Name, Label, Beschreibung)
  - Speichert in Supabase Storage (`fonts` bucket)
  - Registriert in Datenbank
- **Custom Fonts Liste** (NEU):
  - Zeige alle hochgeladenen Fonts
  - Mit Metadaten und Upload-Datum
  - Löschen mit Bestätigung
- **Audit**: Prüft auf externe Font-Requests
- **Font-Liste**: Zeigt alle lokalen und Google Fonts

## Testing Checklist

- [ ] Network tab: No requests to googleapis.com or gstatic.com
- [ ] Font preset changes apply to public site
- [ ] Font preset changes apply to admin preview
- [ ] Response headers include CSP
- [ ] Audit endpoint returns findings (or empty list)
- [ ] No hydration warnings in console
- [ ] Neue Fonts erscheinen in Admin UI Dropdown
- [ ] Font-Speichern funktioniert und Seite nutzt neuen Font
