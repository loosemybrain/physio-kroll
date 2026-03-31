# Consent / External Media — Projektscan (Stand: Phase-2-Härtung)

## Produktiver Code unter `src/`

| Befund | Bewertung |
|--------|-----------|
| `ConsentGate` | Entfernt; keine Imports mehr. |
| `functional` / `analytics` / `marketing` in Consent-UI | Nur noch in `migrateConsent.ts` / Kommentaren als **Lesen** für Legacy-Cookies. |
| `hasConsent(` | Nur `CookieProvider`-intern und in Doku-Beispielen; Kategorie nur `externalMedia` / `necessary`. |
| Öffentliche `<iframe src=…>` | Nur in `GoogleMapsEmbed` / `FacebookEmbed` (nach Consent + Validierung). Admin-Preview iframe ist eigener Kontext. |
| Rohe Maps/Facebook-Embeds in CMS-Blöcken | Keine Treffer; bei künftigen Blöcken `GoogleMapsEmbed` / `FacebookEmbed` verwenden. |

## Nicht produktiv / Referenz

| Ort | Hinweis |
|-----|---------|
| `v0/components/cookie-consent/*` | Altes Muster mit `analytics`/`marketing` — parallel, nicht anbinden. |
| `v0/lib/legal-demo-data.tsx` | Demo-Daten mit Cookie-Kategorien. |
| `dangerouslySetInnerHTML` in Blöcken | Eigenes XSS-/Content-Thema; ersetzt **nicht** Consent für Drittanbieter-iframes. |

## Requests vor Consent

Solange `externalMedia` nicht gesetzt ist, rendern `GoogleMapsEmbed` / `FacebookEmbed` weder `iframe` noch `src` — damit lösen sie **keine** Ladeanfragen an Google/Facebook aus. Nach Zustimmung nur bei **bestandener** URL-Validierung.
