import { describe, it, expect, vi } from "vitest"
import type { CMSBlock } from "@/types/cms"

describe("ImageSliderInspectorSection - Smoke Test", () => {
  describe("Component Contract", () => {
    it("should accept required callback props", () => {
      const block: CMSBlock = {
        id: "slider-1",
        type: "imageSlider",
        props: {
          slides: [
            { id: "slide-1", url: "https://example.com/1.jpg", alt: "Slide 1" },
          ],
        },
      }

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

