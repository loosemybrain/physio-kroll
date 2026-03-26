import sanitizeHtml, { type IOptions } from "sanitize-html"

export type CmsHtmlProfile = "richText" | "inlineIcon"

function isSafeHref(href: string): boolean {
  const v = href.trim()
  if (!v) return false

  // Allow relative URLs + in-page anchors.
  if (v.startsWith("/") || v.startsWith("./") || v.startsWith("../") || v.startsWith("#") || v.startsWith("?")) {
    return true
  }

  // Allow only explicitly safe schemes.
  const lower = v.toLowerCase()
  return (
    lower.startsWith("http://") ||
    lower.startsWith("https://") ||
    lower.startsWith("mailto:") ||
    lower.startsWith("tel:")
  )
}

function normalizeRel(rel: string | undefined): string {
  const parts = (rel || "")
    .split(/\s+/)
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean)
  const set = new Set(parts)
  set.add("noopener")
  set.add("noreferrer")
  return Array.from(set).join(" ")
}

function richTextOptions(): IOptions {
  return {
    allowedTags: [
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
    ],
    disallowedTagsMode: "discard",
    allowedAttributes: {
      a: ["href", "name", "target", "rel", "title"],
      "*": ["class"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    transformTags: {
      a: (_tagName, attribs) => {
        const next = { ...attribs }

        if (typeof next.href === "string" && !isSafeHref(next.href)) {
          delete next.href
        }

        if (typeof next.target === "string") {
          const t = next.target.toLowerCase()
          if (t !== "_blank" && t !== "_self") {
            delete next.target
          }
        }

        // If a link opens a new tab, enforce safe rel attributes.
        if (next.target === "_blank") {
          next.rel = normalizeRel(next.rel)
        } else if (typeof next.rel === "string") {
          // Normalize even without target to avoid weird values.
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

function iconOptions(): IOptions {
  return {
    allowedTags: ["svg", "g", "path", "circle", "rect", "line", "polyline", "polygon", "title", "desc", "defs", "use"],
    disallowedTagsMode: "discard",
    // No inline style. No external hrefs.
    allowedAttributes: {
      svg: ["viewBox", "width", "height", "fill", "stroke", "stroke-width", "xmlns", "aria-hidden", "role", "focusable", "class"],
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
        const href = typeof next.href === "string" ? next.href : typeof next["xlink:href"] === "string" ? next["xlink:href"] : null
        // Allow only internal fragment references like "#icon".
        if (href && !href.trim().startsWith("#")) {
          delete next.href
          delete next["xlink:href"]
        }
        return { tagName: "use", attribs: next }
      },
      svg: (_tagName, attribs) => {
        const next = { ...attribs }
        // Avoid accidental external namespace tricks; keep xmlns only if it looks standard.
        if (typeof next.xmlns === "string" && next.xmlns !== "http://www.w3.org/2000/svg") {
          delete next.xmlns
        }
        return { tagName: "svg", attribs: next }
      },
    },
  }
}

export function sanitizeCmsHtml(input: string, profile: CmsHtmlProfile = "richText"): string {
  const html = typeof input === "string" ? input : ""
  if (!html) return ""

  const options = profile === "inlineIcon" ? iconOptions() : richTextOptions()
  return sanitizeHtml(html, options)
}

