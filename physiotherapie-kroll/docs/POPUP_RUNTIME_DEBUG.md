# Popup Runtime Debug

## Benoetigte Supabase Views

- `popups_public`
- `popup_pages_public`

Beide muessen fuer den Public-Client (`anon`) lesbar sein.

## Benoetigte anon-Rechte

- `SELECT` auf `popups_public`
- `SELECT` auf `popup_pages_public`

Wenn eine View fehlt oder RLS/GRANT nicht passt, zeigt der Browser im Dev-Modus eine klare Fehlermeldung mit:

- `stage` (`all_pages`, `mapping`, `mapped_popups`)
- `tableOrView`
- `pageId`
- Supabase-Fehlerobjekt

## Browser-Check: Storage-Blockierung

Der Dismiss-Key lautet:

- `physio-kroll:popup-dismissed:v2:<popupId>:<updatedAt>`

Pruefen in DevTools:

- `localStorage` fuer `showOncePerBrowser`
- `sessionStorage` fuer `showOncePerSession`

Wenn ein Eintrag `1` vorhanden ist, wird das Popup als dismissed behandelt.

Manuell pruefen (Konsole):

```js
sessionStorage.getItem("physio-kroll:popup-dismissed:v2:<popupId>:<updatedAt>")
localStorage.getItem("physio-kroll:popup-dismissed:v2:<popupId>:<updatedAt>")
```

Bei Blockierung erscheint zusaetzlich: `[PopupRuntime] popup hidden: dismissed in storage` mit `via` und `dismissStorageKey`.

## Erwartete Console-Ausgaben (Dev)

Beim Laden:

- `[PopupRuntime] fetch result`
  - `pageId`
  - `pathname`
  - `candidatesCount`
  - `selectedPopupId`
  - `selectedPopupTriggerType`

Bei Sichtbarkeitsentscheidung:

- `[PopupRuntime] visibility`
  - `pageId`
  - `pathname`
  - `ready`
  - `open`
  - `candidatesCount`
  - `selectedPopupId`
  - `triggerType`
  - `shouldShow`
  - `dismissed`
  - `dismissedVia`
  - `dismissStorageKey`

Bei leerem Ergebnis nach DB-Fetch (Dev):

- `[popups-public] no popups after merge` — enthaelt `allPagesError`, `mappingError`, `mappedPopupsError`, Zaehlwerte.

Bei ungueltigen `popup_id` in der Mapping-View (Dev):

- `[popups-public] dropped invalid popup_id values (mapping)`
