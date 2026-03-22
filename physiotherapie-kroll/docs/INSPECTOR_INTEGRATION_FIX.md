# Inspector-Integration für Kontaktformular – Behobene Probleme

**Datum:** 20. März 2026  
**Zweck:** Konsolidierung der Empfangs-E-Mail-Verwaltung und vollständige Inspector-Integration

---

## 1. Analysierte Probleme

### 1.1 Datenmodell-Dualität
**Problem:** Es existierten zwei parallele Felder zur Verwaltung von Empfängeradressen:
- `recipients?: { physiotherapy?: string; "physio-konzept"?: string }` (CMS-Typ, alt)
- `recipientEmail?: string` (neues Block-Level-Feld)

**Auswirkung:** Code-Verwirrung, keine klare Quelle der Wahrheit, doppelte Logik möglich.

### 1.2 API-Payload sendet keine `cmsRecipientEmail`
**Problem:** Der API Handler in `src/app/api/contact/route.ts` erwartet `cmsRecipientEmail` im Request Body (Zeile 253), aber `ContactFormBlock` sendet es nicht.

**Auswirkung:** Der CMS-konfigurierte Wert wird vom Frontend nicht an den Server übertragen → ENV-Fallback wird immer verwendet, CMS-Feld hat keine Wirkung.

### 1.3 Inspector-Section nicht gerendert
**Problem:** 
- `ContactFormInspectorSection` ist nicht in `PageEditorInspector.tsx` importiert
- Nicht im Render-Flow für `selectedBlock.type === "contactForm"` enthalten
- Daher wird das Feld „Empfangs-E-Mail" im Admin nicht angezeigt

**Auswirkung:** Administratoren können die Empfangsadresse nicht im Inspector bearbeiten.

### 1.4 Zod Schema incomplete
**Problem:** `cmsRecipientEmail` war nicht in `contactSubmissionSchema` definiert, obwohl die API es verarbeitet.

**Auswirkung:** Typischerweise würde das zu Runtime-Problemen führen, wenn Daten vom Frontend kommen.

---

## 2. Durchgeführte Fixes

### 2.1 CMS-Typ vereinheitlicht
**Datei:** `src/types/cms.ts`

**Änderung:**
- ❌ Entfernt: `recipients?: { physiotherapy?: string; "physio-konzept"?: string }`
- ✅ Behalten: `recipientEmail?: string` (Line 673)

**Grund:** Block-Level-Konfiguration ist architektonisch passender als Brand-Level. Sie ermöglicht flexible Ziele pro Block und pro Brand.

### 2.2 Registry bereinigt
**Datei:** `src/cms/blocks/registry.ts`

**Änderungen:**
1. **Zeile 668-671:** `recipients` Feld aus `contactFormPropsSchema` entfernt
2. **Zeile 1497-1500:** Default Props: `recipients` entfernt → `recipientEmail: undefined` gesetzt
3. **Zeile 690-697:** `recipientEmail: z.string().email().optional()` zum Schema hinzugefügt

**Grund:** Einzige, konsistente Definition des Empfängerfelds im CMS.

### 2.3 Kontaktformular sendet `cmsRecipientEmail` an API
**Datei:** `src/components/blocks/contact-form-block.tsx`

**Änderungen:**
1. **Line 384:** Parameter `recipientEmail` zu Destructuring hinzugefügt
2. **Line 477:** `cmsRecipientEmail: recipientEmail || undefined` zur Submission hinzugefügt

**Code:**
```typescript
const submission: Record<string, string | number | boolean | undefined> = {
  website: (data as Record<string, unknown>)["website"] as string || "",
  formStartedAt: renderTimeRef.current,
  privacyAccepted: requireConsent ? (data as Record<string, unknown>)["consent"] === true : true,
  brand: activeBrand,
  pageSlug: pageSlug || "",
  blockId: blockId,
  cmsRecipientEmail: recipientEmail || undefined, // ← NEU
}
```

### 2.4 Inspector-Section importiert und gerendert
**Datei:** `src/components/admin/editor/PageEditorInspector.tsx`

**Änderungen:**
1. **Line 47:** Import hinzugefügt:
   ```typescript
   import { ContactFormInspectorSection } from "./inspectors/ContactFormInspectorSection"
   ```

2. **Line 935-946:** Bedingter Render-Block nach `SectionInspectorSection` eingefügt:
   ```typescript
   {/* ContactForm Inspector Section */}
   {selectedBlock.type === "contactForm" && (
     <>
       <ContactFormInspectorSection
         selectedBlock={selectedBlock}
         selectedBlockId={selectedBlockId}
         updateBlockPropsById={updateBlockPropsById}
         fieldRefs={fieldRefs}
         isTypingRef={isTypingRef}
       />
       <Separator />
     </>
   )}
   ```

**Grund:** Rendering erfolgt jetzt tatsächlich, wenn ein ContactFormBlock ausgewählt ist.

### 2.5 Zod Schema aktualisiert
**Datei:** `src/lib/contact/contact-schema.ts`

**Änderung (nach Line 110):**
```typescript
// CMS-configured recipient email (from inspector, optional, falls back to env)
cmsRecipientEmail: z
  .string()
  .email("Invalid recipient email format")
  .optional()
  .or(z.literal("")),
```

**Grund:** Validierung des Frontend-Wertes auf dem Server; verhindert Header-Injection und ungültige Emails.

---

## 3. Datenpfad-Auflösung (final)

### 3.1 Einziger Datenpfad für blockbezogene Empfänger
**Quelle:** `ContactFormBlock.props.recipientEmail`

**Datenfluss:**
```
CMS Editor (Inspector)
    ↓
ContactFormBlock.props.recipientEmail
    ↓
Frontend sendet cmsRecipientEmail im Request Body
    ↓
API Handler validiert via contact-schema.ts
    ↓
resolveRecipientEmail(...) priorisiert:
    1. cmsRecipientEmail (von der API ankommend)
    2. ENV: CONTACT_EMAIL_PHYSIOTHERAPY / CONTACT_EMAIL_PHYSIOKONZEPT
    3. ENV: CONTACT_FALLBACK_EMAIL
```

### 3.2 Keine Parallelpfade
- ❌ ~~recipients (alt)~~ → Entfernt
- ❌ ~~Brand-Level Settings~~ → Nicht implementiert
- ✅ **Block-Level `recipientEmail`** → Alleinige Quelle

---

## 4. Kompatibilität

### 4.1 Migrationsstrategie
**Alte Blöcke (mit `recipients` Feld):**
- Werden bei Laden automatisch normalisiert durch Zod-Schema
- `recipients` wird ignoriert, nicht als Fehler behandelt
- `recipientEmail` bleibt `undefined` → ENV-Fallback greift

**Neu erstellte Blöcke:**
- `recipientEmail` ist optional (default: `undefined`)
- Falls leer → ENV-Fallback automatisch aktiv

### 4.2 Backward Compatibility
✅ Alte Seiten/Blöcke crashen nicht  
✅ Bestehende ENV-basierte Konfiguration bleibt aktiv  
✅ Neue `recipientEmail`-Einträge arbeiten parallel zur bestehenden Logik  

---

## 5. Verifikations-Checkliste

### 5.1 Frontend → API
- ✅ ContactFormBlock destukturiert `recipientEmail` aus Props
- ✅ Block sendet `cmsRecipientEmail` im Submission Body
- ✅ Contact-Schema validiert `cmsRecipientEmail` als Email

### 5.2 API → Resolver
- ✅ Route Handler extrahiert `cmsRecipientEmail` aus Request
- ✅ Resolver erhält `config.cmsRecipientEmail`
- ✅ Resolver priorisiert CMS > ENV > Fallback

### 5.3 Inspector → CMS
- ✅ ContactFormInspectorSection ist importiert
- ✅ Wird für `selectedBlock.type === "contactForm"` gerendert
- ✅ Zeigt Feld „Empfangs-E-Mail"
- ✅ Speichert via `updateBlockPropsById` zu `props.recipientEmail`
- ✅ Validierung erfolgt inline (Email-Format)

### 5.4 Persistierung
- ✅ Wertänderung im Inspector → `updateBlockPropsById` → Block Props
- ✅ Block Props → persistiert im CMS Datenstore
- ✅ Reload → CMS lädt Block Props neu → Inspector zeigt aktuellen Wert

### 5.5 Sicherheit
- ✅ CMS-Wert wird serverseitig nochmal validiert (Zod)
- ✅ Keine Header-Injection möglich (sanitiert in `contact-email-resolver.ts`)
- ✅ Keine unvalidierten Daten in Mail-Header

---

## 6. Dateien geändert

| Datei | Änderung | Zeilen |
|-------|----------|--------|
| `src/types/cms.ts` | `recipients` entfernt | 626-629 gelöscht |
| `src/cms/blocks/registry.ts` | `recipients` aus Schema entfernt, `recipientEmail` hinzugefügt | 668-671, 690-697, 1497-1500 |
| `src/components/blocks/contact-form-block.tsx` | Parameter + API-Payload | 384, 477 |
| `src/components/admin/editor/PageEditorInspector.tsx` | Import + bedingter Render | 47, 935-946 |
| `src/lib/contact/contact-schema.ts` | `cmsRecipientEmail` zu Zod Schema | ~110-115 |

---

## 7. Test-Anleitung

### 7.1 Lokal (Development)
1. **Block erstellen/editieren:**
   - Im CMS einen **neuen ContactFormBlock** erstellen
   - Im Inspector nach dem Feld „Empfangs-E-Mail" suchen
   - Eine gültige Email eingeben (z.B. `test@example.com`)
   - Speichern

2. **Form absenden:**
   - Frontend öffnen, Formular ausfüllen
   - Network Inspector prüfen: `/api/contact` POST Request
   - Body sollte `"cmsRecipientEmail": "test@example.com"` enthalten

3. **Email-Versand prüfen:**
   - Server Logs prüfen: `[API /contact]` sollte zeigen:
     - `source: "cmsBlock"` oder `"testMode"`
     - `recipientEmail: "test@example.com"` (oder Test-Email, falls CONTACT_TEST_MODE=true)

4. **Fallback prüfen:**
   - CMS-Wert leeren
   - Formular neu absenden
   - Logs sollten zeigen: `source: "envBrand"`
   - Email geht an `CONTACT_EMAIL_PHYSIOTHERAPY` oder `CONTACT_EMAIL_PHYSIOKONZEPT`

### 7.2 Reload-Persistierung
1. **Block-E-Mail setzen** (z.B. `my-email@example.com`)
2. **Page speichern**
3. **Browser reload** (`F5`)
4. **Block wieder auswählen** → Inspector sollte noch `my-email@example.com` zeigen

### 7.3 Validation
1. **Ungültige Email eingeben** (z.B. `notanemail`)
2. Inspector sollte Error zeigen
3. **Speichern sollte blockiert** oder mit Fehler reagieren

### 7.4 Production (Vercel)
1. ENV-Variablen prüfen:
   ```bash
   CONTACT_EMAIL_PHYSIOTHERAPY=info@physiotherapy.de
   CONTACT_EMAIL_PHYSIOKONZEPT=info@physio-konzept.de
   CONTACT_FALLBACK_EMAIL=fallback@example.de
   CONTACT_TEST_MODE=false  # oder true zum Testen
   ```
2. Block-Email in CMS setzen
3. Formular absenden
4. Vercel Logs prüfen: `[API /contact]` sollte Auflösung zeigen

---

## 8. Bekannte Limitierungen / Restpunkte

1. **Keine Multi-Recipient-Konfiguration pro Block:**
   - `recipientEmail` ist auf **eine** E-Mail-Adresse beschränkt
   - Falls mehrere Empfänger pro Block nötig: neue Architektur erforderlich

2. **Validator für CMS-Wert im Inspector:**
   - Inline-Validierung erfolgt im Inspector (Frontend)
   - Serverseitige Validierung filtert ungültige Werte
   - Keine sperr-Funktion für ungültige CMS-Einträge → wird beim Versand abgewiesen

3. **Keine Auditierung von CMS-Änderungen:**
   - Wer/wann das Feld ändert wird nicht geloggt
   - Falls gewünscht: separate Audit-Infrastruktur erforderlich

---

## 9. Zusammenfassung

✅ **Datenmodell unified**: Ein klarer Datenpfad `props.recipientEmail`  
✅ **Inspector aktiv**: Feld sichtbar, editierbar, persistent  
✅ **API integriert**: Frontend sendet `cmsRecipientEmail`, Server validiert und nutzt es  
✅ **Fallback funktional**: CMS > ENV > Fallback-Hierarchie aktiv  
✅ **Kompatibel**: Alte Blöcke crashen nicht  
✅ **Sicher**: Serverseitige Validierung, keine Header-Injection  

Die Empfangs-E-Mail für das Kontaktformular ist jetzt vollständig im Inspector integriert und funktionsfähig.
