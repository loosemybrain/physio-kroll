import type { CMSBlock } from "@/types/cms"
import { arrayMove } from "@/lib/cms/arrayOps"

function isLegalSectionBlock(block: CMSBlock | undefined): block is Extract<CMSBlock, { type: "legalSection" }> {
  return Boolean(block && block.type === "legalSection")
}

/**
 * Reorders only legalSection blocks while keeping all non-sortable blocks
 * at their original, relative positions.
 */
export function reorderLegalSections(blocks: CMSBlock[], activeId: string, overId: string): CMSBlock[] {
  if (!Array.isArray(blocks) || blocks.length === 0) return blocks
  if (!activeId || !overId || activeId === overId) return blocks

  const activeBlock = blocks.find((b) => b.id === activeId)
  const overBlock = blocks.find((b) => b.id === overId)
  if (!isLegalSectionBlock(activeBlock) || !isLegalSectionBlock(overBlock)) return blocks

  const legalSectionSlots: number[] = []
  const legalSections: Extract<CMSBlock, { type: "legalSection" }>[] = []

  blocks.forEach((block, index) => {
    if (block.type === "legalSection") {
      legalSectionSlots.push(index)
      legalSections.push(block)
    }
  })

  const fromIndex = legalSections.findIndex((b) => b.id === activeId)
  const toIndex = legalSections.findIndex((b) => b.id === overId)
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return blocks

  const moved = arrayMove(legalSections, fromIndex, toIndex)
  const nextBlocks = [...blocks]
  legalSectionSlots.forEach((slotIndex, i) => {
    nextBlocks[slotIndex] = moved[i]
  })
  return nextBlocks
}

