/**
 * Supabase Setup Guide - Font Presets System
 * 
 * Complete instructions for setting up the site_settings table
 */

# Supabase Setup: Font Presets

## Migration Created ✅

**File**: `supabase/migrations/20260210_1200_site_settings.sql`

### What it does:

```sql
-- Creates singleton table
CREATE TABLE site_settings (
  id text PRIMARY KEY = 'singleton',
  sans_preset text = 'inter-local',
  created_at timestamptz,
  updated_at timestamptz
);

-- Inserts default row
INSERT INTO site_settings (id, sans_preset)
VALUES ('singleton', 'inter-local');

-- Adds auto-update trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ...

-- Enables RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Policies:
-- SELECT: allowed for all (anon, authenticated)
-- INSERT/UPDATE/DELETE: only service_role
```

## How to Deploy

### Option 1: Supabase CLI (Recommended)

```bash
# Assuming supabase.json configured in project root
supabase migration up
```

### Option 2: Supabase Dashboard

1. Go to **SQL Editor** (Dashboard > SQL Editor)
2. Create new query
3. Copy entire contents from: `supabase/migrations/20260210_1200_site_settings.sql`
4. Run

### Option 3: Manual via Supabase JS Client

```typescript
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const client = createClient(url, serviceRoleKey)
const migration = readFileSync('supabase/migrations/20260210_1200_site_settings.sql', 'utf-8')

// Split by ';' and execute each statement
const statements = migration.split(';').filter(s => s.trim().length > 0)
for (const stmt of statements) {
  await client.rpc('exec', { statement: stmt })
}
```

## Verify Migration

```sql
-- Check table exists
SELECT * FROM public.site_settings;
-- Expected: 1 row (id='singleton', sans_preset='inter-local')

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname='public' AND tablename='site_settings';
-- Expected: true

-- Check policies
SELECT policyname, permissive, roles FROM pg_policies 
WHERE tablename='site_settings';
-- Expected: 2 policies
```

## Integration Points

### Server-Side Font Loading (SSR)

**File**: `src/app/layout.tsx`
```typescript
import { getSansFontPreset } from "@/lib/fonts/storage.server"

// In RootLayout:
const fontPreset = await getSansFontPreset()
// Returns: "inter-local" or selected preset from DB
```

### Admin API: Update Font

**File**: `src/app/admin/api/fonts/update-preset/route.ts`
```typescript
import { updateSansFontPreset } from "@/lib/fonts/storage.server"

// In POST handler:
await updateSansFontPreset(presetId)
// Updates site_settings.sans_preset WHERE id='singleton'
```

### Admin UI: Font Selection

**File**: `src/app/admin/settings/fonts/page.tsx`
- Dropdown lists all presets
- Save button → POST to `/admin/api/fonts/update-preset`
- Changes persist in DB

## RLS Policies Explained

### Policy 1: SELECT (Public Read)
```sql
CREATE POLICY "Allow anon/authenticated read site_settings"
ON site_settings FOR SELECT
USING (true);
```
- ✅ Anyone can READ font preset (needed for SSR + client-side)
- Used for: Initial page load, theme detection

### Policy 2: ALL (Admin Write)
```sql
CREATE POLICY "Allow service_role write site_settings"
ON site_settings FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
```
- ✅ Only service_role (admin API) can write
- Used for: Admin changes to font preset
- Blocks unauthorized modifications

## Troubleshooting

### "relation 'site_settings' does not exist"
→ Migration not run yet. Execute `supabase/migrations/20260210_1200_site_settings.sql`

### "permission denied for schema public"
→ Check Supabase RLS policies. Both SELECT and service_role policies should exist.

### "duplicate key value violates unique constraint"
→ Singleton row already exists. Migration is idempotent (uses `ON CONFLICT DO NOTHING`).

### Font preset not changing
→ Check: (1) Migration run? (2) API endpoint returns 200? (3) Correct preset ID? (4) RLS blocking?

## Security Checklist

- ✅ RLS enabled: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- ✅ SELECT policy allows public read (needed for SSR)
- ✅ WRITE policies restrict to service_role only
- ✅ Singleton constraint (id='singleton') prevents data corruption
- ✅ updated_at trigger automatic
- ✅ CSP headers: `font-src 'self'` (in next.config.ts)

## Next Steps

1. Run migration (choose deployment option above)
2. Verify table exists + policies work
3. Test in admin UI: `/admin/settings/fonts`
4. Monitor Network tab: No external font requests ✅
