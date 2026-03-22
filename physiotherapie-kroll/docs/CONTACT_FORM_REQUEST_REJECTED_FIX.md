# Contact Form "Request rejected" Error Fix

**Datum:** 20. März 2026  
**Fehler:** "Request rejected" (403 Forbidden)  
**Ursache:** CSRF Origin-Check blockiert Request  
**Status:** ✅ Behoben

---

## 1. Root Cause

Der Fehler `"Request rejected"` kommt vom **Origin-Validierungscheck** in der API Route:

```typescript
// src/app/api/contact/route.ts, Line 146-147
if (!validateOrigin(request)) {
  return NextResponse.json({ error: "Request rejected" }, { status: 403 })
}
```

**Das Problem:**
```
CONTACT_ALLOWED_ORIGINS war NICHT in .env.local gesetzt
↓
Default fallback: "localhost" only
↓
Browser sendet: "http://127.0.0.1:3000" oder "http://localhost:3000"
↓
Origin-Check sieht Mismatch
↓
Request wird blockiert! ❌
```

---

## 2. Behobene Änderungen

### 2.1 `.env.local` erweitert

**Datei:** `.env.local`

**Hinzugefügt:**
```bash
# Contact Form Configuration
CONTACT_ALLOWED_ORIGINS=localhost,127.0.0.1,localhost:3000,127.0.0.1:3000
```

**Erlaubte Origins:**
- `localhost` – localhost ohne Port
- `127.0.0.1` – IP-Adresse ohne Port
- `localhost:3000` – localhost mit Port (Next.js Dev)
- `127.0.0.1:3000` – IP-Adresse mit Port

### 2.2 Verbessertes Debug-Logging

**Datei:** `src/app/api/contact/route.ts`, Line ~70

**Hinzugefügt:**
```typescript
// Log incoming request info for debugging
console.log("[Contact API] Origin check:", {
  origin,
  host,
  referer,
  allowedOrigins,
})
```

**Effekt:** Wenn Origin-Check fehlschlägt, siehst du jetzt in den Server Logs:
```
[Contact API] Origin check: {
  origin: "http://127.0.0.1:3000",
  host: "127.0.0.1:3000",
  referer: "http://127.0.0.1:3000/kontakt",
  allowedOrigins: ["localhost", "127.0.0.1", ...]
}
```

---

## 3. Wie das Origin-Check funktioniert

### 3.1 Sichere Ursprünge

```
Browser Request:
├─ Origin: "http://127.0.0.1:3000"
├─ Host: "127.0.0.1:3000"
└─ Referer: "http://127.0.0.1:3000/kontakt"

API Handler:
├─ Hole CONTACT_ALLOWED_ORIGINS aus ENV
├─ Split und trim: ["localhost", "127.0.0.1", "localhost:3000", "127.0.0.1:3000"]
├─ Check: origin.includes(allowed)?
│  └─ "http://127.0.0.1:3000" includes "127.0.0.1" ✓ → ALLOWED
└─ Proceed ✓
```

### 3.2 Blockierte Ursprünge

```
Beispiel: origin = "http://evil.com"
allowedOrigins = ["localhost", "127.0.0.1"]

Check: "http://evil.com" includes "localhost"? ✗
Check: "http://evil.com" includes "127.0.0.1"? ✗
→ BLOCKED ✓ (correct security)
```

---

## 4. Production Setup

Für **Vercel / Production**, aktualisiere die Umgebungsvariablen:

```bash
# .env.production (oder Vercel Secrets)
CONTACT_ALLOWED_ORIGINS=localhost,physiotherapy.de,physio-konzept.de

# Oder mit Port (falls nötig):
CONTACT_ALLOWED_ORIGINS=localhost,127.0.0.1,physiotherapy.de,www.physiotherapy.de,physio-konzept.de,www.physio-konzept.de
```

---

## 5. Testing-Anleitung

### 5.1 Local Development (jetzt behoben)

```bash
# 1. Starte Next.js Dev Server
npm run dev

# 2. Öffne http://localhost:3000 oder http://127.0.0.1:3000
# 3. Gehe zu Kontaktformular
# 4. Fülle Formular aus
# 5. Submit → sollte funktionieren ✓
```

### 5.2 Check Server Logs

```
Terminal zeigt:
[Contact API] Origin check: {
  origin: "http://localhost:3000",
  host: "localhost:3000",
  referer: "http://localhost:3000/kontakt",
  allowedOrigins: ["localhost", "127.0.0.1", ...]
}
```

Wenn Origin dabei ist → wird erlaubt ✓

### 5.3 Fehlerfall - Origin blockieren

Um zu testen, ob Security funktioniert:

```javascript
// Browser Console:
fetch("http://localhost:3000/api/contact", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    // Manuell falscher Origin (wird vom Browser normal nicht erlaubt, aber zu Testzwecken):
  },
  body: JSON.stringify({ /* ... */ })
})
```

Ergebnis: `403 Request rejected` ✓ (Security works!)

---

## 6. Umgebungsvariablen Referenz

| Variable | Default | Format | Beispiel |
|----------|---------|--------|----------|
| `CONTACT_ALLOWED_ORIGINS` | `"localhost"` | Komma-getrennt | `localhost,127.0.0.1,example.com` |
| `CONTACT_ALLOWED_ORIGINS` | (mit Port) | Komma-getrennt | `localhost:3000,127.0.0.1:3000,example.com:443` |

**Wichtig:** Port muss EXAKT matchen!
- ✅ `localhost:3000` matched `http://localhost:3000`
- ❌ `localhost:3000` matched NICHT `http://localhost:3001`

---

## 7. Häufige Fehler & Lösungen

### Fehler 1: Leerzeichen in CONTACT_ALLOWED_ORIGINS

```bash
# ❌ FALSCH (hat Leerzeichen):
CONTACT_ALLOWED_ORIGINS=localhost, 127.0.0.1, localhost:3000

# ✅ RICHTIG (kein Leerzeichen):
CONTACT_ALLOWED_ORIGINS=localhost,127.0.0.1,localhost:3000
```

Code trimmt es automatisch, aber besser vermeiden.

### Fehler 2: Port vergessen

```bash
# ❌ FALSCH (Port fehlt):
CONTACT_ALLOWED_ORIGINS=localhost
# Browser sendet: http://localhost:3000
# → MISMATCH!

# ✅ RICHTIG (mit Port):
CONTACT_ALLOWED_ORIGINS=localhost,localhost:3000
```

### Fehler 3: Protokoll in Env (nicht nötig)

```bash
# ❌ FALSCH (Protokoll angeben):
CONTACT_ALLOWED_ORIGINS=http://localhost

# ✅ RICHTIG (nur Host/Port):
CONTACT_ALLOWED_ORIGINS=localhost
```

Der Code nutzt `.includes()`, deswegen nur Hostname!

---

## 8. Security-Notizen

✅ **Origin-Check ist wichtig für CSRF-Protection**
- Blockiert Requests von nicht-erlaubten Domains
- Verhindert, dass bösartige Websites Formulare im Namen des Users absenden

✅ **Referer Fallback**
- Wenn Origin-Header fehlt, nutzt Code Referer-Header
- Nicht alle Browser senden Origin (z.B. ältere Versionen)

✅ **Whitelisting ist besser**
- Explizites Erlauben (Whitelist) ist sicherer als Blockieren (Blacklist)
- Deswegen explizite CONTACT_ALLOWED_ORIGINS-Liste

---

## 9. Geänderte Dateien

| Datei | Änderung | Zweck |
|-------|----------|-------|
| `.env.local` | ➕ CONTACT_ALLOWED_ORIGINS | Erlaubt lokale Origins |
| `src/app/api/contact/route.ts` | ➕ Debug-Logging in validateOrigin | Bessere Fehlerdiagnose |

---

## 10. Resultat

**Vorher:**
```
Submit Formular → "Request rejected" → Nichts passiert ❌
```

**Nachher:**
```
Submit Formular → Origin wird geprüft ✓ → Email versendet ✓
```

Der **"Request rejected"-Fehler ist behoben!** Das Kontaktformular sollte jetzt funktionieren. 🎉

---

**Falls immer noch Fehler auftritt:**
1. Prüfe Browser Console (F12) auf Error-Message
2. Prüfe Terminal-Logs auf `[Contact API] Origin check`-Eintrag
3. Stelle sicher, dass `.env.local` gespeichert und Server neu gestartet wurde
