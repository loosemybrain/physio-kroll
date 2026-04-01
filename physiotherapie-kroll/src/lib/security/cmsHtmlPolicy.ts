/**
 * Zentrale Allowlist für CMS-Richtext und CMS-Inline-SVG (Feature-Icons).
 * Basis: `sanitize-html` — keine Regex-basierte HTML-Bereinigung.
 *
 * Explizit nicht erlaubt (werden entfernt, u. a. weil nicht in `allowedTags`):
 * - script, iframe, embed, object, frame, meta, link, style, base, form, input, …
 * - Externe Medien-Einbettungen gehören in strukturierte Embed-Blöcke, nicht ins HTML.
 *
 * Gefährliche URL-Schemata für Links: nur http(s), mailto, tel sowie relative Pfade /
 * Anker (siehe `isSafeCmsRichTextHref` + erlaubte Schemes unten).
 */

import type { IOptions } from "sanitize-html"

/** Öffentliche Doku: erlaubte Tags für Profil `richText`. */
export const CMS_RICHTEXT_ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "s",
  "blockquote",
  "code",
  "pre",
  "ul",
  "ol",
  "li",
  "hr",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "a",
  "span",
  "div",
] as const

/** Attribute pro Tag bzw. `*` (nur class). Keine Event-Handler-Whitelist. */
export const CMS_RICHTEXT_ALLOWED_ATTRIBUTES: IOptions["allowedAttributes"] = {
  a: ["href", "name", "target", "rel", "title"],
  "*": ["class"],
}

/**
 * Prüft href vor dem Rendern (zusätzlich zu sanitize-html-Schemes).
 * Blockiert u. a. javascript:, data:, vbscript: und unbekannte Schemes.
 */
export function isSafeCmsRichTextHref(href: string): boolean {
  const v = href.trim()
  if (!v) return false

  const lower = v.toLowerCase()
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("file:") ||
    lower.startsWith("blob:")
  ) {
    return false
  }

  if (v.startsWith("/") || v.startsWith("./") || v.startsWith("../") || v.startsWith("#") || v.startsWith("?")) {
    return true
  }

  return (
    lower.startsWith("http://") ||
    lower.startsWith("https://") ||
    lower.startsWith("mailto:") ||
    lower.startsWith("tel:")
  )
}

function normalizeRelForCmsLink(rel: string | undefined): string {
  const parts = (rel || "")
    .split(/\s+/)
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean)
  const set = new Set(parts)
  set.add("noopener")
  set.add("noreferrer")
  return Array.from(set).join(" ")
}

/**
 * `sanitize-html`-Optionen für produktiven CMS-Richtext (Text-Block, FAQ-Antwort, Legal Section HTML, …).
 */
export function getCmsRichTextSanitizeOptions(): IOptions {
  return {
    allowedTags: [...CMS_RICHTEXT_ALLOWED_TAGS],
    disallowedTagsMode: "discard",
    allowedAttributes: CMS_RICHTEXT_ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      a: ["http", "https", "mailto", "tel"],
    },
    allowProtocolRelative: false,
    transformTags: {
      a: (_tagName, attribs) => {
        const next = { ...attribs }

        if (typeof next.href === "string" && !isSafeCmsRichTextHref(next.href)) {
          delete next.href
        }

        if (typeof next.target === "string") {
          const t = next.target.toLowerCase()
          if (t !== "_blank" && t !== "_self") {
            delete next.target
          }
        }

        if (next.target === "_blank") {
          next.rel = normalizeRelForCmsLink(next.rel)
        } else if (typeof next.rel === "string") {
          next.rel = next.rel
            .split(/\s+/)
            .map((p) => p.trim())
            .filter(Boolean)
            .slice(0, 10)
            .join(" ")
        }

        return { tagName: "a", attribs: next }
      },
    },
  }
}

/**
 * SVG-Inline-Icons aus dem CMS (Feature-Grid): kein freies HTML, eingeschränkte Tags/Attribute.
 */
export function getCmsInlineIconSanitizeOptions(): IOptions {
  return {
    allowedTags: ["svg", "g", "path", "circle", "rect", "line", "polyline", "polygon", "title", "desc", "defs", "use"],
    disallowedTagsMode: "discard",
    allowedAttributes: {
      svg: [
        "viewBox",
        "width",
        "height",
        "fill",
        "stroke",
        "stroke-width",
        "xmlns",
        "aria-hidden",
        "role",
        "focusable",
        "class",
      ],
      path: ["d", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "fill-rule", "clip-rule", "class"],
      g: ["fill", "stroke", "stroke-width", "class"],
      circle: ["cx", "cy", "r", "fill", "stroke", "stroke-width", "class"],
      rect: ["x", "y", "width", "height", "rx", "ry", "fill", "stroke", "stroke-width", "class"],
      line: ["x1", "y1", "x2", "y2", "stroke", "stroke-width", "class"],
      polyline: ["points", "fill", "stroke", "stroke-width", "class"],
      polygon: ["points", "fill", "stroke", "stroke-width", "class"],
      use: ["href", "xlink:href", "class"],
      title: ["class"],
      desc: ["class"],
      defs: ["class"],
      "*": ["class"],
    },
    allowedSchemes: ["http", "https"],
    allowProtocolRelative: false,
    transformTags: {
      use: (_tagName, attribs) => {
        const next = { ...attribs }
        const href =
          typeof next.href === "string" ? next.href : typeof next["xlink:href"] === "string" ? next["xlink:href"] : null
        if (href && !href.trim().startsWith("#")) {
          delete next.href
          delete next["xlink:href"]
        }
        return { tagName: "use", attribs: next }
      },
      svg: (_tagName, attribs) => {
        const next = { ...attribs }
        if (typeof next.xmlns === "string" && next.xmlns !== "http://www.w3.org/2000/svg") {
          delete next.xmlns
        }
        return { tagName: "svg", attribs: next }
      },
    },
  }
}
