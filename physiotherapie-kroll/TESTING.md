# CMS Testing Guide

## 🚀 Schnellstart

### 1. Development-Server starten

```bash
cd physiotherapie-kroll
npm run dev
```

Der Server läuft dann auf `http://localhost:3000`

### 2. Admin-Panel öffnen

Navigiere zu: **http://localhost:3000/admin/pages**

Du siehst die Pages-Übersicht (anfangs leer).

### 3. Neue Seite erstellen

1. Klicke auf **"New Page"** Button (oder navigiere zu `/admin/pages/new`)
2. Du landest im Page Editor

## 📝 Editor-Features testen

### A) Basis-Funktionen

1. **Seiten-Metadaten bearbeiten:**
   - Titel oben im Header ändern
   - Slug ändern
   - Brand wechseln (Physiotherapie ↔ Physio-Konzept)

2. **Blöcke hinzufügen:**
   - Rechts im Panel: "Add Blocks" Grid
   - Klicke auf einen Block-Typ (Hero, Text, Image+Text, Features, CTA)
   - Block erscheint im Preview

3. **Block auswählen:**
   - Klicke auf einen Block im Preview
   - Block wird mit blauem Ring markiert
   - Rechts erscheint der Inspector

### B) Generischer Inspector testen

**Für jeden Block-Typ werden automatisch die richtigen Felder angezeigt:**

#### Hero Block:
- Brand/Mood (Select)
- Headline (Text)
- Subheadline (Textarea)
- CTA Text (Text)
- CTA Link (URL)
- Media anzeigen (Checkbox)
- Media Typ (Select)
- Media URL (Image)

#### Text Block:
- Inhalt (Textarea - HTML möglich)
- Ausrichtung (Select)
- Maximale Breite (Select)
- Textgröße (Select)

#### Image+Text Block:
- Bild URL (Image)
- Bild Alt-Text (Text)
- Bildposition (Select)
- Überschrift (Text)
- Inhalt (Textarea)
- CTA Text & Link

#### Feature Grid:
- Spalten (Select)
- Features werden später erweitert

#### CTA Block:
- Headline (Text)
- Subheadline (Textarea)
- Primärer/Sekundärer CTA (Text + URL)
- Variante (Select)

### C) Live-Edit-Flow testen

1. **Click-to-Edit:**
   - Im Preview auf einen Text klicken (z.B. Headline, Subheadline, Content)
   - Der Inspector öffnet sich automatisch
   - Das entsprechende Feld wird fokussiert und hervorgehoben
   - Änderungen erscheinen sofort im Preview

2. **Hover-Effekte:**
   - Über einen Block hovern → Outline erscheint
   - Über editierbare Textfelder hovern → Highlight

3. **Auto-Focus:**
   - Nach Click-to-Edit scrollt der Inspector zum Feld
   - Feld wird fokussiert (Cursor blinkt)

### D) Validierung & Normalisierung testen

1. **Fehlende Felder:**
   - Lösche ein Pflichtfeld (z.B. `content` im Text-Block)
   - Speichere → Feld wird mit Default-Wert aufgefüllt

2. **Ungültige Werte:**
   - Ändere einen Select-Wert manuell im JSON (falls möglich)
   - Beim Laden wird der Wert normalisiert

3. **Defaults:**
   - Erstelle einen neuen Block
   - Alle Felder haben sofort Default-Werte
   - Keine leeren/undefined Felder

### E) Speichern & Veröffentlichen

1. **Save Draft:**
   - Klicke "Save draft" (oben rechts)
   - Seite wird im localStorage gespeichert
   - Status: "draft"

2. **Publish:**
   - Klicke "Publish"
   - Status: "published"
   - Seite erscheint in der Pages-Liste

3. **Zurück zur Liste:**
   - Klicke den Back-Button (←) oben links
   - Du siehst alle gespeicherten Pages

## 🔍 Debugging

### LocalStorage prüfen

1. Öffne Browser DevTools (F12)
2. Gehe zu "Application" → "Local Storage"
3. Suche nach Key: `physio-cms:v1`
4. Wert ist ein JSON mit allen Pages

### Console-Logs

- Öffne Browser Console
- Bei Validierungsfehlern erscheinen Warnungen
- Format: `Block {id} ({type}) validation failed, using defaults`

## 🧪 Test-Szenarien

### Szenario 1: Komplette Seite erstellen

1. Neue Seite: "Startseite"
2. Hero-Block hinzufügen
3. Headline: "Willkommen"
4. Subheadline: "Ihre Gesundheit steht im Mittelpunkt"
5. Text-Block hinzufügen
6. Content: `<p>Hier steht der Hauptinhalt...</p>`
7. CTA-Block hinzufügen
8. Headline: "Jetzt Termin vereinbaren"
9. Speichern & Veröffentlichen

### Szenario 2: Live-Edit testen

1. Erstelle Hero-Block
2. Klicke direkt auf "Ihre Gesundheit in besten Händen" im Preview
3. Inspector öffnet sich, Headline-Feld ist fokussiert
4. Ändere Text → Preview aktualisiert sich sofort
5. Klicke auf Subheadline im Preview
6. Subheadline-Feld wird fokussiert

### Szenario 3: Validierung testen

1. Erstelle Text-Block
2. Lösche den Content komplett
3. Speichere
4. Block wird mit Default-Content wiederhergestellt

### Szenario 4: Brand-Wechsel

1. Erstelle Seite mit Brand "Physiotherapie"
2. Hero-Block hat ruhiges Design
3. Wechsle Brand zu "Physio-Konzept"
4. Hero-Block wechselt zu energischem Design
5. Mood im Inspector passt sich an

## 📊 Erwartete Ergebnisse

✅ **Funktioniert:**
- Alle Block-Typen können erstellt werden
- Inspector zeigt korrekte Felder pro Block-Typ
- Click-to-Edit fokussiert das richtige Feld
- Änderungen erscheinen sofort im Preview
- Speichern funktioniert (localStorage)
- Validierung füllt fehlende Felder auf

❌ **Bekannte Limitationen:**
- Feature Grid: Features können noch nicht einzeln editiert werden (nur Spalten)
- Drag & Drop für Block-Reihenfolge fehlt noch
- Keine Bild-Upload-Funktion (nur URLs)

## 🎯 Nächste Schritte

Nach erfolgreichem Test:
1. Supabase-Integration aktivieren (falls gewünscht)
2. Features erweitern (z.B. Feature-Editor)
3. Drag & Drop implementieren
4. Bild-Upload hinzufügen
