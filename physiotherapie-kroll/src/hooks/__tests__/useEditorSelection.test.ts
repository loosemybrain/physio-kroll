import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useEditorSelection } from "../useEditorSelection"

describe("useEditorSelection", () => {
  describe("Initial State", () => {
    it("should start with no selection", () => {
      const { result } = renderHook(() => useEditorSelection())
      expect(result.current.selection.type).toBe("none")
      expect(result.current.selectedBlockId).toBeNull()
      expect(result.current.selectedElementId).toBeNull()
      expect(result.current.activeFieldPath).toBeNull()
    })

    it("should have correct derived values when no selection exists", () => {
      const { result } = renderHook(() => useEditorSelection())
      expect(result.current.hasSelection).toBe(false)
      expect(result.current.blockIdChanged.changed).toBe(false)
      expect(result.current.blockIdChanged.from).toBeNull()
      expect(result.current.blockIdChanged.to).toBeNull()
    })
  })

  describe("selectBlock()", () => {
    it("should select a block", () => {
      const { result } = renderHook(() => useEditorSelection())
      act(() => {
        result.current.selectBlock("block-123")
      })
      expect(result.current.selection.type).toBe("block")
      expect(result.current.selectedBlockId).toBe("block-123")
      expect(result.current.activeFieldPath).toBeNull()
      expect(result.current.selectedElementId).toBeNull()
    })

    it("should clear field and element selection when selecting a block", () => {
      const { result } = renderHook(() => useEditorSelection())
      act(() => {
        result.current.selectField("block-1", "title")
      })
      act(() => {
        result.current.selectBlock("block-2")
      })
      expect(result.current.selectedBlockId).toBe("block-2")
      expect(result.current.activeFieldPath).toBeNull()
    })

    it("should detect block change", () => {
      const { result } = renderHook(() => useEditorSelection())
      act(() => {
        result.current.selectBlock("block-A")
      })
      expect(result.current.blockIdChanged.changed).toBe(true) // First selection is always "changed" from null
      expect(result.current.blockIdChanged.to).toBe("block-A")
      expect(result.current.blockIdChanged.from).toBeNull()

      act(() => {
        result.current.selectBlock("block-B")
      })
      expect(result.current.blockIdChanged.changed).toBe(true)
      expect(result.current.blockIdChanged.from).toBe("block-A")
      expect(result.current.blockIdChanged.to).toBe("block-B")
    })
  })

  describe("selectField()", () => {
    it("should select a field in a block", () => {
      const { result } = renderHook(() => useEditorSelection())
      act(() => {
        result.current.selectField("block-1", "title")
      })
      expect(result.current.selection.type).toBe("field")
      expect(result.current.selectedBlockId).toBe("block-1")
      expect(result.current.activeFieldPath).toBe("title")
      expect(result.current.selectedElementId).toBeNull()
    })

    it("should clear element selection when selecting a field", () => {
      const { result } = renderHook(() => useEditorSelection())
      act(() => {
        result.current.selectElement("block-1", "elem-1")
      })
      act(() => {
        result.current.selectField("block-1", "description")
      })
      expect(result.current.activeFieldPath).toBe("description")
      expect(result.current.selectedElementId).toBeNull()
    })

    it("should support nested field paths", () => {
      const { result } = renderHook(() => useEditorSelection())
      act(() => {
        result.current.selectField("block-1", "cards.0.title")
      })
      expect(result.current.activeFieldPath).toBe("cards.0.title")
      expect(result.current.selectedBlockId).toBe("block-1")
    })
  })

  describe("selectElement()", () => {
    it("should select an element in a block", () => {
      const { result } = renderHook(() => useEditorSelection())
      act(() => {
        result.current.selectElement("block-1", "elem-abc")
      })
      expect(result.current.selection.type).toBe("element")
      expect(result.current.selectedBlockId).toBe("block-1")
      expect(result.current.selectedElementId).toBe("elem-abc")
      expect(result.current.activeFieldPath).toBeNull()
    })

    it("should deselect element when passed empty string", () => {
      const { result } = renderHook(() => useEditorSelection())
      act(() => {
        result.current.selectElement("block-1", "elem-1")
      })
      act(() => {
        result.current.selectElement("block-1", "")
      })
      expect(result.current.selection.type).toBe("block")
      expect(result.current.selectedBlockId).toBe("block-1")
      expect(result.current.selectedElementId).toBeNull()
    })
  })

  describe("deselectElement()", () => {
    it("should go back to block selection", () => {
      const { result } = renderHook(() => useEditorSelection())
      act(() => {
        result.current.selectElement("block-1", "elem-1")
      })
      act(() => {
        result.current.deselectElement("block-1")
      })
      expect(result.current.selection.type).toBe("block")
      expect(result.current.selectedBlockId).toBe("block-1")
      expect(result.current.selectedElementId).toBeNull()
    })

    it("should keep block selected", () => {
      const { result } = renderHook(() => useEditorSelection())
      act(() => {
        result.current.selectBlock("block-1")
      })
      act(() => {
        result.current.deselectElement("block-1")
      })
      expect(result.current.selectedBlockId).toBe("block-1")
    })
  })

  describe("Helper methods", () => {
    it("isBlockSelected should correctly identify block selection", () => {
      const { result } = renderHook(() => useEditorSelection())
      act(() => {
        result.current.selectBlock("block-1")
      })
      expect(result.current.isBlockSelected("block-1")).toBe(true)
      expect(result.current.isBlockSelected("block-2")).toBe(false)
    })

    it("isFieldSelected should correctly identify field selection", () => {
      const { result } = renderHook(() => useEditorSelection())
      act(() => {
        result.current.selectField("block-1", "title")
      })
      expect(result.current.isFieldSelected("block-1", "title")).toBe(true)
      expect(result.current.isFieldSelected("block-1", "description")).toBe(false)
      expect(result.current.isFieldSelected("block-2", "title")).toBe(false)
    })

    it("isElementSelected should correctly identify element selection", () => {
      const { result } = renderHook(() => useEditorSelection())
      act(() => {
        result.current.selectElement("block-1", "elem-1")
      })
      expect(result.current.isElementSelected("block-1", "elem-1")).toBe(true)
      expect(result.current.isElementSelected("block-1", "elem-2")).toBe(false)
      expect(result.current.isElementSelected("block-2", "elem-1")).toBe(false)
    })

    it("hasSelection should reflect presence of selection", () => {
      const { result } = renderHook(() => useEditorSelection())
      expect(result.current.hasSelection).toBe(false)
      act(() => {
        result.current.selectBlock("block-1")
      })
      expect(result.current.hasSelection).toBe(true)
      act(() => {
        result.current.clearSelection()
      })
      expect(result.current.hasSelection).toBe(false)
    })
  })

  describe("Block selection semantics", () => {
    it("should track real block switches", () => {
      const { result } = renderHook(() => useEditorSelection())
      act(() => {
        result.current.selectBlock("block-A")
      })
      // First selection is always "changed" from previous null
      expect(result.current.blockIdChanged.changed).toBe(true)
      expect(result.current.blockIdChanged.from).toBeNull()
      expect(result.current.blockIdChanged.to).toBe("block-A")

      act(() => {
        result.current.selectBlock("block-B")
      })
      expect(result.current.blockIdChanged.changed).toBe(true)
      expect(result.current.blockIdChanged.from).toBe("block-A")
      expect(result.current.blockIdChanged.to).toBe("block-B")

      act(() => {
        result.current.selectBlock("block-C")
      })
      expect(result.current.blockIdChanged.changed).toBe(true)
      expect(result.current.blockIdChanged.from).toBe("block-B")
      expect(result.current.blockIdChanged.to).toBe("block-C")
    })

    it("should not mark as changed if selecting same block again", () => {
      const { result } = renderHook(() => useEditorSelection())
      act(() => {
        result.current.selectBlock("block-1")
      })
      act(() => {
        result.current.selectBlock("block-1")
      })
      expect(result.current.blockIdChanged.changed).toBe(false)
    })

    it("field path should reset when switching blocks", () => {
      const { result } = renderHook(() => useEditorSelection())
      act(() => {
        result.current.selectField("block-1", "title")
      })
      expect(result.current.activeFieldPath).toBe("title")

      act(() => {
        result.current.selectBlock("block-2")
      })
      expect(result.current.activeFieldPath).toBeNull()
    })
  })

  describe("clearSelection and setSelection", () => {
    it("should clear all selection", () => {
      const { result } = renderHook(() => useEditorSelection())
      act(() => {
        result.current.selectBlock("block-1")
      })
      act(() => {
        result.current.clearSelection()
      })
      expect(result.current.selection.type).toBe("none")
      expect(result.current.hasSelection).toBe(false)
    })

    it("setSelection should allow direct state updates", () => {
      const { result } = renderHook(() => useEditorSelection())
      act(() => {
        result.current.setSelection({ type: "field", blockId: "b1", fieldPath: "f1" })
      })
      expect(result.current.selection.type).toBe("field")
      expect(result.current.selectedBlockId).toBe("b1")
      expect(result.current.activeFieldPath).toBe("f1")
    })
  })
})
