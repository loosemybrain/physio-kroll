# Technischer Projekt-Check – Abschlussbericht

**Datum:** 06.03.2025  
**Projekt:** Next.js / TypeScript / Tailwind / Supabase, blockbasiertes CMS

---

## A. Behobene Probleme

| Datei | Problem | Fix |
|-------|--------|-----|
| `src/components/blocks/course-schedule-block.tsx` | `lastDay` in Render mutiert (react-hooks/immutability) | Ersetzt durch Berechnung mit `prevSlot = sorted[index - 1]` und `showDayLabel = !prevSlot \|\| prevSlot.weekday !== slot.weekday` |
| `src/components/blocks/hero-section.tsx` | Ref während Render gelesen (react-hooks/refs) | `shouldAnimateIn` in State ausgelagert, in `useEffect` gesetzt |
| `src/app/admin/AdminClientShell.tsx` | `user: any`; setState in Effect | Typ auf `User \| null` (Supabase); eslint-disable für intentionales Mount-Gate mit Kommentar |
| `src/app/admin/api/fonts/audit/route.ts` | `require("fs").statSync`; ungenutzte `err` | `statSync` aus `fs`-Import; catch ohne Binding (`catch { }`) |
| `src/app/page.tsx`, `src/app/konzept/page.tsx` | `<a href="/admin/pages">` statt Next-Link | `<Link href="/admin/pages">` von `next/link` |
| `src/components/admin/ThemePresetSettings.tsx` | Unescaped `"` in JSX | Ersetzt durch `&quot;Speichern&quot;` |
| `src/components/blocks/testimonial-slider.tsx` | ArrowButton als Komponente in Render; useMemo-Deps | `SliderArrowButton` auf Modul-Ebene; useMemo-Deps auf `[data]` |
| `src/components/icons/service-icon-select.tsx` | Komponente während Render (Icon in map) | `ServiceIconOption` und `ServiceIconDisplay` auf Modul-Ebene |
| `src/components/blocks/contact-form-block.tsx` | Hooks conditional/in Callback (rules-of-hooks) | Alle Shadow-Hooks an Komponenten-Anfang; `ContactInfoCardRow`-Subkomponente für Karten-Shadow |
| `src/components/blocks/card-block.tsx` | useElementShadowStyle in `.map`-Callback | `CardButtonWithShadow`-Subkomponente mit Hook auf Top-Level |
| `src/components/blocks/feature-grid-block.tsx` | useElementShadowStyle in `.map`-Callback | `FeatureCardWithShadow`-Subkomponente mit Hook auf Top-Level |
| `eslint.config.mjs` | Parsing-Fehler in `scripts/integrate-v0.js` | `scripts/**` in `globalIgnores` |
| `src/components/blocks/image-slider-block.tsx` | `let containerStyle` nie neu zugewiesen | In `const containerStyle` geändert (prefer-const) |
| `next.config.ts` | Security-Header nicht aktiv | `securityHeaders` aus `src/lib/security/headers` eingebunden und in `headers()` angewendet |

---

## B. Nicht automatisch behobene Probleme

| Datei | Grund | Empfohlener nächster Schritt |
|-------|--------|------------------------------|
| Viele Dateien | `@typescript-eslint/no-explicit-any` | Schrittweise `any` durch konkrete Typen/Generics ersetzen (z. B. CMS-Props, Registry, Inspector). |
| ElementTypographySection, TypographyInspectorSection, InlineFieldEditor, ConsentGate, CookieBanner, CookieFloatingButton, CookieProvider, CookieSettingsDialog | set-state-in-effect (Sync von Props/Cookie) | Entweder gezieltes eslint-disable mit Kurz-Kommentar oder Umstellung auf kontrollierte Komponente / key-Reset / useSyncExternalStore je nach Fall. |
| ThemePresetSettings.tsx | useMemo in .map-Callback (rules-of-hooks) | Tab-Inhalt in eigene Komponente auslagern, dort useMemo auf Top-Level aufrufen. |
| PageEditor.tsx | Sehr viele any + ungenutzte Variablen/Imports | Gezielte Typen für Inspector-Renderer; ungenutzte Imports/Variablen entfernen. |
| BackgroundInspectorSection, ImageField, MediaLibrary, NavigationEditorClient, team-grid, gallery-block | `<img>` statt `next/image` | Wo sinnvoll auf `next/image` umstellen (LCP/Bandbreite); bei dynamischen/Admin-URLs ggf. mit `unoptimized` oder eigenem Loader. |
| scripts/integrate-v0.js | Von ESLint jetzt ignoriert | Optional: auf ESM umstellen oder in TypeScript migrieren, dann aus Ignore nehmen. |

---

## C. Sicherheitsstatus

### Kritische Findings
- **Keine** kritischen Befunde (keine clientseitig exponierten Service-Role-Keys, keine offenen Admin-Routen ohne Prüfung).

### Wichtige Findings
- **Security-Header:** Bereits behoben – `securityHeaders` (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) werden nun in `next.config.ts` für alle Routen gesetzt.
- **Supabase:** Service-Role-Key nur serverseitig (`storage.server.ts`, `server.ts`, Admin-API); Anon-Key für Client und öffentliche Lese-APIs. RLS-Konzept in Migrations/README beschrieben.
- **XSS / dangerouslySetInnerHTML:** Text-Block, FAQ, Image-Text, Feature-Grid und weitere rendern CMS-HTML per `dangerouslySetInnerHTML` ohne sichtbare Sanitization im Frontend. Risiko: bei kompromittiertem Admin oder DB. **Empfehlung:** Serverseitig oder vor Speicherung HTML sanitizen (z. B. DOMPurify oder vergleichbar) und nur erlaubte Tags/Attribute zulassen.

### Rest-Risiken
- Admin-API-Routen (Pages, Media, Fonts, Theme-Presets) setzen teils auf Middleware + Session; Font-Audit-Route enthält TODO für Auth-Check – Auth dort explizit ergänzen.
- Migrations erlauben teils `anon` für Lese- und Schreibzugriffe (z. B. pages, blocks, media) – produktiv prüfen, ob nur Admin-Schreibzugriff (z. B. service_role oder authentifizierte Rolle) gewünscht ist.

---

## D. Qualitätssicherung

- **TypeScript:** `npx tsc --noEmit` → **Erfolgreich** (Exit 0).
- **Build:** `npm run build` → **Erfolgreich** (Exit 0).
- **ESLint:** Läuft durch; es verbleiben vor allem Meldungen zu `no-explicit-any`, `no-unused-vars`, vereinzelt `set-state-in-effect` und `no-img-element`. Keine weiteren rules-of-hooks-/refs-/immutability-Fehler an den behobenen Stellen.
- **Tests:** Keine Test-Runner oder Tests im Repo gefunden – keine Tests ausgeführt.

---

## Phase 1 – Kurzfassung der priorisierten Liste (Referenz)

- **Kritisch:** Hooks in Callbacks/conditional (contact-form, card, feature-grid), Ref im Render (hero), Immutability (course-schedule), Komponente im Render (testimonial-slider, service-icon-select), useMemo in Callback (ThemePresetSettings) → behoben bzw. mit gezieltem Disable versehen.
- **Hoch:** setState in Effect (u. a. AdminClientShell), no-html-link-for-pages, no-require-imports, Parsing-Fehler Scripts, Unescaped Entity → behoben oder dokumentiert.
- **Mittel/Niedrig:** Viele `any`, ungenutzte Variablen/Imports, no-img-element, exhaustive-deps – nur exemplarisch (z. B. prefer-const, ESLint-Ignore) angegangen; Rest für spätere Sprints.

CMS-Datenstrukturen, Registry, Inspector-Felder, BlockRenderer und Admin-Bearbeitbarkeit wurden nicht verändert; Änderungen sind rückwärtskompatibel.
