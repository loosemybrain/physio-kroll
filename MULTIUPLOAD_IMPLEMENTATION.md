# Multi-Upload + Folder-Upload für Media Library

## Übersicht

Die Media Library wurde um Multi-Upload und optionalen Folder-Upload mit Concurrency-Limiting erweitert. Die Implementierung bietet:

✅ **Mehrere Dateien gleichzeitig** - Auswahl von bis zu N Dateien
✅ **Ordner-Upload** - Komplette Ordnerstruktur hochladen (Chromium)
✅ **Parallele Uploads** - Max 4 gleichzeitig (konfigurierbar)
✅ **Live-Fortschritt** - Status-Liste mit Erfolg/Fehler pro Datei
✅ **Fehler-Isolation** - Ein Fehler stoppt nicht die gesamte Queue
✅ **Keine Breaking Changes** - Bestehende Single-Upload bleibt unverändert

## Architektur

### 1. **Upload Concurrency Utility** (`src/lib/uploadConcurrency.ts`)

Kernfunktionen:

```typescript
// Hauptfunktion: Upload mit Concurrency-Limit
uploadWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>,
  onProgress?: (completed: number, total: number) => void
): Promise<void>

// Validierung vor Upload
validateUploadFiles(files: FileList | File[]): {
  valid: File[]
  errors: string[]
}

// Datei-Extraction mit Folder-Path Support
extractFilesFromInput(
  input: FileList | File[] | null | undefined,
  options?: { includeFolderPath?: boolean }
): { files: File[]; folderPaths?: Map<string, string> }
```

**Features:**
- Queue-basiertes System (kein Promise.all auf gesamtes Array)
- Fehler isoliert behandelt - Queue läuft weiter
- Optional: Progress-Callbacks
- Validierung: Dateisize (max 10MB), MIME-Types (image/video)

### 2. **MediaLibrary Komponente** (erweitert)

**Neue State:**
```typescript
const [uploadStatuses, setUploadStatuses] = React.useState<UploadStatus[]>([])
```

**Refactored Handler:**

```typescript
// Extrahierte Single-Upload Logik
handleUploadSingleFile(file: File): Promise<void>

// Neuer Multi-Upload Handler
handleFilesUpload(files: FileList | File[]): Promise<void>
  - Validierung
  - Status-Tracking pro Datei
  - Concurrency-Limited Queue
  - Auto-Reload nach Abschluss
  - Status-Anzeige für 3 Sekunden

// Bestehender Handler (für Single-Select)
handleUpload(file: File): Promise<void>
  - Unverändert, nutzt jetzt handleUploadSingleFile
```

**Neue UI:**

- **Upload Button** (wie vorher) - Multi-Select
- **Ordner Button** (neu) - Folder-Upload mit `webkitdirectory`
- **Status-Liste** - Live-Anzeige während Upload
  - Dateiname
  - Status Icon (⏳ pending, ⟳ uploading, ✓ success, ✕ error)
  - Error-Nachricht falls vorhanden
  - Zähler: "3 / 12 hochgeladen"

## Verwendung

### Normale Verwendung (ändert sich nicht)

```typescript
// Einzelne Datei wie bisher
<Button onClick={() => fileRef.current?.click()}>
  Hochladen
</Button>

<Input
  ref={fileRef}
  type="file"
  accept="image/*,video/*"
  multiple  // NEU: mehrere auf einmal erlaubt
  onChange={(e) => {
    const files = e.target.files
    if (files) handleFilesUpload(files)  // NEU: Multi-Handler
  }}
/>
```

### Folder-Upload (neu)

```typescript
<Button onClick={() => folderRef.current?.click()}>
  <Folder className="mr-2 h-4 w-4" />
  Ordner
</Button>

<Input
  ref={folderRef}
  type="file"
  accept="image/*,video/*"
  multiple
  webkitdirectory="true"  // Folder-Mode
  directory="true"         // Fallback
  onChange={(e) => {
    const files = e.target.files
    if (files) handleFilesUpload(files)
  }}
/>
```

## Validierung

Vor dem Upload werden Dateien validiert:

```
❌ Leere Auswahl → ignoriert
❌ Datei > 10MB → blockiert mit Fehlermeldung
❌ Nicht-Bild/Video → blockiert mit Fehlermeldung
❌ Leere Datei → blockiert mit Fehlermeldung
✅ Alles andere → hochgeladen
```

## Fehlerbehandlung

**Pro-Datei Fehler:**
- Werden in Status-Liste angezeigt
- Stoppt nicht die Queue
- Andere Dateien werden normal verarbeitet

**Beispiel:**
```
Datei 1 (image.jpg): ✓ Erfolg
Datei 2 (video.mp4): ✕ Fehler: Datei zu groß
Datei 3 (photo.png): ✓ Erfolg
```

## Concurrency-Limit

Standard: **4 parallele Uploads** (in `handleFilesUpload`)

```typescript
await uploadWithConcurrency(
  valid,
  4,  // ← änderbar hier
  async (file) => { ... }
)
```

Reasoning: Browser-HTTP/2 Connection Limits, Server-Ressourcen

## Browser-Support

| Feature | Chrome/Edge | Firefox | Safari |
|---------|-------------|---------|--------|
| Multi-Upload | ✅ | ✅ | ✅ |
| Folder-Upload | ✅ | ⚠️ partial | ⚠️ partial |

**Fallback:** Wenn `webkitdirectory` nicht unterstützt → normale Multi-Select

## Performance-Charakteristiken

- **15 Bilder à 2MB:**
  - Mit Concurrency=4: ~4-5 Wellen à 4 parallele → ~15-20 Sekunden
  - Vs. Sequential: ~45 Sekunden
  - Speedup: ~2-3x

- **Speicher:** Keine Datei-Duplikation im RAM (FileList referenziert Disk)
- **UI-Responsiveness:** Queue-basiert → UI bleibt responsive

## Wichtige Implementation Details

1. **Status-Tracking:** Eindeutige ID pro Datei (`${timestamp}-${index}`)
2. **Error-Isolation:** `.catch()` in Concurrency-Handler → Queue läuft weiter
3. **Auto-Reload:** `loadAssets()` nach allen Uploads
4. **Auto-Clear:** Status-Liste wird nach 3 Sekunden geleert
5. **No Breaking Changes:** `handleUpload(single)` bleibt unverändert

## Erweiterungspunkte

Optional später:

1. **Drag & Drop Multi:**
   ```typescript
   <div
     onDrop={(e) => handleFilesUpload(e.dataTransfer.files)}
     onDragOver={(e) => e.preventDefault()}
   >
   ```

2. **Folder-Path Speicherung:**
   ```typescript
   const { files, folderPaths } = extractFilesFromInput(files, { 
     includeFolderPath: true 
   })
   // Speichere folderPaths[fileName] als metadata
   ```

3. **Custom Concurrency Limit UI:**
   ```typescript
   <Select value={concurrencyLimit} onChange={setConcurrencyLimit}>
     <SelectItem value="2">2 parallel</SelectItem>
     <SelectItem value="4">4 parallel</SelectItem>
     <SelectItem value="8">8 parallel</SelectItem>
   </Select>
   ```

## Testing

Manual Testing Checklist:

- [ ] Single File Upload (existierende Logik)
- [ ] Multi-Select 5 Dateien → alle erfolgreich
- [ ] Multi-Select mit 1 ungültiger Datei → 4 hochgeladen, 1 Fehler
- [ ] Folder Upload (Chrome) → alle Dateien im Ordner hochgeladen
- [ ] Status-Liste sichtbar während Upload
- [ ] Status-Liste verschwindet nach 3 Sekunden
- [ ] Parallel-Limit testen (4 Dateien = 1 Welle, 8 Dateien = 2 Wellen)

## Code-Struktur

```
src/
├── lib/
│   └── uploadConcurrency.ts          ← Neue Utility
├── components/admin/
│   └── MediaLibrary.tsx               ← Erweitert
│       ├── handleUploadSingleFile()  ← Extrahiert
│       ├── handleFilesUpload()       ← Neu
│       └── Upload Status UI          ← Neu
```

## API-Integration

**Keine Änderungen nötig!**

- Bestehender Endpoint: `/api/admin/media/upload`
- Akzeptiert: `FormData` mit `file`, `brand`, `folderId` (optional)
- Multi-Upload macht multiple Requests (kein Batch-Upload)
- Folder-Struktur: Wird nicht repliziert (flache Liste)

## Zusammenfassung

✅ Erweiterung, kein Rewrite
✅ Concurrency-Limited mit Queue
✅ Fehler-Isolation
✅ Live-Progress UI
✅ Optional Folder-Upload
✅ Keine Breaking Changes
✅ Validierung mit sauberen Fehlern
✅ Keine neuen Dependencies
