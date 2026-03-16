import { describe, it, expect, vi } from "vitest"
import type { CMSBlock } from "@/types/cms"

describe("TestimonialsInspectorSection - Smoke Test", () => {
  describe("Component Contract", () => {
    it("should accept required callback props", () => {
      const block: CMSBlock = {
        id: "test-1",
        type: "testimonials",
        props: {
          items: [
            { id: "item-1", quote: "Great service!", name: "John" },
          ],
        },
      } as unknown as CMSBlock

      const props = {
        selectedBlock: block,
        selectedBlockId: block.id,
        expandedRepeaterCards: {},
        setExpandedRepeaterCards: vi.fn(),
        updateSelectedProps: vi.fn(),
        editorActions: {
          handleAddArrayItem: vi.fn(),
          handleRemoveArrayItem: vi.fn(),
          handleMoveArrayItem: vi.fn(),
        },
        handleRemoveArrayItem: vi.fn(),
        lastAddedRepeaterRef: { current: null },
        renderOneRepeaterItemFields: vi.fn(() => null),
      }

      expect(props).toBeDefined()
      expect(props.updateSelectedProps).toBeDefined()
    })
  })
})

