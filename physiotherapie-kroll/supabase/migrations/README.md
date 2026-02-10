/**
 * Supabase Migrations - Font Presets System
 * 
 * Location: supabase/migrations/
 * 
 * This directory contains Supabase migrations for the Font Presets system.
 */

# Supabase Migrations

## 20260210_1200_site_settings.sql

### Purpose
Creates the singleton `site_settings` table for storing site-wide configuration (font presets, etc.)

### Key Features

**Singleton Pattern**:
- Only one row allowed (id='singleton')
- Automatically inserted on migration
- Simple singleton constraint via PRIMARY KEY

**Columns**:
- `id text PRIMARY KEY` = 'singleton' (enforces uniqueness)
- `sans_preset text` = font preset ID (default: 'inter-local')
- `created_at timestamptz` = creation timestamp
- `updated_at timestamptz` = updated timestamp (auto-managed via trigger)

**Triggers**:
- `site_settings_set_updated_at` – automatically updates `updated_at` on every UPDATE

**RLS Policies**:
1. **SELECT**: Allowed for all (anon, authenticated)
   - Enables public to read current font preset (for SSR)
2. **INSERT/UPDATE/DELETE**: Only service_role
   - Admin API uses service_role key to modify settings

**Generic Function**:
- `set_updated_at()` – reusable trigger function for any table with `updated_at` column

### How to Run

#### Option 1: Supabase CLI
```bash
supabase migration up
# or manually:
supabase db push
```

#### Option 2: Manual (Supabase Dashboard)
1. Go to SQL Editor
2. Create new query
3. Copy & paste contents from this file
4. Execute

#### Option 3: Via Supabase API/service_role
```typescript
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, serviceRoleKey)

// Migration is idempotent, safe to re-run
const { error } = await supabase.rpc('execute_migration', {
  migration_sql: readFileSync('20260210_1200_site_settings.sql', 'utf-8')
})
```

### Verification

```sql
-- Check table created
SELECT * FROM public.site_settings;
-- Expected: 1 row with id='singleton', sans_preset='inter-local'

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname='public' AND tablename='site_settings';
-- Expected: rowsecurity=true

-- Check policies
SELECT * FROM pg_policies 
WHERE tablename='site_settings';
-- Expected: 2 policies (SELECT + ALL)
```

### Related Files

- `src/lib/fonts/storage.server.ts` – Uses this table
- `src/lib/fonts/storage.client.ts` – Client-side helper
- `src/app/admin/api/fonts/update-preset/route.ts` – Updates via API
- `src/lib/fonts/presets.ts` – Preset definitions
- `src/app/layout.tsx` – Reads preset on SSR
