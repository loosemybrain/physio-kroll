# Admin-Autorisierung: DB als Source of Truth

## Ist-Zustand (vor Phase 3.2 Cleanup, zur Nachverfolgung)

Admin wurde u. a. geprüft über:

| Mechanismus | Ort |
|-------------|-----|
| `requireAdminGuard()` | `src/lib/auth/adminGuard.ts` |
| `isAdminUser()` (sync) | `src/lib/auth/adminAccess.ts` — `app_metadata.role === "admin"` und `ADMIN_EMAILS` |
| `getAdminMfaState()` | `src/lib/auth/adminAccess.ts` — nutzte `isAdminUser` |
| `ADMIN_EMAILS` / `process.env` | `adminAccess.ts`, `.env.example` |
| API-Routen | Alle `requireAdminGuard`-Aufrufe unter `src/app/api/admin/**`, `src/app/admin/api/**` |

## Ziel-Zustand

- **Eine** Quelle: `public.admin_users` + `public.is_admin(uuid)`.
- `requireAdminGuard()` ruft nach `getUser()` die RPC `is_admin` mit der User-UUID auf (Session-/Anon-Client mit Cookies).
- Privilegierte Tabellen-Operationen in den Block-Template-Routen: `getSupabaseAdmin()` nach bestandenem Guard (`src/lib/api/adminServiceRoute.ts`).
- `global_block_templates`: RLS nur mit `public.is_admin(auth.uid())` (Migration `20260402120100_...`).

## Bootstrap: ersten Admin anlegen

Nach Migration, z. B. im Supabase SQL Editor (mit ausreichenden Rechten):

```sql
insert into public.admin_users (user_id)
values ('<auth.users.id des Admins>'::uuid)
on conflict (user_id) do nothing;
```

## Manuelle Tests (Kurz-Checkliste)

1. Migrationen anwenden (`admin_users`, `is_admin`, `global_block_templates`-RLS).
2. Admin-Zeile einfügen, als dieser User einloggen → `GET /api/admin/block-templates` → 200.
3. Nicht-Admin einloggen → dieselbe Route → 403.
4. Ohne Session → 401.
5. `POST` Template als Admin → 201; als Nicht-Admin → 403.
6. `PATCH` / `DELETE` mit unbekannter UUID → 404.
