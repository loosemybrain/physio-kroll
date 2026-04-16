# Admin-Autorisierung: DB Source of Truth

## Aktueller Zustand

Die produktive Berechtigungsquelle ist:

- `public.user_roles` (Rollen-Zuordnungen je User)
- `public.roles` (Rollenkatalog)
- `public.is_admin(uuid)` als Kompatibilitätsfunktion, abgeleitet aus `user_roles` (`admin` oder `owner`)

`public.admin_users` bleibt vorerst als Legacy-Bestand erhalten, ist aber **nicht** mehr die fachliche Quelle für Admin-Checks.

## Rollenmodell (RBAC-Light)

- Rollen: `user`, `editor`, `admin`, `owner`
- Neue Auth-User erhalten automatisch:
  - `public.user_profiles`-Eintrag
  - Rolle `user` in `public.user_roles`
- Bestehende Einträge in `public.admin_users` werden in `public.user_roles` auf `admin` migriert (idempotent).

## Guard-/Server-Flow (kompatibel)

- `requireAdminGuard()` prüft weiter via RPC `is_admin`.
- `isUserAdminInDatabase()` prüft weiter via RPC `is_admin`.
- MFA-Flow bleibt unverändert und greift weiter nur für echte Admins.
- Service-Role-Zugriffe bleiben hinter bestandenem Admin-Guard (`src/lib/api/adminServiceRoute.ts`).
- Admin-Benutzerverwaltung (`/admin/users`) nutzt ausschließlich serverseitig geschützte Admin-API-Routen.

## Sicherheit

- Keine produktive Rollenlogik aus `app_metadata.role`
- Keine ENV-E-Mail-Bypass-Logik
- Keine zweite dauerhafte Wahrheit neben `public.user_roles`
- `disabled` in `user_profiles` sperrt fachlich den Adminzugang (403-Pfad).

## Kurze Verifikation

1. Neuer User: hat `user_profiles` + Rolle `user`, kein Adminzugriff.
2. Legacy-Admin (`admin_users`): nach Migration Rolle `admin` in `user_roles`, `is_admin(uuid)=true`.
3. User mit nur `user`: Admin-Guard liefert 403.
4. Admin ohne AAL2: landet weiterhin im bestehenden MFA-Flow.
