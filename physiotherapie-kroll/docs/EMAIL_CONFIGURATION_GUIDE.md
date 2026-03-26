# Contact Form "Nachricht konnte nicht versendet werden" Fix

**Datum:** 20. März 2026  
**Fehler:** "Nachricht konnte nicht versendet werden. Bitte kontaktieren Sie direkt."  
**Ursache:** Fehlende Email-Konfiguration in `.env.local`  
**Status:** ✅ Behoben (konfigurierbar)

---

## 1. Root Cause

Der Fehler passiert, weil die **Brand-spezifischen Email-Adressen nicht konfiguriert** sind:

```typescript
// src/app/api/contact/route.ts, Line 283
if (!emailResolution.success || !emailResolution.recipientEmail) {
  return NextResponse.json(
    { error: "Nachricht konnte nicht versendet werden. Bitte kontaktieren Sie direkt." },
    { status: 500 }
  )
}
```

**Das Problem:**
```
resolver versucht Empfänger zu finden:
1. Testmodus? Nein
2. CMS-Block Wert? (Optional, kann auch fehlen)
3. ENV: CONTACT_EMAIL_PHYSIOTHERAPY? → FEHLT! ❌
4. ENV: CONTACT_EMAIL_PHYSIOKONZEPT? → FEHLT! ❌
5. ENV: CONTACT_FALLBACK_EMAIL? → FEHLT! ❌

Resultat: Keine gültige Email gefunden → Error ❌
```

---

## 2. Behobene Änderungen

### 2.1 `.env.local` erweitert mit allen Email-Variablen

**Datei:** `.env.local`

**Template (aktualisiert):**
```bash
# Contact Form Configuration - Email Recipients (REQUIRED!)
CONTACT_EMAIL_PHYSIOTHERAPY=your-physiotherapy-email@example.com
CONTACT_EMAIL_PHYSIOKONZEPT=your-physio-konzept-email@example.com
CONTACT_FALLBACK_EMAIL=fallback@example.com

# Contact Form Configuration - Email Sender
CONTACT_FROM_EMAIL=noreply@example.com

# Contact Form Configuration - Email Provider
RESEND_API_KEY=your_resend_api_key_here
```

### 2.2 Verbessertes Debug-Logging

**Datei:** `src/app/api/contact/route.ts`, Line ~283

**Hinzugefügt:**
```typescript
console.error("[Contact API] Email Resolution Failed:", {
  success: emailResolution.success,
  reason: emailResolution.reason,    // z.B. "No recipient email configured"
  source: emailResolution.source,    // z.B. "envFallback"
  brand: data.brand,
})

// Logging zeigt auch, welche ENV Vars gesetzt sind:
{
  CONTACT_EMAIL_PHYSIOTHERAPY: "SET" | "MISSING",
  CONTACT_EMAIL_PHYSIOKONZEPT: "SET" | "MISSING",
  CONTACT_FALLBACK_EMAIL: "SET" | "MISSING",
  CONTACT_TEST_MODE: boolean,
}
```

**Effekt:** Terminal-Logs zeigen genau, was fehlt!

---

## 3. Schritt-für-Schritt Setup

### 3.1 Schritt 1: Email-Adressen auswählen

**Für Physiotherapy Brand:**
```bash
CONTACT_EMAIL_PHYSIOTHERAPY=contact@physiotherapy-kroll.de
```

**Für Physio-Konzept Brand:**
```bash
CONTACT_EMAIL_PHYSIOKONZEPT=contact@physio-konzept.de
```

**Fallback (optional, aber empfohlen):**
```bash
CONTACT_FALLBACK_EMAIL=admin@example.de
```

### 3.2 Schritt 2: Resend Setup

1. Gehe zu **resend.com**
2. Registriere dich (kostenlos!)
3. Erstelle ein API Key
4. Kopiere den Key in `.env.local`:

```bash
RESEND_API_KEY=re_YOUR_RESEND_API_KEY
```

### 3.3 Schritt 3: Sender Email setzen

```bash
CONTACT_FROM_EMAIL=noreply@example.de
```

### 3.4 Schritt 4: Server neu starten

```bash
# Stoppe dev server
Ctrl+C

# Starte neu
npm run dev
```

---

## 4. Komplettes `.env.local` Template

```bash
# === SUPABASE ===
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_abc123...
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# === CONTACT FORM - CORS ===
CONTACT_ALLOWED_ORIGINS=localhost,127.0.0.1,localhost:3000,127.0.0.1:3000

# === CONTACT FORM - EMAIL RECIPIENTS (REQUIRED!) ===
CONTACT_EMAIL_PHYSIOTHERAPY=contact@physiotherapy.de
CONTACT_EMAIL_PHYSIOKONZEPT=contact@physio-konzept.de
CONTACT_FALLBACK_EMAIL=admin@example.de

# === CONTACT FORM - SENDER ===
CONTACT_FROM_EMAIL=noreply@example.de

# === CONTACT FORM - RESEND API ===
RESEND_API_KEY=re_your_api_key_here

# === CONTACT FORM - TEST MODE (optional) ===
# CONTACT_TEST_MODE=false
# CONTACT_TEST_EMAIL=test@example.de
```

---

## 5. Priorität der Email-Auflösung

Der Server versucht in dieser Reihenfolge die Empfänger zu finden:

```
1. TEST MODE aktiv?
   └─ JA → Nutze CONTACT_TEST_EMAIL
   
2. CMS-Block hat `recipientEmail` gespeichert?
   └─ JA → Nutze diesen Wert
   
3. ENV für Brand?
   └─ CONTACT_EMAIL_PHYSIOTHERAPY (für "physiotherapy" brand)
   └─ CONTACT_EMAIL_PHYSIOKONZEPT (für "physio-konzept" brand)
   
4. Global CONTACT_FALLBACK_EMAIL?
   └─ JA → Nutze diesen
   
5. NICHTS gefunden?
   └─ ERROR ❌ "Nachricht konnte nicht versendet werden"
```

---

## 6. Testing

### 6.1 Local Test mit echten Email-Adressen

```bash
# .env.local hat:
CONTACT_EMAIL_PHYSIOTHERAPY=deine-email@example.de
CONTACT_EMAIL_PHYSIOKONZEPT=deine-email@example.de
CONTACT_FROM_EMAIL=noreply@example.de
RESEND_API_KEY=re_YOUR_RESEND_API_KEY

# 1. Server starten:
npm run dev

# 2. Formular füllen und absenden

# 3. Check:
# - Browser: Success Message? ✓
# - Terminal: Logs zeigen Email-Versand? ✓
# - Inbox: Email angekommen? ✓
```

### 6.2 Debug: Terminal-Logs prüfen

Wenn Fehler auftritt, schau auf Terminal nach:

```
[Contact API] Email Resolution Failed: {
  success: false,
  reason: "No recipient email configured (CMS, ENV, or fallback)",
  source: "envFallback",
  brand: "physiotherapy"
}
```

Das zeigt genau, was fehlt!

### 6.3 Test-Mode aktivieren (optional)

```bash
# In .env.local:
CONTACT_TEST_MODE=true
CONTACT_TEST_EMAIL=test@example.de

# Jetzt gehen ALLE Emails an test@example.de
# (egal welche Brand)
# Originale Empfänger wird geloggt
```

---

## 7. Häufige Fehler

### Fehler 1: Email als String mit Quotes

```bash
# ❌ FALSCH:
CONTACT_EMAIL_PHYSIOTHERAPY="contact@example.de"

# ✅ RICHTIG:
CONTACT_EMAIL_PHYSIOTHERAPY=contact@example.de
```

### Fehler 2: Server nicht neu gestartet

```bash
# Wenn .env.local geändert wird, MUSS Server neu gestartet werden!
# ❌ Alte Konfiguration wird weiterhin verwendet

# ✅ Immer neu starten:
npm run dev
```

### Fehler 3: Ungültige Email-Format

```bash
# ❌ FALSCH:
CONTACT_EMAIL_PHYSIOTHERAPY=contact@example

# ✅ RICHTIG:
CONTACT_EMAIL_PHYSIOTHERAPY=contact@example.de
```

### Fehler 4: Resend API Key nicht gesetzt

```bash
# Wenn RESEND_API_KEY fehlt:
# Error beim Email-Versand kommt von der Mail-Provider Seite

# ✅ Geh zu resend.com und hole deinen Key
RESEND_API_KEY=re_YOUR_RESEND_API_KEY
```

---

## 8. Production Setup (Vercel)

Für Vercel müssen die Secrets über den Dashboard gesetzt werden:

1. Gehe zu Vercel Dashboard → Project Settings → Environment Variables
2. Füge die folgenden Variablen hinzu:

```
CONTACT_EMAIL_PHYSIOTHERAPY = contact@physiotherapy.de
CONTACT_EMAIL_PHYSIOKONZEPT = contact@physio-konzept.de
CONTACT_FALLBACK_EMAIL = admin@example.de
CONTACT_FROM_EMAIL = noreply@example.de
RESEND_API_KEY = re_...
CONTACT_ALLOWED_ORIGINS = physiotherapy.de,physio-konzept.de,www.physiotherapy.de,www.physio-konzept.de
```

3. Redeploy

---

## 9. Geänderte Dateien

| Datei | Änderung | Zweck |
|-------|----------|-------|
| `.env.local` | ➕ Email ENV Vars | Konfiguriert Brand-Email-Adressen |
| `src/app/api/contact/route.ts` | ➕ Detailed Error Logging | Zeigt genau, was fehlt |

---

## 10. Resultat

**Vorher:**
```
Submit Formular → Error: "Nachricht konnte nicht versendet werden"
Ursache: ??? (unklar!)
```

**Nachher:**
```
Submit Formular → ✓ Email versendet
Terminal zeigt: "[Contact API] Email Resolution: source=envBrand"
Inbox: Email angekommen ✓
```

---

## 11. Checkliste für Produktions-Betrieb

- ✅ `CONTACT_EMAIL_PHYSIOTHERAPY` gesetzt
- ✅ `CONTACT_EMAIL_PHYSIOKONZEPT` gesetzt
- ✅ `CONTACT_FALLBACK_EMAIL` gesetzt (optional)
- ✅ `CONTACT_FROM_EMAIL` gesetzt
- ✅ `RESEND_API_KEY` gültig und aktiv
- ✅ `CONTACT_ALLOWED_ORIGINS` auf Production-Domain gesetzt
- ✅ Server neu gestartet

Wenn alle ✓, sollte das Kontaktformular funktionieren! 🎉
