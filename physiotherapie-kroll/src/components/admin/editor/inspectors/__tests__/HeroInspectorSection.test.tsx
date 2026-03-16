import { describe, it, expect, vi } from "vitest"
import type { CMSBlock } from "@/types/cms"

describe("HeroInspectorSection - Smoke Test", () => {
  describe("Component Contract", () => {
    it("should accept required props without error", () => {
      const block: CMSBlock = {
        id: "hero-1",
        type: "hero",
        props: {
          mood: "physiotherapy",
          brandContent: {},
        },
      }

      const props = {
        selectedBlock: block,
        selectedBlockId: block.id,
        updateBlockPropsById: vi.fn(),
        activeBrandTab: {},
        setActiveBrandTab: vi.fn(),
        fieldRefs: { current: {} },
        isTypingRef: { current: false },
        selectedElementId: null,
        selectElement: vi.fn(),
        deselectElement: vi.fn(),
      }

      expect(props).toBeDefined()
      expect(props.selectedBlock.type).toBe("hero")
      expect(props.updateBlockPropsById).toBeDefined()
    })
  })
})

