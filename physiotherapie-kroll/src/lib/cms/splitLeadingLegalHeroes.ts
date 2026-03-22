import type { CMSBlock } from "@/types/cms"

/**
 * On legal pages, the first block is usually `legalHero` with a full-width background.
 * It must render outside the max-w-7xl + TOC sidebar grid — otherwise `calc(50% - 50vw)` breakout
 * is mathematically wrong (main column is not viewport-centered) and a stripe appears on the right.
 */
export function splitLeadingLegalHeroes(
  blocks: CMSBlock[],
  enabled: boolean
): { prefix: CMSBlock[]; rest: CMSBlock[] } {
  if (!enabled || blocks.length === 0) {
    return { prefix: [], rest: blocks }
  }
  let i = 0
  while (i < blocks.length && blocks[i].type === "legalHero") {
    i += 1
  }
  return { prefix: blocks.slice(0, i), rest: blocks.slice(i) }
}
