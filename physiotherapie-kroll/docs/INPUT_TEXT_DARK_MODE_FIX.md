# Input-Text Dark Mode Visibility Fix

**Datum:** 20. März 2026  
**Problem:** Input-Inhalt in schwarz im Dark Mode unsichtbar  
**Status:** ✅ Behoben

---

## 1. Problem

Im **Dark Mode** war der eingegebene Text in den Input-Feldern **schwarz und damit unsichtbar**, weil:

- Die Input-Felder bekamen einen **dunklen Hintergrund** (Dark Mode Preset)
- Der **Text-Color war aber nicht angepasst** (weiterhin schwarz)
- Ergebnis: schwarzer Text auf dunkelgrauem Hintergrund = unsichtbar ❌

**Betroffene Felder:**
- Name
- Email
- Telefon
- Nachricht (Textarea)

**Ursache:**
```
Light Mode: 
  Input: bg-white, Text: black ✓

Dark Mode (vorher):
  Input: bg-gray-900, Text: black ✗ (UNSICHTBAR!)

Dark Mode (nachher):
  Input: bg-gray-900, Text: white ✓
```

---

## 2. Behobene Änderungen

### 2.1 FloatingLabelInputField - Dark Mode Text Color

**Datei:** `src/components/blocks/contact-form-block.tsx` (Line ~218)

```typescript
className={cn(
  "peer h-14 rounded-xl border-border/50 bg-background/50 px-4 pt-5 pb-2 text-base backdrop-blur-sm",
  "text-foreground dark:text-foreground",  // ← NEU: Text-Farbe auch im Dark Mode
  "transition-all duration-300 ease-out",
  // ... rest of classes
)}
```

**Effekt:**
- Light Mode: `text-foreground` = schwarzer Text (standard)
- Dark Mode: `dark:text-foreground` = weißer Text (sichtbar!)

### 2.2 FloatingLabelTextareaField - Dark Mode Text Color

**Gleiche Änderung für Textarea (Line ~326)**

```typescript
className={cn(
  "peer min-h-[160px] resize-none rounded-xl border-border/50 bg-background/50 px-4 pt-8 pb-3 text-base backdrop-blur-sm",
  "text-foreground dark:text-foreground",  // ← NEU
  // ... rest of classes
)}
```

### 2.3 Style-Logik: Nur bei Custom Color überschreiben

**Input Style Override (beide Layouts):**

```typescript
// VORHER:
const inputStyleOverrides: React.CSSProperties = {
  color: inputTextColor || undefined,  // ← Setzt immer, auch wenn nicht gesetzt
  backgroundColor: inputBgColor || undefined,
  borderColor: inputBorderColor || undefined,
}

// NACHHER:
const inputStyleOverrides: React.CSSProperties = {
  // Only set color if explicitly configured - otherwise use theme default (dark mode aware)
  ...(inputTextColor ? { color: inputTextColor } : {}),  // ← NUR wenn explizit gesetzt
  backgroundColor: inputBgColor || undefined,
  borderColor: inputBorderColor || undefined,
}
```

**Effekt:**
- Wenn Admin im CMS **keine** custom `inputTextColor` setzt → Theme-Farbe wird verwendet (Dark Mode aware)
- Wenn Admin **eine** custom `inputTextColor` setzt → Diese wird verwendet (auch im Dark Mode)

---

## 3. Was sich ändert

### Vorher (Dark Mode Problem)
```
User tippt in Email-Feld: "john@example.com"
Result im Dark Mode: Unsichtbar (schwarzer Text auf dunkelgrau)
```

### Nachher (Dark Mode Fixed)
```
User tippt in Email-Feld: "john@example.com"
Result im Dark Mode: ✓ Sichtbar (weißer Text auf dunkelgrau)
```

---

## 4. Technische Details

### Tailwind Classes verwendet

| Klasse | Light Mode | Dark Mode |
|--------|-----------|-----------|
| `text-foreground` | #000000 (schwarz) | #ffffff (weiß) |
| `dark:text-foreground` | ignoriert | #ffffff (weiß) |

### CSS-Rendering

```css
/* Light Mode */
.peer {
  color: var(--foreground);  /* = #000 */
  background-color: var(--background);  /* = #fff */
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  .peer {
    color: var(--foreground);  /* = #fff */
    background-color: var(--background);  /* = #1a1a1a */
  }
}
```

---

## 5. Testing-Anleitung

### 5.1 Light Mode
1. Browser: Light Mode
2. Kontaktformular öffnen
3. In Name-Feld tippen: "Test" → **Schwarz sichtbar** ✓

### 5.2 Dark Mode (neu behoben)
1. Browser: Dark Mode
2. Kontaktformular öffnen
3. In Name-Feld tippen: "Test" → **Weiß sichtbar** ✓

### 5.3 Mit Custom inputTextColor (CMS)
1. Im CMS: `inputTextColor` auf `#ff0000` (Rot) setzen
2. Dark Mode
3. In Name-Feld tippen: "Test" → **Rot sichtbar** ✓

---

## 6. Geänderte Code-Stellen

| Zeile | Komponente | Änderung |
|-------|-----------|----------|
| ~218 | FloatingLabelInputField | `text-foreground dark:text-foreground` |
| ~326 | FloatingLabelTextareaField | `text-foreground dark:text-foreground` |
| ~710-720 | Split Layout InputStyleOverrides | Conditional color assignment |
| ~945-955 | Stacked Layout InputStyleOverrides | Conditional color assignment |

---

## 7. Browser-Kompatibilität

✅ **Alle modernen Browser**
- Chrome / Edge / Brave
- Firefox
- Safari
- Mobile Safari

Nutzt Standard Tailwind Dark Mode + CSS `prefers-color-scheme`

---

## 8. Vor- und Nachteile

### Vorher
- ❌ Dark Mode: Text unsichtbar
- ✅ Light Mode: OK
- ❌ Schlechte UX

### Nachher
- ✅ Dark Mode: Text sichtbar
- ✅ Light Mode: Unverändert
- ✅ Excellent UX

---

Das Input-Text-Problem ist jetzt **vollständig gelöst**! Der Text ist in **beiden Modi sichtbar** und **korrekt farblich angepasst**. 🎉
