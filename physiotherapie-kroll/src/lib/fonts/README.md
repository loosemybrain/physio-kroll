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
  ├─ presets.ts          # Font preset definitions + Google Font imports
  ├─ storage.ts          # Supabase integration (getSansFontPreset, updateSansFontPreset)
  └─ (audit route)       # /admin/api/fonts/audit

src/lib/security/
  └─ headers.ts          # CSP headers configuration

src/styles/
  └─ globals.css         # Font @font-face + preset CSS classes

src/app/
  ├─ layout.tsx          # Root layout: applies font preset + Google font vars
  └─ admin/settings/fonts/page.tsx    # Admin UI for font selection
```

## Database Schema

```sql
CREATE TABLE site_settings (
  id uuid PRIMARY KEY,
  sans_preset text DEFAULT 'inter-local',
  created_at timestamptz,
  updated_at timestamptz
);
```

**Run migration**: `src/lib/supabase/migrations-font-presets.sql`

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

## Testing Checklist

- [ ] Network tab: No requests to googleapis.com or gstatic.com
- [ ] Font preset changes apply to public site
- [ ] Font preset changes apply to admin preview
- [ ] Response headers include CSP
- [ ] Audit endpoint returns findings (or empty list)
- [ ] No hydration warnings in console
