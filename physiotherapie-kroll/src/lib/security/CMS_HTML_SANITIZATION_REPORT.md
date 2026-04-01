# CMS-HTML-Sanitization – Bestandsaufnahme & Policy

**Persistenz:** Vor dem Speichern greift zusätzlich die Write-Sanitization — siehe `CMS_HTML_WRITE_SANITIZATION.md`.

## Produktive Pfade mit zentraler Sanitization

Diese Komponenten rendern CMS-Inhalt per `dangerouslySetInnerHTML` und rufen **`sanitizeCmsHtml`** (Allowlist in `cmsHtmlPolicy.ts`, Ausführung via `sanitize-html`) auf:

| Pfad | Profil | Inhalt |
|------|--------|--------|
| `src/components/blocks/text-block.tsx` | `richText` | Text-Block `content` |
| `src/components/blocks/faq-accordion.tsx` | `richText` | FAQ-Antwort `item.answer` |
| `src/components/blocks/LegalSection.tsx` | `richText` (Default) | Legal-Section `content` |
| `src/components/blocks/feature-grid-block.tsx` | `inlineIcon` | Feature-Icon-SVG `feature.icon` |

## Bewusst nicht auf HTML-Sanitization umgestellt

| Fundstelle | Einordnung |
|------------|------------|
| `src/app/konzept/layout.tsx`, `src/app/konzept/[slug]/layout.tsx` | Generiertes CSS (`style`), keine CMS-Richtext-Daten. |
| `src/components/ui/chart.tsx` | Interne Theme-CSS-Injection für Charts. |
| `src/components/admin/MfaEnrollDialog.tsx` | Admin-UI, QR/SVG aus kontrollierter Quelle. |
| `src/components/legal/LegalRichContentRenderer.tsx` | Strukturiertes JSON (Runs), kein rohes HTML; Links über `sanitizeLegalLinkHref`. |
| `src/components/blocks/section-block.tsx`, `image-text-block.tsx` u. a. | Fließtext wird als **Text** gerendert (`{content}`), nicht als HTML. |

## Entfernte / nicht durchgelassene Risiken (Richtext-Profil)

- **Tags:** u. a. `script`, `iframe`, `embed`, `object`, `frame`, `img`, `video`, `audio`, `form`, `input`, `style`, `link`, `meta`, `base` — nicht in der Allowlist → verworfen.
- **Attribute:** nur explizit erlaubt (`a`: href, name, target, rel, title; global: `class`). Keine `on*`-Handler.
- **Links:** Schemes eingeschränkt; `javascript:`, `data:`, `vbscript:` u. ä. werden in der Policy zusätzlich abgelehnt (`isSafeCmsRichTextHref`).
- **`target="_blank"`:** es werden `noopener` und `noreferrer` in `rel` ergänzt.

## Erlaubte Tags (Profil `richText`)

Siehe Export `CMS_RICHTEXT_ALLOWED_TAGS` in `cmsHtmlPolicy.ts` (u. a. `p`, `br`, `strong`, `em`, Überschriften, Listen, `blockquote`, `code`, `pre`, `a`, `span`, `div`, `hr`).

## Profil `inlineIcon`

Nur SVG-Teilmenge für Feature-Icons; `use`-Referenzen nur fragmentintern (`#…`).

## Offene / Follow-up

- Weitere Blöcke, die später auf Richtext-HTML umgestellt werden: vor Render **`sanitizeCmsHtml(…, "richText")`** verwenden, keine zweite Policy.
- Externe Embeds ausschließlich über strukturierte Embed-Blöcke, nicht über CMS-HTML erweitern.
