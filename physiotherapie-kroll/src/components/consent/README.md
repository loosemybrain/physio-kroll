# Cookie Consent System

DSGVO/ePrivacy-konformes Cookie-Consent ohne LocalStorage für die Zustimmung (Cookie `pc_consent`).

## Produktive Kategorien

- **`necessary`**: immer aktiv (Speicherung der Auswahl).
- **`externalMedia`**: Opt-in für eingebettete Inhalte Dritter (z. B. Google Maps, Facebook).

Es gibt **keine** produktiven Kategorien `functional`, `analytics` oder `marketing`. Alte Cookies mit `functional` werden beim Lesen auf `externalMedia` gemappt; beim nächsten Speichern wird nur noch das schlanke Modell geschrieben.

### Abgrenzung Social-Link vs. Social-Embed

- **Footer Social-Links** (z. B. `https://facebook.com/...`) sind reine ausgehende Links und brauchen **kein** Consent-Gating.
- Dafür dürfen vor dem Klick keine externen Ressourcen geladen werden (kein SDK, kein iFrame, kein Pixel, kein Preconnect/dns-prefetch).
- **Social-Embeds** (Facebook-/Instagram-Plugin, iFrame o. a.) bleiben unter `externalMedia` und laufen über `ExternalMediaGate`.

## External Media Gate

Einbettungen, die externe `iframe`- oder Script-URLs nutzen, sollten über **`ExternalMediaGate`** bzw. die Hilfskomponenten **`GoogleMapsEmbed`** / **`FacebookEmbed`** laufen.

- **Nur globale, persistente Freigabe:** Sichtbarkeit der Kinder hängt ausschließlich von `hasConsent("externalMedia")` (Cookie) ab — kein separates Session- oder Einmal-Opt-in im Gate.
- **Kein `fallback`-Prop:** Eigene Fallback-Knoten könnten versehentlich externe Inhalte ohne Consent rendern; der Platzhalter ist fest im Gate definiert.
- **`GoogleMapsEmbed` / `FacebookEmbed`:** Prüfen URLs zentral (`validateExternalEmbedUrl.ts`); bei Fehler nur interne Hinweis-UI, kein iframe.

```tsx
import { GoogleMapsEmbed } from "@/components/embeds/GoogleMapsEmbed"

<GoogleMapsEmbed embedSrc="https://www.google.com/maps/embed?..." title="Standort" />
```

```tsx
import { FacebookEmbed } from "@/components/embeds/FacebookEmbed"

<FacebookEmbed embedSrc="https://www.facebook.com/plugins/page.php?..." />
```

Direkt mit Gate und eigenem Inhalt:

```tsx
import { ExternalMediaGate } from "@/components/embeds/ExternalMediaGate"

<ExternalMediaGate provider="google_maps">
  {/* Nur nach Zustimmung: iframe mit externer src */}
</ExternalMediaGate>
```

## Programmgesteuert

```tsx
import { useCookieConsent } from "@/components/consent/CookieProvider"

const { hasConsent } = useCookieConsent()

if (hasConsent("externalMedia")) {
  // externes Embed erlaubt
}
```

## Cookie-Format (Beispiel)

```json
{
  "v": 2,
  "necessary": true,
  "externalMedia": false,
  "ts": 1730000000000
}
```

Cookie-Name: `pc_consent`

## Komponenten

- `CookieProvider` / `useCookieConsent`
- `CookieBanner`
- `CookieSettingsDialog`
- `CookieFloatingButton`
- `CookiePreferencesLink`

## Server-seitig

`getConsentFromRequestCookies(cookieHeader)` in `@/lib/consent/cookie` — gleiche Migration wie im Browser.
