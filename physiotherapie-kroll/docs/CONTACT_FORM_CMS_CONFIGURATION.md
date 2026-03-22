# Contact Form CMS Configuration Guide

## Overview

Die Kontaktformular-Implementierung unterstützt nun **flexible Empfänger-Konfiguration** auf zwei Ebenen:

1. **CMS/Inspector** - Pro ContactFormBlock konfigurierbar
2. **Environment Variables** - Brand-spezifische Fallbacks

Dies ermöglicht sowohl zentrale als auch granulare Kontrolle über die Email-Zustellung.

## Email Resolution Priority

Die finale Empfänger-Email wird in dieser Reihenfolge aufgelöst:

### 1️⃣ Testmodus (höchste Priorität)
```
if CONTACT_TEST_MODE=true
  → send to CONTACT_TEST_EMAIL
  → mark subject with [TEST]
  → log original recipient
```

### 2️⃣ CMS Block Configuration
```
if ContactFormBlock.recipientEmail is set and valid
  → send to recipientEmail
  → source = "cmsBlock"
```

### 3️⃣ Environment Variable (Brand-spezifisch)
```
if CONTACT_EMAIL_{BRAND} is set and valid
  → send to CONTACT_EMAIL_PHYSIOTHERAPY or CONTACT_EMAIL_PHYSIOKONZEPT
  → source = "envBrand"
```

### 4️⃣ Global Fallback
```
if CONTACT_FALLBACK_EMAIL is set and valid
  → send to CONTACT_FALLBACK_EMAIL
  → source = "envFallback"
```

### ❌ No Email Found
→ Return error, don't send silently

## CMS/Inspector Configuration

### Where to Configure

**Admin Panel:**
1. Öffne eine Seite im Editor
2. Wähle einen **ContactFormBlock** (Kontaktformular)
3. Im rechten Panel → **Inspector** öffnen
4. Scrolle zu **"Kontakt / Zustellung"**

### The `recipientEmail` Field

| Property | Value |
|----------|-------|
| Label | Empfangs-E-Mail |
| Type | Email Input |
| Validation | RFC 5322 compliant |
| Required | No (falls back to ENV) |
| Default | Empty (uses ENV fallback) |
| Placeholder | contact@example.com |

### Example Configurations

**Scenario A: Zentrale Brand-E-Mail (keine CMS-Override)**

```
Feld leer lassen → verwendet CONTACT_EMAIL_PHYSIOTHERAPY / CONTACT_EMAIL_PHYSIOKONZEPT
```

**Scenario B: Spezifische Abteilungs-E-Mail**

```
recipientEmail = "sales@physiotherapy.example.com"
→ Dieses Formular sendet immer an sales@, nicht an die Brand-Standard-E-Mail
```

**Scenario C: Mehrere Formulare pro Brand mit verschiedenen Zielen**

```
Formular 1 (Website Contact):
  recipientEmail = "contact@example.com"

Formular 2 (Partner Inquiry):
  recipientEmail = "partners@example.com"

Formular 3 (Newsletter Signup):
  recipientEmail = "newsletter@example.com"
```

## Environment Variables

### Required for Production

```bash
# Brand-spezifische Standard-Empfänger
CONTACT_EMAIL_PHYSIOTHERAPY=contact@physiotherapy.example.com
CONTACT_EMAIL_PHYSIOKONZEPT=contact@physio-konzept.example.com

# Absender-Adresse
CONTACT_FROM_EMAIL=noreply@example.com

# Mail Provider
RESEND_API_KEY=re_xxx...

# Erlaubte Domains (CSRF)
CONTACT_ALLOWED_ORIGINS=example.com,www.example.com
```

### Optional for Testing

```bash
# Testmodus aktivieren
CONTACT_TEST_MODE=true

# Wohin sollen Testsubmissions gehen
CONTACT_TEST_EMAIL=your-email@gmail.com
```

### Optional Advanced

```bash
# Globaler Fallback (wenn nichts sonst greift)
CONTACT_FALLBACK_EMAIL=fallback@example.com
```

## Test Mode: Controlled Testing

### What is Test Mode?

Mit Testmodus können Sie das Formular in der Produktion testen, **ohne echte Empfänger-Adressen zu treffen**.

Alle Submissions gehen an `CONTACT_TEST_EMAIL`, während der ursprüngliche Zielempfänger geloggt wird.

### Enable Test Mode

```bash
# .env.local (local dev)
CONTACT_TEST_MODE=true
CONTACT_TEST_EMAIL=your-test-email@gmail.com

# Vercel / Production (via Environment Settings)
CONTACT_TEST_MODE=true
CONTACT_TEST_EMAIL=your-test-email@gmail.com
```

### What Happens in Test Mode

✅ **Email Subject** wird mit `[TEST]` gekennzeichnet

```
[TEST] [Kontaktformular] Meine Anfrage
```

✅ **Email Body** enthält Info über Original-Ziel

```
---
[!] TESTMODUS - KONTROLLIERTER VERSAND
[!] Ursprünglicher Empfänger: contact@example.com
---
```

✅ **Logs** zeigen Original-Empfänger

```json
{
  "message": "Submission successful",
  "testMode": true,
  "emailSource": "envBrand",
  "originalRecipient": "contact@example.com"
}
```

✅ **Supabase** speichert Submission trotzdem

→ Datenbank zeigt auch in Test-Phase alle eingereichten Formulare

### Disable Test Mode for Production

```bash
# Vercel Environment Settings
CONTACT_TEST_MODE=false
```

⚠️ **WICHTIG:** Stellen Sie sicher, dass `CONTACT_TEST_MODE=false` in Production ist!

## Validation & Error Handling

### Email Validation (Server-side)

Alle E-Mail-Adressen (CMS, ENV, Fallback) werden serverseitig validiert:

✅ **Akzeptiert:**
- valid@example.com
- contact.person@sub.domain.co.uk

❌ **Abgelehnt:**
- invalid
- test@
- user@domain..com
- user@domain.c

❌ **Abgelehnt (Security):**
- user@example.com\r\nBcc: attacker@evil.com
- Jede Zeile mit CRLF (Header Injection Prevention)

### What if Email is Invalid?

```json
{
  "error": "Nachricht konnte nicht versendet werden. Bitte kontaktieren Sie direkt.",
  "status": 500
}
```

**Logging:**
```json
{
  "level": "error",
  "message": "Failed to resolve recipient email",
  "reason": "CMS recipient email is invalid: not-an-email"
}
```

## Configuration Examples

### Example 1: Simple Single Form

**Situation:** Eine Marke, ein Kontaktformular, zentrale E-Mail

**Setup:**

```bash
# .env.local
CONTACT_EMAIL_PHYSIOTHERAPY=contact@physio.de
CONTACT_EMAIL_PHYSIOKONZEPT=contact@konzept.de
```

**CMS:**
- ContactFormBlock.recipientEmail → **leer lassen**
- → Verwendet automatisch ENV per Brand

### Example 2: Department-Specific Forms

**Situation:** Mehrere Formulare pro Brand mit verschiedenen Zielen

**Setup:**

```bash
# .env.local
CONTACT_EMAIL_PHYSIOTHERAPY=contact@physio.de
CONTACT_EMAIL_PHYSIOKONZEPT=contact@konzept.de
```

**CMS - Kontaktformular #1:**
```
recipientEmail = "" (leer)
→ verwendet CONTACT_EMAIL_PHYSIOTHERAPY
```

**CMS - Vertriebsformular #2:**
```
recipientEmail = "sales@physio.de"
→ überschreibt ENV, sendet zu sales@
```

**CMS - Support-Formular #3:**
```
recipientEmail = "support@physio.de"
→ überschreibt ENV, sendet zu support@
```

### Example 3: Staging/Production Unterschied

**Development (.env.local):**

```bash
CONTACT_TEST_MODE=true
CONTACT_TEST_EMAIL=dev@example.com
CONTACT_EMAIL_PHYSIOTHERAPY=would-not-receive
```

→ Alle Testsubmissions gehen zu dev@example.com

**Production (Vercel Environment):**

```bash
CONTACT_TEST_MODE=false
CONTACT_EMAIL_PHYSIOTHERAPY=contact@physio.de
CONTACT_EMAIL_PHYSIOKONZEPT=contact@konzept.de
```

→ Echter Versand zu Brand-E-Mails

## Troubleshooting

### Problem: Form sendet nicht

**Debug-Schritte:**

1. **Check Logs** (Vercel, Server-Console)
   ```
   [API /contact] Failed to resolve recipient email
   ```

2. **Check Konfiguration:**
   - Ist mindestens eine E-Mail gesetzt? (CMS oder ENV)
   - Ist die E-Mail gültig? (RFC 5322)
   - Ist `CONTACT_FROM_EMAIL` gesetzt?
   - Ist `RESEND_API_KEY` gültig?

3. **Check Testmodus:**
   - `CONTACT_TEST_MODE=true` aber `CONTACT_TEST_EMAIL` nicht gesetzt?
   - → Setzt CONTACT_TEST_EMAIL wenn TEST_MODE=true

### Problem: Mails gehen in Spam

**Ursachen:**

1. Domain nicht in Resend verifiziert
   → Resend Dashboard → Domains → Verify

2. DKIM/SPF nicht konfiguriert
   → Folge Resend Setup-Anleitung

3. CONTACT_FROM_EMAIL nicht korrekt
   → Muss mit Resend-verifizierter Domain sein

### Problem: CMS-Email wird ignoriert

**Debug:**

1. Logs prüfen: Welche `source` ist gezeigt?
   ```json
   "emailSource": "cmsBlock" → gut
   "emailSource": "envBrand" → CMS-Wert wird ignoriert
   ```

2. Ist die CMS-E-Mail gültig?
   - Test lokal: `isValidEmail("your-email@example.com")`

3. Wurde BlockProps gespeichert?
   - Supabase → pages/blocks prüfen → recipientEmail Feld prüfen

4. Server neu gestartet nach CMS-Änderung?
   - Dev: `npm run dev` (auto-reload)
   - Vercel: Re-deploy nötig? (cache)

### Problem: Test-E-Mail wird nicht empfangen

1. **CONTACT_TEST_MODE wirklich true?**
   ```bash
   echo $CONTACT_TEST_MODE  # Sollte "true" zeigen
   ```

2. **CONTACT_TEST_EMAIL valide?**
   - Tippen Sie genau richtig?
   - Ist es keine Gmail-Test-Adresse?

3. **Resend API OK?**
   - Logs sollten zeigen: "Email send failed: ..."
   - Check Resend Dashboard für bounces/rejects

4. **Subject enthält [TEST]?**
   - Wenn nicht, dann CONTACT_TEST_MODE=false!

## Security Considerations

### Secrets sind serverseitig

✅ **Sicher:**
- `RESEND_API_KEY` nur in Server-Umgebungsvariablen
- E-Mail-Adressen nur in .env, nicht im Browser

❌ **Unsicher:**
- CMS-E-Mail-Wert im Frontend JavaScript exfiltrieren
- Secrets in .env.local ins Repo committen

### CMS-Werte sind Konfiguration, nicht Eingabe

✅ **Admin ediert CMS-Feld:**
- Wird serverseitig validiert
- Header-Injection Schutz aktiv
- Ist trotzdem eine Quelle, nicht User-Input

❌ **Frontends Form-Feld für E-Mail:**
- Wird nicht zur Empfängeradresse
- Wird nur im Mail-Body als Absender verwendet

## FAQ

**F: Kann ein Besucher die Zieladresse sehen?**

A: Nein. Die Zieladresse ist nur:
- Im CMS (Admin-Panel, geschützt)
- In Server-Logs (serverseitig)
- Niemals im Frontend HTML/JS

**F: Warum braucht man CMS-Feld, wenn ENV reicht?**

A: Flexibilität:
- Mehrere Formulare pro Brand mit verschiedenen Zielen
- Keine Deployment/Restart nötig für E-Mail-Änderung
- Admin kann selbst ohne Dev-Zugriff ändern

**F: Kann man Test-Mode "vergessen" und es bleibt in Production?**

A: Ja, aber:
- Mails gehen zu TEST_EMAIL statt real
- Logs zeigen `testMode: true`
- Mail-Subject hat `[TEST]` Präfix
- Sollte schnell auffallen

**Empfehlung:** CI/CD-Check für `CONTACT_TEST_MODE=false` in Production

**F: Was wenn CMS-E-Mail ungültig ist?**

A: Fallback auf ENV:
- CMS-Validierung zeigt Fehler im Inspector
- Server lehnt ungültige CMS-E-Mail ab
- Falls ENV gültig → nutzt ENV
- Falls nicht → Error zurück

**F: Mehrere E-Mails (CC/BCC)?**

A: Aktuell nicht unterstützt (Design: ein Ziel).
- Aber leicht erweiterbar in contact-email-resolver.ts
- Würde mehre Validierung und Mail-Loop brauchen
- Sicher anfordbar für Zukunft

## Integration Points

### For Developers

```typescript
// Auflösen der Zieladresse in eigenen Funktionen:
import { resolveRecipientEmail } from '@/lib/contact/contact-email-resolver'

const result = resolveRecipientEmail({
  cmsRecipientEmail: block.props.recipientEmail,
  brand: 'physiotherapy',
  allowTestMode: true,
})

if (result.success) {
  console.log('Sending to:', result.recipientEmail)
  console.log('Test mode:', result.testMode)
  console.log('Source:', result.source) // 'cmsBlock', 'envBrand', etc
}
```

### For Database Admins

Check Supabase `pages` table:

```sql
SELECT 
  id,
  blocks → 'props' ->> 'recipientEmail' as contact_email
FROM pages
WHERE blocks @> '[{"type":"contactForm"}]'::jsonb
```

## See Also

- [CONTACT_FORM_SETUP.md](./CONTACT_FORM_SETUP.md) - Installation
- [CONTACT_FORM_IMPLEMENTATION.md](./CONTACT_FORM_IMPLEMENTATION.md) - Technical Details
- [.env.example](../.env.example) - Environment Variables
