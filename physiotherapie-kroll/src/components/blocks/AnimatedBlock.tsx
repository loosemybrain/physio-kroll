"use client"

import { useRef } from "react"
import type { BlockAnimationConfig } from "@/lib/animations/types"
import { DEFAULT_ANIMATION_CONFIG } from "@/lib/animations/types"
import { useBlockAnimation } from "@/lib/animations/useBlockAnimation"
import { ANIMATION_KEYFRAMES } from "@/lib/animations/keyframes"

interface AnimatedBlockProps {
  children: React.ReactNode
  config?: Partial<BlockAnimationConfig>
  className?: string
  id?: string
  onAnimationComplete?: (stage: "enter" | "exit" | "hover") => void
}

/**
 * Wrapper-Komponente: Wendet Animation Config auf Kinder an
 * 
 * Anwendung:
 * <AnimatedBlock config={{ enter: { type: "fade-up", ... } }}>
 *   <SomeContent />
 * </AnimatedBlock>
 */
export function AnimatedBlock({
  children,
  config: configProp,
  className,
  id,
  onAnimationComplete,
}: AnimatedBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Merge mit defaults
  const config: BlockAnimationConfig = {
    ...DEFAULT_ANIMATION_CONFIG,
    ...configProp,
  }

  // Animation Hook
  useBlockAnimation({
    config,
    containerRef,
    onAnimationComplete,
  })

  if (!config.enabled) {
    return (
      <div ref={containerRef} className={className} id={id}>
        {children}
      </div>
    )
  }

  return (
    <>
      {/* Inject Animation Keyframes in <head> - nur einmal */}
      <style>{ANIMATION_KEYFRAMES}</style>

      <div
        ref={containerRef}
        className={className}
        id={id}
        style={{
          willChange: "transform, opacity, filter",
          backfaceVisibility: "hidden",
          perspective: 1000,
        }}
      >
        {children}
      </div>
    </>
  )
}

/**
 * HOC: Wrapping einer Komponente mit Animationen
 */
export function withAnimation<P extends object>(
  Component: React.ComponentType<P>,
  animationConfig?: Partial<BlockAnimationConfig>
) {
  return function AnimatedComponent(props: P & { animationConfig?: Partial<BlockAnimationConfig> }) {
    const finalConfig = props.animationConfig ?? animationConfig

    return (
      <AnimatedBlock config={finalConfig}>
        <Component {...props} />
      </AnimatedBlock>
    )
  }
}
