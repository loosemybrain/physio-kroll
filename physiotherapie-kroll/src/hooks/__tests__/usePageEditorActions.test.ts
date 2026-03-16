import { describe, it, expect, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { usePageEditorActions } from "../usePageEditorActions"
import type { CMSBlock, CMSPage } from "@/types/cms"
import type { BrandKey } from "@/components/brand/brandAssets"
import type { PageStatus } from "@/lib/cms/supabaseStore"

interface AdminPage extends CMSPage {
  brand: BrandKey
  status: PageStatus
  updatedAt: string
  navigation?: never
  footer?: never
  customFont?: never
}

function createMockPage(overrides?: Partial<AdminPage>): AdminPage {
  return {
    id: "page-1",
    title: "Test Page",
    slug: "test-page",
    brand: "physiotherapy" as BrandKey,
    status: "draft" as const,
    pageType: "default" as const,
    pageSubtype: null,
    blocks: [],
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function createMockBlock(type: CMSBlock["type"] = "text", id = "block-1"): CMSBlock {
  const baseBlock: Record<string, unknown> = {
    id,
    type,
    props: {},
  }

  if (type === "hero") {
    return {
      ...baseBlock,
      type: "hero",
      props: {
        mood: "physiotherapy",
        brandContent: {},
      },
    } as unknown as CMSBlock
  }

  if (type === "servicesGrid") {
    return {
      ...baseBlock,
      type: "servicesGrid",
      props: {
        cards: [],
      },
    } as unknown as CMSBlock
  }

  if (type === "courseSchedule") {
    return {
      ...baseBlock,
      type: "courseSchedule",
      props: {
        slots: [],
      },
    } as unknown as CMSBlock
  }

  return baseBlock as unknown as CMSBlock
}

describe("usePageEditorActions", () => {
  describe("addBlock()", () => {
    it("should add a new block to the page", () => {
      const page = createMockPage()
      let updatedPage = page
      const setPage = vi.fn((updater) => {
        updatedPage = updater(updatedPage) || updatedPage
      })
      const selectBlock = vi.fn()
      const selectField = vi.fn()
      const setActiveBrandTabForBlock = vi.fn()
      const setInitialLegalDefaultsActive = vi.fn()

      const addBlockFn = vi.fn(() => createMockBlock("text", "new-block"))

      const { result } = renderHook(() =>
        usePageEditorActions({
          current: updatedPage,
          setPage,
          selectedBlockId: null,
          activeFieldPath: null,
          isNewPage: false,
          initialLegalDefaultsActive: false,
          selectBlock,
          selectField,
          setActiveBrandTabForBlock,
          setInitialLegalDefaultsActive,
          addBlockFn,
        })
      )

      act(() => {
        result.current.addBlock("text")
      })

      expect(updatedPage.blocks.length).toBe(1)
      expect(updatedPage.blocks[0]?.type).toBe("text")
      expect(selectBlock).toHaveBeenCalledWith("new-block")
    })

    it("should select the new block after adding", () => {
      const page = createMockPage()
      let updatedPage = page
      const setPage = vi.fn((updater) => {
        updatedPage = updater(updatedPage) || updatedPage
      })
      const selectBlock = vi.fn()
      const selectField = vi.fn()
      const setActiveBrandTabForBlock = vi.fn()
      const setInitialLegalDefaultsActive = vi.fn()

      const addBlockFn = vi.fn(() => createMockBlock("hero", "hero-1"))

      const { result } = renderHook(() =>
        usePageEditorActions({
          current: updatedPage,
          setPage,
          selectedBlockId: null,
          activeFieldPath: null,
          isNewPage: false,
          initialLegalDefaultsActive: false,
          selectBlock,
          selectField,
          setActiveBrandTabForBlock,
          setInitialLegalDefaultsActive,
          addBlockFn,
        })
      )

      act(() => {
        result.current.addBlock("hero")
      })

      expect(selectBlock).toHaveBeenCalledWith("hero-1")
    })

    it("should apply props overrides when provided", () => {
      const page = createMockPage()
      let updatedPage = page
      const setPage = vi.fn((updater) => {
        updatedPage = updater(updatedPage) || updatedPage
      })
      const selectBlock = vi.fn()
      const selectField = vi.fn()
      const setActiveBrandTabForBlock = vi.fn()
      const setInitialLegalDefaultsActive = vi.fn()

      const newBlock = createMockBlock("courseSchedule", "course-1")
      const addBlockFn = vi.fn(() => newBlock)

      const { result } = renderHook(() =>
        usePageEditorActions({
          current: updatedPage,
          setPage,
          selectedBlockId: null,
          activeFieldPath: null,
          isNewPage: false,
          initialLegalDefaultsActive: false,
          selectBlock,
          selectField,
          setActiveBrandTabForBlock,
          setInitialLegalDefaultsActive,
          addBlockFn,
        })
      )

      act(() => {
        result.current.addBlock("courseSchedule", { mode: "timeline" })
      })

      expect(updatedPage.blocks[0]?.props).toEqual(expect.objectContaining({ mode: "timeline" }))
    })
  })

  describe("duplicateAt()", () => {
    it("should duplicate a block at the given index", () => {
      const block1 = createMockBlock("text", "block-1")
      const block2 = createMockBlock("hero", "block-2")
      const page = createMockPage({ blocks: [block1, block2] })
      let updatedPage = page
      const setPage = vi.fn((updater) => {
        updatedPage = updater(updatedPage) || updatedPage
      })
      const selectBlock = vi.fn()
      const selectField = vi.fn()
      const setActiveBrandTabForBlock = vi.fn()
      const setInitialLegalDefaultsActive = vi.fn()
      const addBlockFn = vi.fn()

      const { result } = renderHook(() =>
        usePageEditorActions({
          current: updatedPage,
          setPage,
          selectedBlockId: null,
          activeFieldPath: null,
          isNewPage: false,
          initialLegalDefaultsActive: false,
          selectBlock,
          selectField,
          setActiveBrandTabForBlock,
          setInitialLegalDefaultsActive,
          addBlockFn,
        })
      )

      act(() => {
        result.current.duplicateAt(0)
      })

      expect(updatedPage.blocks.length).toBe(3)
      expect(updatedPage.blocks[1]?.id).not.toBe("block-1")
      expect(updatedPage.blocks[1]?.type).toBe("text")
    })

    it("should place duplicated block after original", () => {
      const block1 = createMockBlock("text", "block-1")
      const page = createMockPage({ blocks: [block1] })
      let updatedPage = page
      const setPage = vi.fn((updater) => {
        updatedPage = updater(updatedPage) || updatedPage
      })
      const selectBlock = vi.fn()
      const selectField = vi.fn()
      const setActiveBrandTabForBlock = vi.fn()
      const setInitialLegalDefaultsActive = vi.fn()
      const addBlockFn = vi.fn()

      const { result } = renderHook(() =>
        usePageEditorActions({
          current: updatedPage,
          setPage,
          selectedBlockId: null,
          activeFieldPath: null,
          isNewPage: false,
          initialLegalDefaultsActive: false,
          selectBlock,
          selectField,
          setActiveBrandTabForBlock,
          setInitialLegalDefaultsActive,
          addBlockFn,
        })
      )

      act(() => {
        result.current.duplicateAt(0)
      })

      expect(updatedPage.blocks[0]?.id).toBe("block-1")
      expect(updatedPage.blocks[1]?.type).toBe("text")
      expect(updatedPage.blocks.length).toBe(2)
    })

    it("should select the duplicated block", () => {
      const block1 = createMockBlock("text", "block-1")
      const page = createMockPage({ blocks: [block1] })
      let updatedPage = page
      const setPage = vi.fn((updater) => {
        updatedPage = updater(updatedPage) || updatedPage
      })
      const selectBlock = vi.fn()
      const selectField = vi.fn()
      const setActiveBrandTabForBlock = vi.fn()
      const setInitialLegalDefaultsActive = vi.fn()
      const addBlockFn = vi.fn()

      const { result } = renderHook(() =>
        usePageEditorActions({
          current: updatedPage,
          setPage,
          selectedBlockId: null,
          activeFieldPath: null,
          isNewPage: false,
          initialLegalDefaultsActive: false,
          selectBlock,
          selectField,
          setActiveBrandTabForBlock,
          setInitialLegalDefaultsActive,
          addBlockFn,
        })
      )

      act(() => {
        result.current.duplicateAt(0)
      })

      expect(updatedPage.blocks.length).toBe(2)
      expect(updatedPage.blocks[0]?.id).toBe("block-1")
      expect(updatedPage.blocks[1]?.id).not.toBe("block-1")
    })
  })

  describe("moveBlockById()", () => {
    it("should move block up", () => {
      const block1 = createMockBlock("text", "block-1")
      const block2 = createMockBlock("hero", "block-2")
      const page = createMockPage({ blocks: [block1, block2] })
      let updatedPage = page
      const setPage = vi.fn((updater) => {
        updatedPage = updater(updatedPage) || updatedPage
      })
      const selectBlock = vi.fn()
      const selectField = vi.fn()
      const setActiveBrandTabForBlock = vi.fn()
      const setInitialLegalDefaultsActive = vi.fn()
      const addBlockFn = vi.fn()

      const { result } = renderHook(() =>
        usePageEditorActions({
          current: updatedPage,
          setPage,
          selectedBlockId: "block-2",
          activeFieldPath: null,
          isNewPage: false,
          initialLegalDefaultsActive: false,
          selectBlock,
          selectField,
          setActiveBrandTabForBlock,
          setInitialLegalDefaultsActive,
          addBlockFn,
        })
      )

      act(() => {
        result.current.moveBlockById("block-2", -1)
      })

      expect(updatedPage.blocks[0]?.id).toBe("block-2")
      expect(updatedPage.blocks[1]?.id).toBe("block-1")
    })

    it("should move block down", () => {
      const block1 = createMockBlock("text", "block-1")
      const block2 = createMockBlock("hero", "block-2")
      const page = createMockPage({ blocks: [block1, block2] })
      let updatedPage = page
      const setPage = vi.fn((updater) => {
        updatedPage = updater(updatedPage) || updatedPage
      })
      const selectBlock = vi.fn()
      const selectField = vi.fn()
      const setActiveBrandTabForBlock = vi.fn()
      const setInitialLegalDefaultsActive = vi.fn()
      const addBlockFn = vi.fn()

      const { result } = renderHook(() =>
        usePageEditorActions({
          current: updatedPage,
          setPage,
          selectedBlockId: "block-1",
          activeFieldPath: null,
          isNewPage: false,
          initialLegalDefaultsActive: false,
          selectBlock,
          selectField,
          setActiveBrandTabForBlock,
          setInitialLegalDefaultsActive,
          addBlockFn,
        })
      )

      act(() => {
        result.current.moveBlockById("block-1", 1)
      })

      expect(updatedPage.blocks[0]?.id).toBe("block-2")
      expect(updatedPage.blocks[1]?.id).toBe("block-1")
    })
  })

  describe("handleAddArrayItem()", () => {
    it("should add item to array in block props", () => {
      const block = createMockBlock("servicesGrid", "block-1")
      block.props = { cards: [] }
      const page = createMockPage({ blocks: [block] })
      let updatedPage = page
      const setPage = vi.fn((updater) => {
        updatedPage = updater(updatedPage) || updatedPage
      })
      const selectBlock = vi.fn()
      const selectField = vi.fn()
      const setActiveBrandTabForBlock = vi.fn()
      const setInitialLegalDefaultsActive = vi.fn()
      const addBlockFn = vi.fn()

      const { result } = renderHook(() =>
        usePageEditorActions({
          current: updatedPage,
          setPage,
          selectedBlockId: "block-1",
          activeFieldPath: null,
          isNewPage: false,
          initialLegalDefaultsActive: false,
          selectBlock,
          selectField,
          setActiveBrandTabForBlock,
          setInitialLegalDefaultsActive,
          addBlockFn,
        })
      )

      const newItem = { id: "card-1", icon: "star", title: "New Card", text: "Description" }
      act(() => {
        result.current.handleAddArrayItem("block-1", "cards", () => newItem)
      })

      expect((updatedPage.blocks[0]?.props as any)?.cards).toEqual([newItem])
    })

    it("should select first field of new item", () => {
      const block = createMockBlock("servicesGrid", "block-1")
      block.props = { cards: [] }
      const page = createMockPage({ blocks: [block] })
      let updatedPage = page
      const setPage = vi.fn((updater) => {
        updatedPage = updater(updatedPage) || updatedPage
      })
      const selectBlock = vi.fn()
      const selectField = vi.fn()
      const setActiveBrandTabForBlock = vi.fn()
      const setInitialLegalDefaultsActive = vi.fn()
      const addBlockFn = vi.fn()

      const { result } = renderHook(() =>
        usePageEditorActions({
          current: updatedPage,
          setPage,
          selectedBlockId: "block-1",
          activeFieldPath: null,
          isNewPage: false,
          initialLegalDefaultsActive: false,
          selectBlock,
          selectField,
          setActiveBrandTabForBlock,
          setInitialLegalDefaultsActive,
          addBlockFn,
        })
      )

      const newItem = { id: "card-1", icon: "star", title: "New Card", text: "Description" }
      act(() => {
        result.current.handleAddArrayItem("block-1", "cards", () => newItem)
      })

      expect(selectField).toHaveBeenCalledWith("block-1", "cards.0.title")
    })
  })

  describe("applyPageBrand() / handlePageBrandChange()", () => {
    it("should apply brand to page", () => {
      const page = createMockPage({ brand: "physiotherapy" })
      let updatedPage = page
      const setPage = vi.fn((updater) => {
        updatedPage = updater(updatedPage) || updatedPage
      })
      const selectBlock = vi.fn()
      const selectField = vi.fn()
      const setActiveBrandTabForBlock = vi.fn()
      const setInitialLegalDefaultsActive = vi.fn()
      const addBlockFn = vi.fn()

      const { result } = renderHook(() =>
        usePageEditorActions({
          current: updatedPage,
          setPage,
          selectedBlockId: null,
          activeFieldPath: null,
          isNewPage: false,
          initialLegalDefaultsActive: false,
          selectBlock,
          selectField,
          setActiveBrandTabForBlock,
          setInitialLegalDefaultsActive,
          addBlockFn,
        })
      )

      act(() => {
        result.current.applyPageBrand("physio-konzept")
      })

      expect(updatedPage.brand).toBe("physio-konzept")
    })

    it("should update hero block mood when applying brand", () => {
      const heroBlock = createMockBlock("hero", "hero-1") as any
      heroBlock.props = { mood: "physiotherapy", brandContent: {} }
      const page = createMockPage({ blocks: [heroBlock], brand: "physiotherapy" } as any)
      let updatedPage = page
      const setPage = vi.fn((updater) => {
        updatedPage = updater(updatedPage) || updatedPage
      })
      const selectBlock = vi.fn()
      const selectField = vi.fn()
      const setActiveBrandTabForBlock = vi.fn()
      const setInitialLegalDefaultsActive = vi.fn()
      const addBlockFn = vi.fn()

      const { result } = renderHook(() =>
        usePageEditorActions({
          current: updatedPage,
          setPage,
          selectedBlockId: null,
          activeFieldPath: null,
          isNewPage: false,
          initialLegalDefaultsActive: false,
          selectBlock,
          selectField,
          setActiveBrandTabForBlock,
          setInitialLegalDefaultsActive,
          addBlockFn,
        })
      )

      act(() => {
        result.current.applyPageBrand("physio-konzept")
      })

      expect((updatedPage.blocks[0]?.props as any)?.mood).toBe("physio-konzept")
    })

    it("handlePageBrandChange should call applyPageBrand for new pages", () => {
      const page = createMockPage()
      let updatedPage = page
      const setPage = vi.fn((updater) => {
        updatedPage = updater(updatedPage) || updatedPage
      })
      const selectBlock = vi.fn()
      const selectField = vi.fn()
      const setActiveBrandTabForBlock = vi.fn()
      const setInitialLegalDefaultsActive = vi.fn()
      const addBlockFn = vi.fn()

      const { result } = renderHook(() =>
        usePageEditorActions({
          current: updatedPage,
          setPage,
          selectedBlockId: null,
          activeFieldPath: null,
          isNewPage: true,
          initialLegalDefaultsActive: false,
          selectBlock,
          selectField,
          setActiveBrandTabForBlock,
          setInitialLegalDefaultsActive,
          addBlockFn,
        })
      )

      act(() => {
        result.current.handlePageBrandChange("physio-konzept")
      })

      expect(updatedPage.brand).toBe("physio-konzept")
    })
  })

  describe("handleRemoveArrayItem()", () => {
    it("should remove item from array", () => {
      const block = createMockBlock("servicesGrid", "block-1")
      block.props = {
        cards: [
          { id: "c1", icon: "star", title: "Card 1", text: "Desc 1" },
          { id: "c2", icon: "star", title: "Card 2", text: "Desc 2" },
        ],
      }
      const page = createMockPage({ blocks: [block] })
      let updatedPage = page
      const setPage = vi.fn((updater) => {
        updatedPage = updater(updatedPage) || updatedPage
      })
      const selectBlock = vi.fn()
      const selectField = vi.fn()
      const setActiveBrandTabForBlock = vi.fn()
      const setInitialLegalDefaultsActive = vi.fn()
      const addBlockFn = vi.fn()

      const { result } = renderHook(() =>
        usePageEditorActions({
          current: updatedPage,
          setPage,
          selectedBlockId: "block-1",
          activeFieldPath: null,
          isNewPage: false,
          initialLegalDefaultsActive: false,
          selectBlock,
          selectField,
          setActiveBrandTabForBlock,
          setInitialLegalDefaultsActive,
          addBlockFn,
        })
      )

      act(() => {
        result.current.handleRemoveArrayItem("block-1", "cards", 0)
      })

      expect((updatedPage.blocks[0]?.props as any)?.cards).toEqual([
        { id: "c2", icon: "star", title: "Card 2", text: "Desc 2" },
      ])
    })
  })
})
