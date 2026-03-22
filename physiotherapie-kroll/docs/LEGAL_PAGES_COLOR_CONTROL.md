# Legal Pages Headline Color Control

**Datum:** 20. März 2026  
**Feature:** Farbkontrolle für Legal-Seiten Headlines  
**Status:** ✅ Implementiert

---

## 1. Übersicht

Die **Legal-Seiten** (Datenschutz, Cookies, Impressum) haben jetzt **vollständige Farbkontrolle** im Inspector für alle Texttypen:

- ✅ **Headline/Titel** – Hauptüberschrift
- ✅ **Subtitle/Untertitel** – Sekundärer Text
- ✅ **Eyebrow/Überzeile** – Obere Kleintextzeile

---

## 2. Implementierte Änderungen

### 2.1 LegalHero Komponente erweitert

**Datei:** `src/components/legal/LegalHero.tsx`

**Neue Props hinzugefügt:**
```typescript
export type LegalHeroProps = {
  // ... bestehende Props ...
  headlineColor?: string      // Titel-Farbe
  subtitleColor?: string      // Untertitel-Farbe
  eyebrowColor?: string       // Überzeile-Farbe
}
```

**Styling angepasst:**
```typescript
<h1 
  className="text-foreground ..."
  style={headlineColor ? { color: headlineColor } : undefined}
>
  {title}
</h1>
```

### 2.2 CMS-Typ erweitert

**Datei:** `src/types/cms.ts`

```typescript
export interface LegalHeroBlock extends BaseBlock {
  type: "legalHero"
  props: {
    // ... bestehende Props ...
    headlineColor?: string
    subtitleColor?: string
    eyebrowColor?: string
  }
}
```

### 2.3 Registry mit Inspector-Feldern

**Datei:** `src/cms/blocks/registry.ts`

**Inspector-Felder hinzugefügt (in `design` Gruppe):**
```typescript
{ key: "headlineColor", label: "Titel-Farbe", type: "color", group: "design" },
{ key: "subtitleColor", label: "Untertitel-Farbe", type: "color", group: "design" },
{ key: "eyebrowColor", label: "Überzeile-Farbe", type: "color", group: "design" },
```

**Zod-Schema aktualisiert:**
```typescript
const legalHeroPropsSchema = z.object({
  // ... bestehende Felder ...
  headlineColor: z.string().optional(),
  subtitleColor: z.string().optional(),
  eyebrowColor: z.string().optional(),
})
```

**Defaults hinzugefügt:**
```typescript
const legalHeroDefaults: LegalHeroBlock["props"] = {
  // ... bestehende Defaults ...
  headlineColor: undefined,
  subtitleColor: undefined,
  eyebrowColor: undefined,
}
```

---

## 3. Betroffene Legal-Seiten

Die Farbkontrolle wirkt sich auf alle Legal-Seiten aus:

- ✅ **Datenschutzerklärung** (`/datenschutz`)
- ✅ **Cookies** (`/cookies`)
- ✅ **Impressum** (`/impressum`)

---

## 4. Inspector Nutzung

### 4.1 Im Admin-Editor

1. Öffne eine Legal-Seite (z.B. Datenschutz)
2. Wähle den **"Seitenkopf"** Block
3. Im Inspector → **Design** Gruppe
4. Neue Farbfelder sichtbar:
   - **Titel-Farbe** (Hex-Picker)
   - **Untertitel-Farbe** (Hex-Picker)
   - **Überzeile-Farbe** (Hex-Picker)

### 4.2 Beispiel

```
Headline: "Datenschutzerklärung"
  Farbe: #1a1a1a (dunkelgrau für Kontrast)

Subtitle: "Stand: März 2026"
  Farbe: #666666 (mittleres Grau)

Eyebrow: "Rechtshinweis"
  Farbe: #FF6B35 (Brand-Orange)
```

---

## 5. Kompatibilität

✅ **Dark Mode kompatibel**
- Farben werden inline als `style` gesetzt
- Überschreiben das Default-Theme nicht
- Fall back zu `text-foreground` wenn keine Farbe gesetzt

✅ **Backwards compatible**
- Alte Legal-Seiten ohne Farben funktionieren weiterhin
- Alle neuen Props sind optional

✅ **Alle Browser**
- Hex-Farbwerte (#RRGGBB) sind in allen Browsern unterstützt

---

## 6. Technische Details

### Farbpriorität

```
1. Custom Color (Inspector): Wird angewendet via inline style
2. Tailwind Class (text-foreground): Standard Fallback
3. Dark Mode: Berücksichtigt durch colorScheme
```

### CSS Output (beispielsweise)

```css
/* Light Mode */
h1 {
  color: #1a1a1a;  /* von Inspector */
}

/* Dark Mode – wenn keine Custom Color */
@media (prefers-color-scheme: dark) {
  h1 {
    color: #ffffff;  /* von tailwind text-foreground */
  }
}
```

---

## 7. Geänderte Dateien

| Datei | Änderung | Zeilen |
|-------|----------|--------|
| `src/components/legal/LegalHero.tsx` | Props + Inline Styles | 3-48 |
| `src/types/cms.ts` | Type Definition | 999-1012 |
| `src/cms/blocks/registry.ts` | Schema, Defaults, Inspector | 1696-1706, 1774-1784, 3357-3369 |

---

## 8. Beispiel: Dual-Brand Konfiguration

Da Legal-Seiten zwischen Brands variieren könnten:

```
Physiotherapy Brand:
  Headline Color: #2563eb (Blue)

Physio-Konzept Brand:
  Headline Color: #7c3aed (Purple)
```

Dies ermöglicht visuell unterschiedliche Legal-Seiten pro Brand! 🎨

---

## 9. Testing

### Light Mode
1. Öffne eine Legal-Seite (z.B. Datenschutz)
2. Im Inspector: Stelle **Titel-Farbe** auf `#FF0000` (Rot)
3. Speichern
4. Front-End: Titel sollte jetzt rot sein ✓

### Dark Mode
1. Browser: Dark Mode aktivieren
2. Falls keine Custom Color gesetzt: sollte auf `text-foreground` (weiß) fallen ✓
3. Falls Custom Color: sollte diese respektieren ✓

---

Die **Legal-Seiten Headlines sind jetzt vollständig farbkonfigurierbar!** 🎉
