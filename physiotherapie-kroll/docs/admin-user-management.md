# Admin-Benutzerverwaltung

## Zugriff

- Seite: `/admin/users`
- API:
  - `GET /api/admin/users`
  - `PUT /api/admin/users/:userId/roles`
  - `PUT /api/admin/users/:userId/status`
- Alle Routen sind serverseitig geschützt (`requireAdminWithServiceRole` + Admin-Guard).
- Schreibende Änderungen (`PUT`) verlangen zusätzlich AAL2.

## Funktionen

- Benutzerliste aus `auth.users` + `public.user_profiles` + `public.user_roles`
- Filter auf Suche, Status, Rolle
- Rollenpflege (`user`, `editor`, `admin`, `owner`)
- Statuspflege (`active`, `invited`, `disabled`)

## Sicherheitsregeln

- Quelle der Wahrheit: `public.user_roles` (Admincheck via `public.is_admin`).
- Operativ adminfähig: Rolle `admin|owner` und Status `!= disabled`.
- `owner`-Rolle darf nur von `owner` verändert werden.
- Normale `admin` können keine `owner`-Eskalation ausführen.
- Selbstentmachtung wird blockiert (eigene letzte Adminfähigkeit).
- Letzte verbleibende operative Adminfähigkeit kann nicht entfernt/deaktiviert werden.
- Rollenänderungen werden atomar über eine serverseitige DB-Funktion angewendet.

## Bewusst nicht enthalten

- Kein Invite-/E-Mail-Flow
- Kein Anlegen neuer Auth-User
- Kein Passwort-Management
- Kein Self-Service-Portal
