import { describe, expect, it } from "vitest"
import type { CMSBlock } from "@/types/cms"
import { reorderLegalSections } from "@/lib/cms/reorderLegalSections"

function block(type: CMSBlock["type"], id: string): CMSBlock {
  return { id, type, props: {} } as CMSBlock
}

describe("reorderLegalSections", () => {
  it("keeps non-sortable legal blocks in fixed slots", () => {
    const blocks: CMSBlock[] = [
      block("legalHero", "hero"),
      block("legalSection", "a"),
      block("legalTable", "table"),
      block("legalSection", "b"),
      block("legalInfoBox", "info"),
      block("legalSection", "c"),
    ]

    const next = reorderLegalSections(blocks, "c", "a")
    expect(next.map((b) => b.id)).toEqual(["hero", "c", "table", "a", "info", "b"])
  })

  it("returns unchanged when active/over are equal or invalid", () => {
    const blocks: CMSBlock[] = [block("legalSection", "a"), block("legalSection", "b")]
    expect(reorderLegalSections(blocks, "a", "a")).toBe(blocks)
    expect(reorderLegalSections(blocks, "x", "b")).toBe(blocks)
  })

  it("does not reorder when one target is non-legalSection", () => {
    const blocks: CMSBlock[] = [block("legalSection", "a"), block("legalTable", "t"), block("legalSection", "b")]
    const next = reorderLegalSections(blocks, "a", "t")
    expect(next).toBe(blocks)
  })
})

