# Supabase Auth Konfiguration

Dieses Projekt nutzt folgende Strategie:

- Login: E-Mail + Passwort
- E-Mail-Verifikation: Link-basierte Bestätigung
- Passwort-Reset: Link-basierter Recovery-Flow
- MFA für Admin: verpflichtend TOTP
- Kein SMS/WhatsApp/E-Mail-Code als 2. Faktor

## Relevante ENV-Variablen

- `NEXT_PUBLIC_SITE_URL` - kanonische App-URL (Dev: `http://localhost:3000`, Prod: echte Domain)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (nur serverseitig)
- Admin-Berechtigung für API/Server: siehe Rollenmodell mit `public.roles` + `public.user_roles`; Admin-Check weiterhin über RPC `public.is_admin` (kein `ADMIN_EMAILS`, kein `app_metadata.role` als Quelle)

## Supabase Dashboard (Auth)

1. **URL Configuration**
   - Site URL:
     - Dev Projekt: `http://localhost:3000`
     - Prod Projekt: `https://<deine-domain>`
   - Redirect URLs:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/auth/reset`
     - `https://<deine-domain>/auth/callback`
     - `https://<deine-domain>/auth/reset`

2. **Email Provider / Email Auth**
   - Email Provider aktiv
   - Confirm email aktiv (Link-basierte Verifikation)
   - Kein OTP-/Code-Wording für MFA nutzen

3. **MFA**
   - TOTP aktiv
   - Phone/SMS MFA deaktiviert (wenn nicht gewünscht)

## Mail-Templates (Empfehlung)

- **Confirm signup**: klar als Konto-Bestätigung per Link formulieren
- **Recovery**: klar als Passwort-Reset-Link formulieren
- **Invite** (falls genutzt): klar als Einladung mit Link formulieren

Wichtig: Keine Formulierungen wie "MFA-Code per E-Mail", da MFA hier ausschließlich TOTP ist.

