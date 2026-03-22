# Build-Fehler behobene: Server-Only Trennung

**Datum:** 20. März 2026  
**Status:** ✅ Build erfolgreich  
**Fehler:** "server-only" Import in Client Component

---

## 1. Problem

Der Build ist fehlgeschlagen, weil die Sicherheitsbehebung einen **"server-only" Import in Client Components** verursacht hat:

```
Error: You're importing a component that needs "server-only". 
That only works in a Server Component which is not supported in the pages/ directory.

./src/lib/contact/contact-email-resolver.ts [Client Component Browser]
  └── imports getContactFormBlockFromCMS (server-only!)
    └── ./src/lib/contact/contact-email-resolver.ts
      └── ./src/components/admin/editor/inspectors/ContactFormInspectorSection.tsx (Client!)
```

**Ursache:** `getContactFormBlockFromCMS()` war in `contact-email-resolver.ts`, die von Client Components importiert wurde. Diese Funktion importiert `queries.ts` (die `"server-only"` hat) – nicht erlaubt!

---

## 2. Lösung: Trennung in Separate Server-Only Datei

### 2.1 Neue Datei: `contact-cms-resolver.server.ts`

**Datei:** `src/lib/contact/contact-cms-resolver.server.ts`

```typescript
import "server-only"  // ← Explizit gekennzeichnet

export async function getContactFormBlockFromCMS(
  pageSlug: string,
  blockId: string,
  brand: BrandKey
): Promise<ContactFormBlock | null>
```

**Zweck:**
- Enthält **NUR** server-seitige Funktionen
- Importiert `queries.ts` (server-only)
- Darf nur in API Routes, Server Components verwendet werden

### 2.2 Gereinigte Datei: `contact-email-resolver.ts`

**Datei:** `src/lib/contact/contact-email-resolver.ts`

- ✅ `getContactFormBlockFromCMS()` entfernt
- ✅ `import type { ContactFormBlock, CMSPage }` entfernt
- ✅ Bleibt Client-safe (kein `"server-only"` am Anfang)
- ✅ Kann von Inspector importiert werden

### 2.3 API Handler aktualisiert

**Datei:** `src/app/api/contact/route.ts`

```typescript
// Importiert NUR aus server-only Dateien (API Route = Server!)
import { getContactFormBlockFromCMS } from "@/lib/contact/contact-cms-resolver.server"
import { resolveRecipientEmail } from "@/lib/contact/contact-email-resolver"
```

---

## 3. Weitere Build-Fehler behoben

### 3.1 TypeScript Ref-Error in Inspector

**Fehler:**
```typescript
ref={(el) => (fieldRefs.current["recipientEmail"] = el)}  // ← returns el, not void!
```

**Fix:**
```typescript
ref={(el) => {
  fieldRefs.current["recipientEmail"] = el  // ← returns void ✓
}}
```

### 3.2 Zod Type-Mismatch

**Fehler:** `.or(z.literal("")).transform()` Type-Mismatch

**Fix:** Nutze `.union()` statt `.or()` mit korrektem Type:
```typescript
phone: z
  .union([
    z.string()...transform(sanitizeString),
    z.literal(""),
  ])
  .optional()
  .transform((val) => (val === "" || !val ? undefined : val)),
```

### 3.3 Zod API Change

**Fehler:** `.errors` existiert nicht in neuerer Zod-Version

**Fix:** Nutze `.issues`:
```typescript
// ❌ result.error.errors.forEach(...)
// ✅ result.error.issues?.forEach(...)
```

---

## 4. Finale Architektur

```
┌─────────────────────────────────────────────────────────┐
│ CLIENT SIDE (Browser)                                   │
│                                                          │
│  ContactFormBlock (Client Component)                    │
│    └── sendet: { pageSlug, blockId, brand, ... }      │
│                                                          │
│  Inspector (Client Component)                           │
│    └── bearbeitet recipientEmail im Block              │
│    └── speichert in CMS (Supabase)                     │
└─────────────────────────────────────────────────────────┘
                          ↓
         POST /api/contact (Server!)
                          ↓
┌─────────────────────────────────────────────────────────┐
│ SERVER SIDE (API Route)                                 │
│                                                          │
│  src/app/api/contact/route.ts (Server!)               │
│    ├── validiert Form Data via contact-schema.ts      │
│    │                                                    │
│    ├── lädt CMS-Block serverseitig:                   │
│    │   import { getContactFormBlockFromCMS }          │
│    │     from "@/lib/contact/contact-cms-resolver.    │
│    │         server"  ← SERVER-ONLY!                  │
│    │                                                    │
│    ├── extrahiert recipientEmail aus Block            │
│    │                                                    │
│    └── resolveRecipientEmail():                        │
│        Testemails > CMS-Wert > ENV > Fallback        │
│                                                          │
│  Supabase (Datenbank)                                   │
│    └── lädt Page + Blocks (server-seitig)             │
│    └── recipientEmail ist von dort, nicht vom Client! │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Import-Struktur nach Fix

```
client-safe:
├── src/lib/contact/contact-email-resolver.ts
│   ├── isValidEmail()
│   ├── sanitizeEmail()
│   ├── resolveRecipientEmail()  ← Client kann nutzen
│   └── getTestEmail()
│
└── src/lib/contact/contact-rate-limit.ts
└── src/lib/contact/contact-honeypot.ts
└── src/lib/contact/contact-schema.ts
└── src/lib/contact/contact-mailer.ts
└── src/lib/contact/contact-brand.ts

server-only:
├── src/lib/contact/contact-cms-resolver.server.ts ← NEU
│   └── getContactFormBlockFromCMS()  ← Nur Server!
│       (importiert queries.ts mit "server-only")
│
└── src/app/api/contact/route.ts
    ├── importiert contact-cms-resolver.server.ts ✓
    ├── importiert contact-email-resolver.ts ✓
    └── nutzt beide zur Sicherheit
```

---

## 6. Geänderte / Neue Dateien

| Datei | Änderung | Grund |
|-------|----------|-------|
| `src/lib/contact/contact-cms-resolver.server.ts` | ➕ NEU | Server-only CMS-Ladefunktion |
| `src/lib/contact/contact-email-resolver.ts` | ♻️ gereinigt | Entfernt server-only Abhängigkeiten |
| `src/app/api/contact/route.ts` | ♻️ Update | Nutzt neue server-only Datei |
| `src/components/admin/editor/inspectors/ContactFormInspectorSection.tsx` | 🔧 Fix | Ref-Type korrigiert |
| `src/lib/contact/contact-schema.ts` | 🔧 Fix | Zod Union + .issues API |

---

## 7. Build Status

✅ **TypeScript Compilation:** PASSED  
✅ **Next.js Build:** PASSED  
✅ **Static Page Generation:** 30/30 pages  
✅ **API Routes:** All functional

---

## 8. Verifikation

### Sicherheit
- ✅ CMS-Ladefunktion ist `"server-only"`
- ✅ Kann nicht aus Client Components importiert werden
- ✅ API Route ist der alleinige "Gateway"

### Funktionalität
- ✅ Inspector speichert recipientEmail (Client-safe)
- ✅ API lädt Block serverseitig (Server-only)
- ✅ Email wird an korrekte Adresse versendet
- ✅ Kein "server-only" Import in Client Components

### Type Safety
- ✅ All TypeScript Errors behoben
- ✅ Zod Validierung korrekt
- ✅ Ref-Handler typsicher

---

Die Sicherheitsbehebung und Inspector-Integration sind jetzt **vollständig und build-ready!**
