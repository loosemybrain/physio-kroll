# CMS-HTML Write-Sanitization (Persistenz)

## Zweck

Richtext-/HTML-Felder werden **vor dem Speichern** mit derselben Logik wie beim Rendern bereinigt (`sanitizeCmsHtml` → `cmsHtmlPolicy` + `sanitize-html`). **Render-Sanitization bleibt aktiv** (Defense-in-Depth).

## Wo es greift

| Pfad | Beschreibung |
|------|----------------|
| `src/lib/cms/supabaseStore.ts` → `upsertPage` | Vor `PUT /api/admin/pages/:id` (Entwurf, Veröffentlichen, Inspector-Persist u. a.) |
| `src/app/api/admin/pages/[id]/route.ts` → `PUT` | Unmittelbar vor DB-Insert der Blöcke (auch bei manipuliertem Request-Body) |

Zentrale Implementierung: **`src/lib/security/sanitizeCmsHtmlOnWrite.ts`**.

## Welche Felder werden sanitiziert

Nur explizit gemappte CMS-HTML-Pfade — **keine** pauschale Bearbeitung aller Strings.

| Block-Typ | Feldpfad | Profil |
|-----------|-----------|--------|
| `text` | `props.content` | `richText` |
| `faq` | `props.items[].answer` | `richText` |
| `legalSection` | `props.content` | `richText` |
| `featureGrid` | `props.features[].icon` | `inlineIcon` (SVG) |

**Nicht** automatisch angefasst u. a.:

- FAQ-**Fragen** (`items[].question`) — Plaintext im UI
- `externalEmbed`, URLs, strukturierte Legal-Richtext-Runs, Tabellenzellen, Hero-Titel, Section-Fließtext als Plaintext, Navigation, Footer (andere APIs)

## Altbestände

- **Keine** globale DB-Migration: bestehende Zeilen werden nur beim nächsten **Speichern** dieser Seite bereinigt.
- Optional später: Seiten einmal im Admin öffnen und speichern, oder ein separates Wartungsskript — bewusst nicht automatisiert.

## Logging

In `NODE_ENV === "development"` erscheint ein `console.debug`, **wenn** mindestens ein sanitiziertes Feld von der Rohfassung abwich.

## Verwandte Doku

- Allowlist / Render-Pfade: `CMS_HTML_SANITIZATION_REPORT.md`
- Policy: `cmsHtmlPolicy.ts`
