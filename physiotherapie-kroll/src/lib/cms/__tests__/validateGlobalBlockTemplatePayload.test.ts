import { describe, it, expect } from "vitest"
import {
  validateCreateGlobalBlockTemplateBody,
  validatePatchGlobalBlockTemplateBody,
  normalizeOptionalText,
} from "../validateGlobalBlockTemplatePayload"

describe("normalizeOptionalText", () => {
  it("maps whitespace to null", () => {
    expect(normalizeOptionalText("  ")).toBe(null)
  })
})

describe("validateCreateGlobalBlockTemplateBody", () => {
  it("rejects non-object sourceBlock", () => {
    const r = validateCreateGlobalBlockTemplateBody({
      name: "Test",
      sourceBlock: "nope",
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(400)
  })

  it("rejects empty sourceBlock.type", () => {
    const r = validateCreateGlobalBlockTemplateBody({
      name: "Test",
      sourceBlock: { id: "a", type: "", props: {} },
    })
    expect(r.ok).toBe(false)
  })

  it("accepts legalHero snapshot and derives blockType", () => {
    const r = validateCreateGlobalBlockTemplateBody({
      name: "Kopf",
      description: null,
      brand: "physiotherapy",
      pageType: "legal",
      pageSubtype: "imprint",
      sourceBlock: {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        type: "legalHero",
        props: { title: "Impressum" },
      },
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.blockType).toBe("legalHero")
      expect(r.value.sourceBlock.type).toBe("legalHero")
    }
  })

  it("defaults sourceBlock.props to {}", () => {
    const r = validateCreateGlobalBlockTemplateBody({
      name: "X",
      sourceBlock: { id: "b", type: "text" },
    })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.sourceBlock.props).toEqual({})
  })

  it("accepts arbitrary block type string", () => {
    const r = validateCreateGlobalBlockTemplateBody({
      name: "Y",
      sourceBlock: { type: "customFutureBlock", props: {} },
    })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.blockType).toBe("customFutureBlock")
  })
})

describe("validatePatchGlobalBlockTemplateBody", () => {
  it("rejects empty patch", () => {
    const r = validatePatchGlobalBlockTemplateBody({})
    expect(r.ok).toBe(false)
  })

  it("allows name-only patch", () => {
    const r = validatePatchGlobalBlockTemplateBody({ name: "Neu" })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.name).toBe("Neu")
  })
})
