# Cookie Consent System

DSGVO/ePrivacy-konformes Cookie-Consent-System ohne LocalStorage.

## Verwendung

### ConsentGate für funktionelle Medien

Wrappe externe Inhalte (Maps, Videos, iframes) mit `ConsentGate`:

```tsx
import { ConsentGate } from "@/components/consent/ConsentGate"

// Beispiel: Google Maps
<ConsentGate category="functional">
  <iframe
    src="https://www.google.com/maps/embed?..."
    width="100%"
    height="450"
    style={{ border: 0 }}
    allowFullScreen
    loading="lazy"
  />
</ConsentGate>

// Beispiel: YouTube Video
<ConsentGate category="functional">
  <iframe
    src="https://www.youtube.com/embed/..."
    width="560"
    height="315"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
  />
</ConsentGate>
```

### Cookie-Einstellungen Link im Footer

```tsx
import { CookiePreferencesLink } from "@/components/consent/CookiePreferencesLink"

// Als Link
<CookiePreferencesLink />

// Als Button
<CookiePreferencesLink variant="button" />

// Mit eigenem Text
<CookiePreferencesLink>Datenschutz & Cookies</CookiePreferencesLink>
```

### Consent-Status prüfen (in Komponenten)

```tsx
"use client"
import { useCookieConsent } from "@/components/consent/CookieProvider"

export function MyComponent() {
  const { hasConsent } = useCookieConsent()
  
  if (hasConsent("functional")) {
    // Lade funktionelle Inhalte
  }
}
```

## Compliance-Features

✅ **Vorab-Block**: Keine nicht-notwendigen Cookies/Tracker vor Zustimmung  
✅ **Gleichwertige Buttons**: "Alle ablehnen" gleich prominent wie "Alle akzeptieren"  
✅ **Granularität**: Notwendig (immer an) + Funktional/Media (Opt-in)  
✅ **Keine Pre-Checked Toggles**: Nur "Notwendig" ist standardmäßig aktiv  
✅ **Widerruf jederzeit**: Footer-Link öffnet Settings-Dialog  
✅ **Cookie-basiert**: Kein LocalStorage, nur First-Party Cookie  
✅ **Brand-aware**: Passt sich an Physio/Konzept Design an  

## Cookie-Struktur

```json
{
  "v": 1,
  "necessary": true,
  "functional": false,
  "analytics": false,
  "marketing": false,
  "ts": 1234567890
}
```

Cookie-Name: `pc_consent`  
Max-Age: 180 Tage  
SameSite: Lax  
Secure: Nur in Production
