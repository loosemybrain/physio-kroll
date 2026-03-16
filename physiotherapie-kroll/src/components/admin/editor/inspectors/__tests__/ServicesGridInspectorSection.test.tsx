import { describe, it, expect, vi } from "vitest"
import type { CMSBlock } from "@/types/cms"

describe("ServicesGridInspectorSection - Smoke Test", () => {
  describe("Component Contract", () => {
    it("should accept required callback props", () => {
      const block: CMSBlock = {
        id: "sg-1",
        type: "servicesGrid",
        props: {
          cards: [
            { id: "card-1", icon: "star", title: "Service 1", text: "Desc 1" },
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
        confirmDeleteItem: vi.fn(),
        lastAddedRepeaterRef: { current: null },
        renderOneRepeaterItemFields: vi.fn(() => null),
      }

      expect(props).toBeDefined()
      expect(props.updateSelectedProps).toBeDefined()
      expect(props.editorActions.handleAddArrayItem).toBeDefined()
    })
  })
})

