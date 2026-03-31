# Embeds & Consent

Öffentliche Seiten, die **Google Maps**, **Facebook** oder andere Drittanbieter-Einbettungen zeigen, sollen **`GoogleMapsEmbed`**, **`FacebookEmbed`** oder **`ExternalMediaGate`** nutzen — nicht rohe `<iframe src="https://…">` ohne Gate.

## Aktueller Stand

- Beispiel-Komponenten: `GoogleMapsEmbed.tsx`, `FacebookEmbed.tsx`, `ExternalMediaGate.tsx`
- **CMS:** Produktive externe Einbettungen laufen über den Block-Typ **`externalEmbed`** (Whitelist-Provider, nur **Embed-URL**, kein iframe-HTML). Rendering zentral über **`CmsExternalEmbedRenderer`** → die Embed-Komponenten oben (inkl. Gate).

## CMS (strukturierte Embeds)

- Block-Typ: `externalEmbed` (`src/types/cms.ts`), Registry: `src/cms/blocks/registry.ts`.
- Felder: `provider` (`google_maps` | `facebook`), `embedUrl`, optional `title` / `description`.
- Kein freies HTML, kein paralleles Embed-System: neue Anbieter zuerst in `validateExternalEmbedUrl.ts` + `externalMediaProviders.ts` registrieren, dann Provider-Enum und UI-Whitelist erweitern.
- Entwurf speichern / Veröffentlichen: ungültige URLs werden abgelehnt bzw. im Publish-Validator gemeldet.

## Anforderung

Vor Cookie-Zustimmung zu `externalMedia`: keine externe `iframe`-`src`, keine externen Script-URLs, keine Provider-Preview-Bilder von Drittanbietern.

## URL-Validierung

- `src/lib/consent/validateExternalEmbedUrl.ts`: Google nur `https`, Host exakt `www.google.com` oder `google.com`, Pfad beginnt mit `/maps/embed`; Facebook nur `https`, Host `facebook.com` / `www` / `m`, Pfad `/plugins/…`.
- Ungültige URLs: `EmbedUrlInvalidNotice` (keine Netzwerkanfrage an den Anbieter).

## Scan-Hinweise (nicht produktiv unter `src/`)

- Ordner **`v0/`**: ältere Cookie-Typen (`analytics`/`marketing`) und Demos — nicht die Live-Consent-Architektur.
- **`dangerouslySetInnerHTML`** in CMS-Blöcken: kein Ersatz für das Embed-Gate; bei HTML aus dem CMS weiterhin Sanitization/Policy beachten (siehe Projekt-Audit-Docs).
