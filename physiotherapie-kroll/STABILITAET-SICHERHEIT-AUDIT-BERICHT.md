# Stabilitäts- und Sicherheitsdurchlauf – Abschlussbericht

**Projekt:** Physio-Kroll  
**Datum:** 2025-03-06  
**Regeln:** Nur echte Fehler/Sicherheitsprobleme behoben, keine Massen-Refactors, CMS/Admin/Block-Architektur unangetastet.

---

## 1. Behobene Probleme

| Datei | Problem | Fix | Risiko vorher |
|-------|---------|-----|----------------|
| `src/components/admin/ThemePresetSettings.tsx` | **Rules of Hooks**: `React.useMemo` wurde inside eines `.map()`-Callbacks aufgerufen (Zeile 632). Hooks müssen auf Top-Level der Komponente laufen. | Ein einziges `useMemo` auf Komponentenebene eingeführt, das für beide Brands die gefilterten/sortierten Presets berechnet (`filteredAndSortedPresetsByBrand`). Im `.map()` wird nur noch aus diesem Objekt gelesen. Keine Änderung an Props, State-Struktur oder Preset-Logik. | **Hoch**: Unvorhersehbares Laufzeitverhalten, mögliche Render-Fehler oder inkonsistente UI. |

---

## 2. Nicht behobene Probleme (mit Begründung)

| Datei / Bereich | Befund | Warum nicht geändert | Empfohlener nächster Schritt |
|-----------------|--------|----------------------|------------------------------|
| **XSS / dangerouslySetInnerHTML** | `text-block.tsx`, `feature-grid-block.tsx`, `faq-accordion.tsx` rendern CMS-HTML ungefiltert per `dangerouslySetInnerHTML`. | Sanitization (z. B. DOMPurify) wäre eine neue Dependency und Berührung mehrerer Blöcke; kein automatischer Eingriff ohne Absprache. | Optional: `isomorphic-dompurify` (oder `dompurify`) einführen und vor dem Setzen von `__html` in diesen drei Komponenten sanitizen. |
| **set-state-in-effect** | Lint-Warnung in `ElementTypographySection.tsx`, `InlineFieldEditor.tsx`, `TypographyInspectorSection.tsx`, `hero-section.tsx`, `ConsentGate.tsx`: setState synchron im Effect. | Refactor (z. B. kontrollierte Komponenten oder anderes Sync-Pattern) kann Verhalten und Abhängigkeiten verändern. Kein minimaler, eindeutig sicherer Fix. | Gezielt prüfen, ob kaskadierte Renders oder Flackern auftreten; bei Bedarf kleinstmögliche Anpassung (z. B. Sync nur bei tatsächlicher Prop-Änderung). |
| **ThemePresetSettings.tsx** | Unused eslint-disable für `react-hooks/exhaustive-deps` (ca. Zeile 453/475). | Nur Stil/Config; keine funktionale Auswirkung. | Optional: Direktive entfernen, wenn die Regel dort nicht mehr nötig ist. |
| **Lint: no-explicit-any / no-unused-vars** | Viele Stellen im Projekt (PageEditor, Blocks, Admin, Registry). | Flächendeckende Umstellung wäre Massen-Refactor zur Code-Ästhetik; Verbot laut Vorgabe. | Punktuell bei Touches verbessern; keine eigenständige Großaktion. |
| **next/image** | Einige `<img>`-Warnungen (z. B. BackgroundInspectorSection, ImageField, MediaLibrary, NavigationEditorClient, gallery-block, team-grid). | Ersetzung durch `next/image` kann Layout/Proportionen/SSR-Verhalten ändern; nicht ohne gezielte Tests. | Bei geplanten Änderungen an diesen Komponenten schrittweise auf `<Image />` umstellen. |

---

## 3. Sicherheitsstatus

### Kritische Findings
- **Keine.** `.env*` ist in `.gitignore`; Supabase Service Role wird nur server-seitig verwendet (`storage.server.ts`, `server.ts`, `pages/[id]/route.ts`).

### Wichtige Findings
- **XSS-Risiko**: CMS-Inhalte (Text-Block, Feature-Grid-Icon, FAQ-Antwort) werden ohne Sanitization als HTML gerendert. Risiko nur, wenn ein Angreifer CMS-Inhalte manipulieren kann (z. B. kompromittierter Admin). Sanitization wird empfohlen, wurde aber nicht automatisch eingebaut (siehe oben).
- **Admin-API**: Alle geprüften `/api/admin/*`-Routes (pages, pages/[id], theme-presets, section-presets, media/assets, media/folders, media/upload) prüfen Session/User (`getUser()` oder `requireSession()`) und antworten mit 401 bei fehlender Auth. Keine ungeschützten Admin-Endpunkte gefunden.

### Rest-Risiken
- Keine Middleware im Repo gefunden; Schutz erfolgt auf Route-/Handler-Ebene (Session-Check). Ausreichend, sofern alle Admin-Routen konsequent prüfen.
- CSP/Headers wurden nicht detailliert geprüft; bei Bedarf separater Security-Header-Check.

---

## 4. Kompatibilitäts-Selbstcheck

| Bereich | Änderung vorgenommen? | Details |
|---------|------------------------|--------|
| CMS-Schema | **Nein** | — |
| Inspector-Felder | **Nein** | — |
| Registry | **Nein** | — |
| BlockRenderer | **Nein** | — |
| PageEditor | **Nein** | — |
| Brand-/Theme-System | **Nein** | — |
| Supabase-Zugriff | **Nein** | — |
| CSP / Middleware / Headers | **Nein** | — |

**Einzige Änderung:** `ThemePresetSettings.tsx` – ausschließlich interne Berechnung der Preset-Liste (welche Presets pro Brand angezeigt werden). Keine Änderung an:
- API-Schnittstellen
- Preset-Datenstruktur oder -Speicherung
- Theme-Preset-Tokens oder Brand-State-Form
- UI-Props oder öffentlichen Komponenten-API

Rückwärtskompatibilität: **ja**.

---

## 5. Abschlussprüfung (Phase C)

- **TypeScript:** `npx tsc --noEmit` → Erfolg (Exit 0).
- **Build:** `npm run build` → Erfolg (Exit 0).
- **Lint:** Viele bestehende Warnungen/Errors (any, unused vars, set-state-in-effect, exhaustive-deps); **kein** neuer Fehler durch die durchgeführte Änderung. Der bisherige kritische Fehler (rules-of-hooks in ThemePresetSettings) ist behoben.

---

*Audit konservativ durchgeführt; nur der eindeutige Rules-of-Hooks-Fehler wurde behoben.*
