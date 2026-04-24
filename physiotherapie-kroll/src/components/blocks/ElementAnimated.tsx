"use client"

import type { ReactNode } from "react"
import { AnimatedBlock } from "@/components/blocks/AnimatedBlock"
import type { ElementConfig } from "@/types/cms"
import type { BlockAnimationConfig } from "@/lib/animations/types"
import { DEFAULT_ANIMATION_CONFIG } from "@/lib/animations/types"

type ElementAnimatedProps = {
  elementId: string
  elements?: Record<string, unknown> | undefined
  className?: string
  children: ReactNode
}

/**
 * Wendet `elements[elementId].animation` an (wie Block-Section-Animation), sonst nur Kinder.
 */
export function ElementAnimated({ elementId, elements, className, children }: ElementAnimatedProps) {
  const elementConfig = elements?.[elementId] as ElementConfig | undefined
  const raw = elementConfig?.animation
  const merged = {
    ...DEFAULT_ANIMATION_CONFIG,
    ...raw,
    enter: { ...DEFAULT_ANIMATION_CONFIG.enter, ...raw?.enter },
    exit: { ...DEFAULT_ANIMATION_CONFIG.exit, ...raw?.exit },
    hover: { ...DEFAULT_ANIMATION_CONFIG.hover, ...raw?.hover },
  } as BlockAnimationConfig

  if (!merged.enabled) {
    return <>{children}</>
  }

  return (
    <AnimatedBlock config={merged} className={className}>
      {children}
    </AnimatedBlock>
  )
}
