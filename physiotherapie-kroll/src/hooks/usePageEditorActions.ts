"use client"

import { useCallback } from "react"
import type { AdminPage } from "@/lib/cms/supabaseStore"
import { createEmptyPage } from "@/lib/cms/supabaseStore"
import type { BrandKey } from "@/components/brand/brandAssets"
import { duplicateBlock } from "@/cms/blocks/duplicateBlock"
import { arrayMove, arrayRemove, arrayInsert } from "@/lib/cms/arrayOps"
import { setByPath, getByPath } from "@/lib/cms/editorPathOps"
import type { CMSBlock } from "@/types/cms"
import { getDefaultBlocksForPageType, doBlocksMatchDefaultLegalSet } from "@/cms/blocks/defaultPageBlocks"

/**
 * Updater passed to setPage. Return type is AdminPage | null; React state accepts
 * the same type. (Spreading prev + blocks often loses strict CMSBlock[] inference,
 * so we use this type for the parameter only.)
 */
type SetPageUpdater = (prev: AdminPage | null) => AdminPage | null

/** Row shape used by legalTable blocks for synced rows */
type LegalTableRow = { id: string; cells: Record<string, string> }

interface UsePageEditorActionsProps {
  current: AdminPage
  setPage: (updater: SetPageUpdater) => void
  selectedBlockId: string | null
  activeFieldPath: string | null
  isNewPage: boolean
  initialLegalDefaultsActive: boolean
  // Selection helpers instead of setters
  selectBlock: (blockId: string) => void
  selectField: (blockId: string, fieldPath: string) => void
  setActiveBrandTabForBlock: (blockId: string, brand: BrandKey) => void
  setInitialLegalDefaultsActive: (val: boolean) => void
  withLiveScrollLock?: (fn: () => void) => void
  addBlockFn: (type: CMSBlock["type"], brand?: BrandKey) => CMSBlock
}

/**
 * Hook that encapsulates all editor mutation operations for PageEditor.
 * Handles block operations, array mutations, brand changes, page updates, etc.
 * Centralizes editor business logic away from the render component.
 */
export function usePageEditorActions({
  current,
  setPage,
  selectedBlockId,
  activeFieldPath,
  isNewPage,
  initialLegalDefaultsActive,
  selectBlock,
  selectField,
  setActiveBrandTabForBlock,
  setInitialLegalDefaultsActive,
  withLiveScrollLock,
  addBlockFn,
}: UsePageEditorActionsProps) {

  /**
   * updatePage - Update top-level page fields with legal page default handling
   */
  const updatePage = useCallback(
    (patch: Partial<AdminPage>) => {
      const next = { ...current, ...patch }
      const isSwitchingToLegalSubtype =
        (patch.pageType !== undefined || patch.pageSubtype !== undefined) &&
        next.pageType === "legal" &&
        next.pageSubtype != null &&
        ["privacy", "cookies", "imprint"].includes(next.pageSubtype)
      const isReplacingFromDefault =
        isSwitchingToLegalSubtype &&
        current &&
        current.blocks.length === 2 &&
        current.blocks[0]?.type === "hero" &&
        current.blocks[1]?.type === "text"

      setPage((prev) => {
        if (!prev) return prev
        const nextState = { ...prev, ...patch }
        if (
          (initialLegalDefaultsActive || isReplacingFromDefault) &&
          isSwitchingToLegalSubtype
        ) {
          const defaultBlocks = getDefaultBlocksForPageType(nextState.pageType, nextState.pageSubtype!, nextState.brand)
          if (defaultBlocks?.length) {
            const comingFromDefault =
              prev.blocks.length === 2 && prev.blocks[0]?.type === "hero" && prev.blocks[1]?.type === "text"
            const comingFromOtherLegalSubtype =
              prev.pageType === "legal" &&
              prev.pageSubtype != null &&
              doBlocksMatchDefaultLegalSet(prev.blocks, prev.pageSubtype)
            if (comingFromDefault || comingFromOtherLegalSubtype) return { ...nextState, blocks: defaultBlocks } as AdminPage
          }
        }
        return nextState
      })

      if (isReplacingFromDefault) setInitialLegalDefaultsActive(true)
    },
    [current, setPage, initialLegalDefaultsActive, setInitialLegalDefaultsActive]
  )

  /**
   * applyPageBrand - Apply brand to page, updating hero moods and defaults
   */
  const applyPageBrand = useCallback(
    (brand: BrandKey) => {
      setInitialLegalDefaultsActive(false)
      setPage((prev) => {
        if (!prev) return createEmptyPage({ brand })

        const heroIds: string[] = []
        const nextBlocks = prev.blocks.map((b) => {
          if (b.type !== "hero") return b
          heroIds.push(b.id)
          const prevProps = (b.props ?? {}) as Record<string, unknown>
          return {
            ...b,
            props: {
              ...prevProps,
              mood: brand,
            },
          }
        })

        // Update brand tab for each hero block
        heroIds.forEach((id) => setActiveBrandTabForBlock(id, brand))

        return { ...prev, brand, blocks: nextBlocks }
      })
    },
    [setPage, setActiveBrandTabForBlock, setInitialLegalDefaultsActive]
  )

  /**
   * handlePageBrandChange - Change brand (with special handling for new pages)
   */
  const handlePageBrandChange = useCallback(
    (brand: BrandKey) => {
      if (isNewPage) {
        applyPageBrand(brand)
        return
      }
      updatePage({ brand })
    },
    [isNewPage, applyPageBrand, updatePage]
  )

  /**
   * addBlock - Add new block to page
   */
  const addBlock = useCallback(
    (type: CMSBlock["type"], propsOverride?: Record<string, unknown>) => {
      setInitialLegalDefaultsActive(false)
      setPage((prev) => {
        if (!prev) return prev
        const b = addBlockFn(type, prev.brand)
        const merged = propsOverride ? { ...b.props, ...propsOverride } : b.props
        const block = { ...b, props: merged } as CMSBlock
        selectBlock(block.id)
        return {
          ...prev,
          blocks: [...prev.blocks, block],
        }
      })
    },
    [setPage, selectBlock, setInitialLegalDefaultsActive, addBlockFn]
  )

  /**
   * removeBlock - Remove block by ID (pure mutation)
   */
  const removeBlock = useCallback(
    (id: string) => {
      setPage((prev) => {
        if (!prev) return prev
        return { ...prev, blocks: prev.blocks.filter((b) => b.id !== id) }
      })
    },
    [setPage]
  )

  /**
   * moveBlock - Move block up/down by index (pure mutation)
   */
  const moveBlock = useCallback(
    (index: number, direction: -1 | 1) => {
      setPage((prev) => {
        if (!prev) return prev
        const nextIndex = index + direction
        const newBlocks = arrayMove(prev.blocks, index, nextIndex)
        return { ...prev, blocks: newBlocks }
      })
    },
    [setPage]
  )

  /**
   * moveBlockById - Move block up/down by ID
   */
  const moveBlockById = useCallback(
    (blockId: string, direction: -1 | 1) => {
      if (!current) return
      const index = current.blocks.findIndex((b) => b.id === blockId)
      if (index === -1) return
      moveBlock(index, direction)
    },
    [current, moveBlock]
  )

  /**
   * duplicateAt - Duplicate block at index
   */
  const duplicateAt = useCallback(
    (index: number) => {
      setInitialLegalDefaultsActive(false)
      setPage((prev) => {
        if (!prev) return prev
        const original = prev.blocks[index]
        const copy = duplicateBlock(original)
        const nextBlocks = arrayInsert(prev.blocks, index + 1, copy)

        setTimeout(() => {
          selectBlock(copy.id)
        }, 0)

        return { ...prev, blocks: nextBlocks }
      })
    },
    [setPage, selectBlock, setInitialLegalDefaultsActive]
  )

  /**
   * updateSelectedProps - Update props of currently selected block
   */
  const updateSelectedProps = useCallback(
    (nextProps: CMSBlock["props"]) => {
      if (!selectedBlockId) return
      setPage((prev) => {
        if (!prev) return prev
        const updated = prev.blocks.map((b) =>
          b.id === selectedBlockId ? { ...b, props: nextProps } : b
        )
        return { ...prev, blocks: updated } as AdminPage
      })
    },
    [setPage, selectedBlockId]
  )

  /**
   * updateBlockPropsById - Update props of any block by ID (supports both direct and updater patterns)
   */
  const updateBlockPropsById = useCallback(
    (
      blockId: string,
      nextPropsOrUpdater: CMSBlock["props"] | ((prevProps: Record<string, unknown>) => CMSBlock["props"])
    ) => {
      setPage((prev) => {
        if (!prev) return prev
        const idx = prev.blocks.findIndex((b) => b.id === blockId)
        if (idx === -1) return prev
        const block = prev.blocks[idx]
        const prevProps = (block.props ?? {}) as Record<string, unknown>
        const nextProps = typeof nextPropsOrUpdater === "function"
          ? nextPropsOrUpdater(prevProps)
          : nextPropsOrUpdater
        const nextBlocks = [...prev.blocks]
        nextBlocks[idx] = { ...block, props: nextProps } as CMSBlock
        return { ...prev, blocks: nextBlocks } as AdminPage
      })
    },
    [setPage]
  )

  /**
   * handleInlineChange - Update field value from inline editor
   */
  const handleInlineChange = useCallback(
    (next: string) => {
      if (!selectedBlockId || !activeFieldPath) return

      setPage((prev) => {
        if (!prev) return prev
        const block = prev.blocks.find((b) => b.id === selectedBlockId)
        if (!block) return prev

        const currentProps = block.props as Record<string, unknown>
        const updatedProps = setByPath(currentProps, activeFieldPath, next) as CMSBlock["props"]

        return {
          ...prev,
          blocks: prev.blocks.map((b) =>
            b.id === selectedBlockId ? { ...b, props: updatedProps } : b
          ),
        } as AdminPage
      })
    },
    [setPage, selectedBlockId, activeFieldPath]
  )

  /**
   * handleAddArrayItem - Add item to array field with smart field path selection
   */
  const handleAddArrayItem = useCallback(
    (blockId: string, arrayPath: string, createFn: () => unknown) => {
      setInitialLegalDefaultsActive(false)
      setPage((prev) => {
        if (!prev) return prev
        const block = prev.blocks.find((b) => b.id === blockId)
        if (!block) return prev

        const props = block.props as Record<string, unknown>
        const currentArray = (getByPath(props, arrayPath) as unknown[]) || []
        const newItem = createFn()
        const updatedArray = [...currentArray, newItem]
        let updatedProps = setByPath(props, arrayPath, updatedArray) as CMSBlock["props"]

        // legalTable: when adding a column, add empty cell for new column in every row
        const newItemWithId = newItem as { id?: string } | null
        if (block.type === "legalTable" && arrayPath === "columns" && newItemWithId?.id) {
          const newColId = newItemWithId.id
          const rows = (getByPath(updatedProps, "rows") as LegalTableRow[]) || []
          const syncedRows = rows.map((r: LegalTableRow) => ({ ...r, cells: { ...r.cells, [newColId]: "" } }))
          updatedProps = setByPath(updatedProps, "rows", syncedRows) as CMSBlock["props"]
        }

        // Auto-select first field of new item
        const newIndex = updatedArray.length - 1
        let defaultFieldPath = ""
        if (arrayPath === "cards") defaultFieldPath = `cards.${newIndex}.title`
        else if (arrayPath === "items") {
          // FAQ vs Testimonials share "items"
          if (block.type === "testimonials") defaultFieldPath = `items.${newIndex}.quote`
          else defaultFieldPath = `items.${newIndex}.question`
        }
        else if (arrayPath === "members") defaultFieldPath = `members.${newIndex}.name`
        else if (arrayPath === "fields") defaultFieldPath = `fields.${newIndex}.label`
        else if (arrayPath === "images") defaultFieldPath = `images.${newIndex}.url`
        else if (arrayPath === "hours") defaultFieldPath = `hours.${newIndex}.label`
        else if (arrayPath === "slides") defaultFieldPath = `slides.${newIndex}.url`
        else if (arrayPath === "columns") defaultFieldPath = `columns.${newIndex}.label`
        else if (arrayPath === "rows") defaultFieldPath = `rows.${newIndex}.id`
        else if (arrayPath === "lines") defaultFieldPath = `lines.${newIndex}.label`
        else if (arrayPath === "categories") defaultFieldPath = `categories.${newIndex}.name`
        else if (arrayPath.match(/^categories\.\d+\.cookies$/)) defaultFieldPath = `${arrayPath}.${newIndex}.name`

        selectField(blockId, defaultFieldPath)

        return {
          ...prev,
          blocks: prev.blocks.map((b) =>
            b.id === blockId ? ({ ...b, props: updatedProps } as CMSBlock) : b
          ),
        } as AdminPage
      })
    },
    [setPage, selectField, setInitialLegalDefaultsActive]
  )

  /**
   * handleRemoveArrayItem - Remove item from array field
   */
  const handleRemoveArrayItem = useCallback(
    (blockId: string, arrayPath: string, index: number) => {
      setPage((prev) => {
        if (!prev) return prev
        const block = prev.blocks.find((b) => b.id === blockId)
        if (!block) return prev

        const props = block.props as Record<string, unknown>
        const currentArray = (getByPath(props, arrayPath) as unknown[]) || []

        // legalTable: when removing a column, remove that column's key from every row.cells
        let updatedProps: CMSBlock["props"]
        if (block.type === "legalTable" && arrayPath === "columns") {
          const removedCol = currentArray[index] as { id: string } | undefined
          const removedColId = removedCol?.id
          const updatedArray = arrayRemove(currentArray, index)
          updatedProps = setByPath(props, arrayPath, updatedArray) as CMSBlock["props"]
          if (removedColId) {
            const rows = (getByPath(updatedProps, "rows") as LegalTableRow[]) || []
            const syncedRows = rows.map((r: LegalTableRow) => {
              const { [removedColId]: _, ...rest } = r.cells ?? {}
              return { ...r, cells: rest }
            })
            updatedProps = setByPath(updatedProps, "rows", syncedRows) as CMSBlock["props"]
          }
        } else {
          const updatedArray = arrayRemove(currentArray, index)
          updatedProps = setByPath(props, arrayPath, updatedArray) as CMSBlock["props"]
        }

        // Reset activeFieldPath if it points to deleted item
        if (activeFieldPath && activeFieldPath.startsWith(`${arrayPath}.${index}`)) {
          // Field was on the deleted item - select just the block (clear field selection)
          selectBlock(blockId)
        } else if (activeFieldPath && activeFieldPath.startsWith(`${arrayPath}.`)) {
          // Update fieldPath if item indices shifted
          const pathParts = activeFieldPath.split(".")
          const itemIndex = parseInt(pathParts[1], 10)
          if (!isNaN(itemIndex) && itemIndex > index) {
            pathParts[1] = String(itemIndex - 1)
            selectField(blockId, pathParts.join("."))
          }
        }

        return {
          ...prev,
          blocks: prev.blocks.map((b) =>
            b.id === blockId ? ({ ...b, props: updatedProps } as CMSBlock) : b
          ),
        } as AdminPage
      })
    },
    [setPage, activeFieldPath, selectBlock, selectField]
  )

  /**
   * handleMoveArrayItem - Move item within array field
   */
  const handleMoveArrayItem = useCallback(
    (blockId: string, arrayPath: string, fromIndex: number, toIndex: number) => {
      setPage((prev) => {
        if (!prev) return prev
        const block = prev.blocks.find((b) => b.id === blockId)
        if (!block) return prev

        const props = block.props as Record<string, unknown>
        const currentArray = (getByPath(props, arrayPath) as unknown[]) || []

        const updatedArray = arrayMove(currentArray, fromIndex, toIndex)
        const updatedProps = setByPath(props, arrayPath, updatedArray) as CMSBlock["props"]

        // Reset activeFieldPath if it references moved items
        if (activeFieldPath?.includes(`${arrayPath}.${fromIndex}`)) {
          selectBlock(blockId)
        }

        return {
          ...prev,
          blocks: prev.blocks.map((b) =>
            b.id === blockId ? ({ ...b, props: updatedProps } as CMSBlock) : b
          ),
        } as AdminPage
      })
    },
    [setPage, activeFieldPath, selectBlock]
  )

  return {
    updatePage,
    applyPageBrand,
    handlePageBrandChange,
    addBlock,
    removeBlock,
    moveBlock,
    moveBlockById,
    duplicateAt,
    updateSelectedProps,
    updateBlockPropsById,
    handleInlineChange,
    handleAddArrayItem,
    handleRemoveArrayItem,
    handleMoveArrayItem,
  }
}
