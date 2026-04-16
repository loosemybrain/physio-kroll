# RBAC Rollenmodell (Light)

## Quelle der Wahrheit

- Produktive Berechtigungen kommen aus `public.user_roles`.
- `public.is_admin(uuid)` bleibt als Kompatibilitätsfunktion und liefert `true` für Rollen `admin` oder `owner`.
- `public.admin_users` ist nur noch Legacy-/Migrationsbestand.

## Rollen

- `user`: Standardrolle für neue Accounts, kein Adminzugang.
- `editor`: vorbereitet für feinere Content-Rechte (noch nicht breit ausgerollt).
- `admin`: aktueller Adminzugang.
- `owner`: aktueller Adminzugang (gleichgestellt mit `admin` für Guards).

## Standardverhalten bei neuer Registrierung

Bei neuen `auth.users`-Einträgen werden automatisch erstellt:

1. `public.user_profiles`-Datensatz
2. `public.user_roles`-Eintrag mit `role_id = 'user'`

## Aktueller Admin-Check in der App

- Server-Guards und Admin-Layout prüfen weiterhin über `public.is_admin(...)`.
- Damit bleibt das Verhalten stabil, während die Datenbasis intern auf Rollen umgestellt ist.

## Admin-Benutzerverwaltung

- Die Admin-Seite `/admin/users` arbeitet serverseitig über geschützte Admin-API-Routen.
- Rollen-/Statusänderungen sind zusätzlich AAL2-geschützt.
- Owner-Regeln und Lockout-Schutz verhindern Selbstentmachtung und das Entfernen der letzten operativen Adminfähigkeit.
- `disabled`-Nutzer gelten fachlich nicht als operativ adminfähig und bekommen keinen Adminzugang.
