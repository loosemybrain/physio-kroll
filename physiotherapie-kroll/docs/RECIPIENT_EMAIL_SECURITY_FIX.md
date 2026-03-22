# Sicherheitsbehebung: Serverseitige CMS-Empfänger-Auflösung

**Datum:** 20. März 2026  
**Kritikalität:** HIGH – Privilege-Escalation / Email-Redirect-Angriff verhindert  
**Status:** ✅ Behoben

---

## 1. Identifizierter Sicherheitsfehler

### 1.1 Problem: Manipulierbare Empfängeradresse vom Client

**Vorher:**
```typescript
// ❌ UNSICHER: API vertraut Client-Daten als Quelle der Wahrheit
const emailResolution = resolveRecipientEmail({
  cmsRecipientEmail: (body as Record<string, unknown>)?.cmsRecipientEmail as string | undefined,
  brand: data.brand,
  allowTestMode: true,
})
```

**Angriffsszenario:**
```
Attacker Browser Network Tab:
  POST /api/contact
  {
    "brand": "physiotherapy",
    "pageSlug": "contact",
    "blockId": "abc123",
    "name": "John",
    "email": "attacker@example.com",
    "message": "...",
    "cmsRecipientEmail": "attacker@evil.com"  ← Client sendet FALSCHE Adresse
  }

Ergebnis:
  ✉️ Email geht an attacker@evil.com statt an echte Empfänger!
  → Email-Redirect-Angriff
  → Phishing: Attacker kann echte Nachrichtenflüsse abfangen
  → Datenexfiltration: Kundendaten landen bei Attacker
```

### 1.2 Ursache

Der `cmsRecipientEmail`-Wert wurde als **unvertrauenswürdige Client-Eingabe** behandelt, aber direkt als **maßgebliche Auflösungsquelle** verwendet.

---

## 2. Behobene Lösung

### 2.1 Neue serverseitige CMS-Ladefunktion

**Datei:** `src/lib/contact/contact-email-resolver.ts`

**Neue Funktion:**
```typescript
export async function getContactFormBlockFromCMS(
  pageSlug: string,
  blockId: string,
  brand: BrandKey
): Promise<ContactFormBlock | null>
```

**Logik:**
1. Validiert `pageSlug` und `blockId` (Client-Eingaben, aber als **Location**, nicht als Data)
2. Lädt serverseitig die Seite via `getPageBySlugAndBrand(pageSlug, brand)` aus **Supabase**
3. Findet den Block mit ID === `blockId` und type === "contactForm"
4. Extrahiert `block.props.recipientEmail` (die in der **Datenbank gespeicherte** Wert)
5. Gibt den Block zurück (oder `null`, wenn nicht gefunden)

**Sicherheit:** Die `recipientEmail` kommt aus der **vertrauenswürdigen Datenbank**, nicht vom Client!

### 2.2 API Handler nutzt serverseitige Auflösung

**Datei:** `src/app/api/contact/route.ts`

**Neue Logik (Lines 250-275):**
```typescript
// --- RESOLVE RECIPIENT EMAIL (from CMS block, not from client) ---

// Load recipient email from CMS (serverseitig, nicht vom Client vertrauenswürdig)
let cmsRecipientEmailFromBlock: string | undefined = undefined

if (data.pageSlug && data.blockId) {
  const contactFormBlock = await getContactFormBlockFromCMS(
    data.pageSlug,
    data.blockId,
    data.brand
  )
  
  if (contactFormBlock) {
    cmsRecipientEmailFromBlock = contactFormBlock.props?.recipientEmail as string | undefined
  }
}

// Resolve email with priority: TestMode > CMS Block > ENV > Fallback
const emailResolution: EmailResolutionResult = resolveRecipientEmail({
  cmsRecipientEmail: cmsRecipientEmailFromBlock, // Use ONLY the server-loaded CMS value
  brand: data.brand,
  allowTestMode: true,
})
```

**Sicherheit:** 
- ✅ `cmsRecipientEmailFromBlock` kommt NUR aus Supabase (nicht vom Client)
- ✅ Selbst wenn Attacker `cmsRecipientEmail` im Request sendet → wird ignoriert
- ✅ Server lädt die **autoritative Quelle**

### 2.3 Entfernte Client-Vertrauenskette

**Datei:** `src/lib/contact/contact-schema.ts`

**Änderung:**
```typescript
// ❌ ENTFERNT: cmsRecipientEmail aus dem Zod-Schema
// Der Client darf diese Wert nicht länger senden
```

**Datei:** `src/components/blocks/contact-form-block.tsx`

**Änderung (Line 470-476):**
```typescript
const submission = {
  website: (data as Record<string, unknown>)["website"] as string || "",
  formStartedAt: renderTimeRef.current,
  privacyAccepted: requireConsent ? ... : true,
  brand: activeBrand,
  pageSlug: pageSlug || "",
  blockId: blockId,
  // NOTE: Do NOT send cmsRecipientEmail from client - server loads it from CMS
}
```

**Sicherheit:** Frontend sendet die Empfängeradresse gar nicht mehr → nicht manipulierbar!

---

## 3. Datenpfad nach Behebung

### 3.1 Neuer sicherer Fluss

```
1. Admin ediert Block im Inspector
   └─ Setzt recipientEmail in CMS
   └─ Speichert in Supabase: blocks.props.recipientEmail

2. Client füllt Formular aus
   └─ Sendet: pageSlug, blockId (als Location-Hint, nicht als Data)
   └─ Sendet NICHT: cmsRecipientEmail

3. Server empfängt Request
   └─ Nutzt pageSlug + blockId, um die Seite zu laden
   └─ Lädt Block serverseitig aus Supabase
   └─ Extrahiert recipientEmail aus Datenbank
   └─ Client-Daten sind NICHT maßgeblich!

4. Resolver priorisiert:
   1. TestMode (ENV: CONTACT_TEST_MODE)
   2. Datenbankwert (aus CMS-Block)
   3. ENV pro Brand
   4. Globaler Fallback

5. Email wird an die echte, serverseitig aufgelöste Adresse gesendet
   └─ Attacker kann Redirect NICHT mehr durchführen
```

### 3.2 Blockierter Angriff

```
❌ Attacker-Request:
{
  "brand": "physiotherapy",
  "pageSlug": "contact",
  "blockId": "abc123",
  "cmsRecipientEmail": "attacker@evil.com"  ← IGNORIERT!
}

✅ Server-Logik:
1. Lädt Block aus Supabase via pageSlug + blockId
2. Findet: recipientEmail = "info@physiotherapy.de" (aus Datenbank)
3. Ignoriert komplett den Client-Wert "attacker@evil.com"
4. Versendet an "info@physiotherapy.de" ✓

Ergebnis: Angriff BLOCKIERT!
```

---

## 4. Robustheit & Edge Cases

### 4.1 Wenn Block nicht gefunden wird

**Szenario:** Attacker sendet ungültiges `blockId`

```typescript
// Server lädt Block → null
if (!contactFormBlock) {
  cmsRecipientEmailFromBlock = undefined
}

// Resolver fällt automatisch auf ENV zurück
emailResolution = resolveRecipientEmail({
  cmsRecipientEmail: undefined,  // Block nicht gefunden
  brand: "physiotherapy",
  allowTestMode: true,
})

// Priorität aktiviert:
// 1. TestMode? Nein
// 2. CMS-Block? Nein (null)
// 3. ENV? Ja! CONTACT_EMAIL_PHYSIOTHERAPY
// 4. Fallback? Falls nötig
```

**Sicherheit:** Fällt sauber auf ENV zurück, Kein Crash, Kein Leaks!

### 4.2 Wenn `pageSlug` oder `blockId` fehlt

```typescript
if (data.pageSlug && data.blockId) {
  // Nur wenn beide vorhanden
  const contactFormBlock = await getContactFormBlockFromCMS(...)
}

// Falls nicht: cmsRecipientEmailFromBlock = undefined
// → ENV-Fallback greift

emailResolution = resolveRecipientEmail({
  cmsRecipientEmail: undefined,
  brand: data.brand,
})
```

**Sicherheit:** Graceful Degradation, keine Fehler!

### 4.3 Backward Compatibility

✅ Alte Requests ohne `blockId` funktionieren weiterhin  
✅ ENV-basierte Konfiguration bleibt aktiv  
✅ Neue CMS-Blöcke mit `recipientEmail` werden korrekt geladen  

---

## 5. Datenfluss-Diagamm

```
CMS Inspector
    │
    ├─→ Benutzer setzt "Empfangs-E-Mail"
    │   (z.B. "feedback@physiotherapy.de")
    │
    └─→ Speichert in Supabase:
        blocks.props.recipientEmail = "feedback@physiotherapy.de"
        
        
Browser Form
    │
    ├─→ Benutzer sendet Formular
    │   POST /api/contact
    │   {
    │     brand: "physiotherapy",
    │     pageSlug: "contact",
    │     blockId: "abc-123",
    │     name: "John",
    │     email: "john@example.com",
    │     message: "...",
    │     // ❌ cmsRecipientEmail NICHT gesendet!
    │   }
    │
    └─→ Server empfängt Request


API Handler
    │
    ├─→ Validiert Zod-Schema
    │   (cmsRecipientEmail ist NICHT im Schema)
    │
    ├─→ Lädt Block serverseitig:
    │   getContactFormBlockFromCMS(
    │     "contact",     // pageSlug
    │     "abc-123",     // blockId
    │     "physiotherapy" // brand
    │   )
    │
    ├─→ Supabase Query:
    │   SELECT * FROM pages WHERE slug="contact" AND brand="physiotherapy"
    │   SELECT * FROM blocks WHERE page_id=... AND id="abc-123"
    │
    ├─→ Extrahiert:
    │   recipientEmail = block.props.recipientEmail
    │   = "feedback@physiotherapy.de" (aus Datenbank!)
    │
    └─→ Resolver nutzt Datenbank-Wert:
        resolveRecipientEmail({
          cmsRecipientEmail: "feedback@physiotherapy.de", // ← aus DB!
          brand: "physiotherapy",
        })


Email Versand
    │
    └─→ An: feedback@physiotherapy.de ✓
        (nicht manipulierbar!)
```

---

## 6. Geänderte Dateien

| Datei | Änderung | Sicherheit |
|-------|----------|-----------|
| `src/lib/contact/contact-email-resolver.ts` | Neue `getContactFormBlockFromCMS()` Funktion | ✅ Lädt authoritative Source |
| `src/app/api/contact/route.ts` | Nutzt serverseitige CMS-Auflösung | ✅ Ignoriert Client-Wert |
| `src/lib/contact/contact-schema.ts` | `cmsRecipientEmail` entfernt aus Schema | ✅ Client kann nicht senden |
| `src/components/blocks/contact-form-block.tsx` | Sendet `cmsRecipientEmail` nicht mehr | ✅ Kleinere Attack Surface |

---

## 7. Verifikations-Checkliste

### 7.1 Sicherheit
- ✅ Client kann Empfängeradresse nicht manipulieren
- ✅ Server lädt Block aus vertrauenswürdiger DB (Supabase)
- ✅ Keine `cmsRecipientEmail` im Client-Request
- ✅ Schema validiert nicht mehr diesen Wert
- ✅ Graceful Degradation bei fehlenden Blöcken/Seiten

### 7.2 Funktionalität
- ✅ Inspector-Feld sichtbar und speicherbar (unverändert)
- ✅ Wert wird nach Reload beibehalten
- ✅ Email wird an korrekte Adresse versendet
- ✅ Testmodus funktioniert noch
- ✅ ENV-Fallback funktioniert noch

### 7.3 Logging
- ✅ Server loggt wenn Block gefunden wird (Debug)
- ✅ Server loggt wenn Block nicht gefunden wird (Warning)
- ✅ Resolver loggt finale Email-Quelle ("cmsBlock", "envBrand", "envFallback", "testMode")
- ✅ Keine PII in Logs

---

## 8. Test-Anleitung

### 8.1 Lokaler Test

**Szenario 1: Normaler Ablauf**
1. Im CMS: ContactFormBlock editieren → "Empfangs-E-Mail" auf `test@example.com` setzen
2. Formular absenden
3. Server Logs: `source: "cmsBlock"` → Email geht an `test@example.com` ✓

**Szenario 2: Block nicht gefunden**
1. Im Formular: `blockId` auf ungültige UUID ändern
2. Formular absenden (braucht Netzwerk Inspector)
3. Server Logs: "ContactForm block not found" → fällt auf ENV zurück ✓

**Szenario 3: Manipulation blockiert**
1. Network Inspector öffnen
2. Formular normal absenden
3. Im Network Request: `cmsRecipientEmail` zu `attacker@evil.com` ändern und absenden
4. Server ignoriertManipulation, versendet an echte Adresse aus Datenbank ✓

### 8.2 Sicherheits-Check

```bash
# 1. Schema validiert nicht mehr cmsRecipientEmail
grep -n "cmsRecipientEmail" src/lib/contact/contact-schema.ts
# → Sollte 0 Treffer haben

# 2. Frontend sendet nicht mehr cmsRecipientEmail
grep -n "cmsRecipientEmail" src/components/blocks/contact-form-block.tsx
# → Sollte nur im NOTE-Kommentar vorkommen

# 3. API lädt Block serverseitig
grep -n "getContactFormBlockFromCMS" src/app/api/contact/route.ts
# → Sollte aufgerufen werden
```

---

## 9. Restliche Sicherheitsüberlegungen

### 9.1 Block-Verfügbarkeit
- **Current:** Nur published Seiten werden geladen (`eq("status", "published")`)
- **Sicherheit:** Gut – Draft-Inhalte können nicht manipuliert werden
- **Falls Bedarf:** Könnte auf Draft ausgeweitet werden mit zusätzlicher Auth

### 9.2 Block Type Validierung
- **Current:** `block.type === "contactForm"` wird validiert
- **Sicherheit:** Gut – verhindert Verwechslung mit anderen Block-Typen
- **Falls Bedarf:** Könnte zusätzliche Schema-Validierung auf `props.recipientEmail` machen

### 9.3 Supabase RLS
- **Current:** `getPageBySlugAndBrand` nutzt `supabaseAdmin()`
- **Sicherheit:** OK für öffentliche Seiten, aber nicht gehärtet gegen RLS
- **Wenn gewünscht:** Könnte eine Public Read API für Pages bauen

---

## 10. Zusammenfassung

**Sicherheitsfehler behoben:** ✅ Email-Redirect-Angriff via manipulierte `cmsRecipientEmail` NICHT möglich  
**Methode:** Serverseitige CMS-Auflösung statt Client-Vertrauenskette  
**Implementierung:** `getContactFormBlockFromCMS()` lädt authoritative Source  
**Fallback:** ENV-Variablen greifen noch immer, wenn Block fehlt  
**Kompatibilität:** Alte Requests funktionieren weiterhin  
**Logging:** Klare Nachverfolgung der Quellen  

Die Kontaktformular-Empfängeradresse ist nun **serverseitig gehärtet** und nicht manipulierbar.
