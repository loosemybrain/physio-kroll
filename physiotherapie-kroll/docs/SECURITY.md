# Security / Secrets

## Grundregeln

- **Keine `.env` Dateien committen oder zippen.** Dazu zählen insbesondere `.env`, `.env.*`, `.env.local`, `.env.production`, `.env.development`.
- **Beispiel-Dateien enthalten keine echten Werte.** Nutze `.env.example` nur als Namens-Template.
- **Service-Role Keys nie im Browser verwenden.** Keys wie `SUPABASE_SERVICE_ROLE_KEY` dürfen ausschließlich serverseitig genutzt werden.

## Übergabe / Austausch (ZIP, Export, Backup)

- Erstelle Exporte nur aus einem Workspace, in dem `.env*` Dateien ausgeschlossen sind.
- Prüfe vor dem Teilen eines ZIPs, dass keine Dateien aus dem Muster `.env*` enthalten sind.

## Bei möglichem Leak

- **Keys sofort rotieren** (Supabase Service Role, Resend, SMTP, Tokens).
- Betroffene Deployments/CI-Variablen aktualisieren und neu deployen.

## Lokale Entwicklung

- Lokale Konfiguration über `.env.local` (nicht versionieren).
- Für neue Setups: `.env.example` kopieren und Werte lokal eintragen.

