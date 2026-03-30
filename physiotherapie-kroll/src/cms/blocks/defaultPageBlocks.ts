/**
 * Default blocks for newly created pages by pageType / pageSubtype.
 * Used only when creating a new page; existing pages are never modified.
 */

import type { CMSBlock } from "@/types/cms"
import type { PageSubtype, PageType } from "@/types/cms"
import type { BrandKey } from "@/components/brand/brandAssets"
import { getBlockDefinition } from "./registry"
import { normalizeBlock } from "./normalize"
import { createLegalTableColumn, createLegalTableRow } from "./registry"
import { uuid } from "@/lib/cms/arrayOps"

function createBlock<T extends CMSBlock["type"]>(
  type: T,
  propsOverride?: Partial<Extract<CMSBlock, { type: T }>["props"]>
): CMSBlock {
  const def = getBlockDefinition(type)
  const defaults = def.defaults as Record<string, unknown>
  const props = JSON.parse(JSON.stringify(defaults)) as Record<string, unknown>
  if (propsOverride && typeof propsOverride === "object") {
    for (const [k, v] of Object.entries(propsOverride)) {
      if (v !== undefined) (props as Record<string, unknown>)[k] = v
    }
  }
  const block = { id: uuid(), type, props } as CMSBlock
  return normalizeBlock(block)
}

/** Block type sequence for each legal subtype (used to detect "still initial default" for subtype-change replacement). */
export const LEGAL_SUBTYPE_BLOCK_TYPES: Record<NonNullable<PageSubtype>, CMSBlock["type"][]> = {
  privacy: ["legalHero", "legalSection", "legalTable"],
  cookies: ["legalHero", "legalCookieCategories", "legalInfoBox"],
  imprint: ["legalHero", "legalContactCard", "legalSection"],
}

/**
 * Returns true only if blocks exactly match the default block type sequence for the given legal subtype.
 * Used to decide whether it is safe to replace blocks when the user switches pageSubtype (e.g. privacy → cookies).
 * Returns false if subtype is null, or if blocks have been modified (different count or types).
 */
export function doBlocksMatchDefaultLegalSet(blocks: CMSBlock[], subtype: PageSubtype): boolean {
  if (!subtype || !(subtype in LEGAL_SUBTYPE_BLOCK_TYPES)) return false
  const expected = LEGAL_SUBTYPE_BLOCK_TYPES[subtype as keyof typeof LEGAL_SUBTYPE_BLOCK_TYPES]
  if (!expected || blocks.length !== expected.length) return false
  return blocks.every((b, i) => b.type === expected[i])
}

/**
 * Returns default blocks for a new page, or null if the standard default (hero + text) should be used.
 * Only legal + privacy|cookies|imprint get custom blocks; default/landing and legal without subtype return null.
 */
export function getDefaultBlocksForPageType(
  pageType: PageType,
  pageSubtype: PageSubtype,
  _brand?: BrandKey
): CMSBlock[] | null {
  if (pageType !== "legal" || !pageSubtype) return null
  switch (pageSubtype) {
    case "privacy":
      return getDefaultBlocksPrivacy()
    case "cookies":
      return getDefaultBlocksCookies()
    case "imprint":
      return getDefaultBlocksImprint()
    default:
      return null
  }
}

function getDefaultBlocksPrivacy(): CMSBlock[] {
  const col1 = createLegalTableColumn()
  const col2 = createLegalTableColumn()
  const col3 = createLegalTableColumn()
  const col4 = createLegalTableColumn()
  const columns = [
    { ...col1, label: "Verarbeitung" },
    { ...col2, label: "Zweck" },
    { ...col3, label: "Rechtsgrundlage" },
    { ...col4, label: "Speicherdauer" },
  ]
  const rows = [createLegalTableRow(columns)]

  return [
    createBlock("legalHero", {
      title: "Datenschutzerklärung",
      eyebrow: "",
      subtitle: "",
      introText: "",
      alignment: "left",
      variant: "default",
    }),
    createBlock("legalSection", {
      title: "Allgemeine Hinweise",
      content:
        "<p>Die folgenden Abschnitte informieren Sie über die Verarbeitung personenbezogener Daten auf dieser Website.</p>",
      spacing: "md",
      containerMode: "transparent",
    }),
    createBlock("legalTable", {
      caption: "",
      columns,
      rows,
      variant: "default",
      zebra: true,
    }),
  ]
}

function getDefaultBlocksCookies(): CMSBlock[] {
  return [
    createBlock("legalHero", {
      title: "Cookie-Richtlinie",
      eyebrow: "",
      subtitle: "",
      introText: "",
      alignment: "left",
      variant: "default",
    }),
    createBlock("legalCookieCategories", {
      variant: "cards",
      categories: [
        {
          id: uuid(),
          name: "Notwendige Cookies",
          description: "Essenziell für die Grundfunktionen der Website.",
          required: true,
          cookies: [],
        },
        {
          id: uuid(),
          name: "Funktionale Cookies",
          description: "Ermöglichen erweiterte Funktionen und persönliche Einstellungen.",
          required: false,
          cookies: [],
        },
      ],
    }),
    createBlock("legalInfoBox", {
      variant: "info",
      headline: "Ihre Einwilligung",
      content: "Sie können Ihre Einwilligung zur Speicherung von Cookies jederzeit widerrufen oder anpassen.",
      spacingTop: "sm",
      spacingBottom: "sm",
    }),
  ]
}

function getDefaultBlocksImprint(): CMSBlock[] {
  return [
    createBlock("legalHero", {
      title: "Impressum",
      eyebrow: "",
      subtitle: "",
      introText: "",
      alignment: "left",
      variant: "default",
    }),
    createBlock("legalContactCard", {
      headline: "Verantwortliche Stelle",
      lines: [
        { id: uuid(), label: "Name", value: "" },
        { id: uuid(), label: "Anschrift", value: "" },
        { id: uuid(), label: "Kontakt", value: "" },
      ],
      variant: "default",
    }),
    createBlock("legalSection", {
      title: "Weitere Angaben",
      content: "<p>Weitere gesetzlich vorgesehene Angaben können Sie hier ergänzen.</p>",
      spacing: "md",
      containerMode: "transparent",
    }),
  ]
}
