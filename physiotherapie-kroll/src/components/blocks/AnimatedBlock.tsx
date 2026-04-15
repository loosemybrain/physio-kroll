"use client"

import { useRef, type HTMLAttributes, type ReactNode } from "react"
import type { BlockAnimationConfig } from "@/lib/animations/types"
import { DEFAULT_ANIMATION_CONFIG } from "@/lib/animations/types"
import { useBlockAnimation } from "@/lib/animations/useBlockAnimation"
import { ANIMATION_KEYFRAMES } from "@/lib/animations/keyframes"

export type AnimatedBlockProps = {
  children: ReactNode
  config?: Partial<BlockAnimationConfig>
  onAnimationComplete?: (stage: "enter" | "exit" | "hover") => void
} & Omit<HTMLAttributes<HTMLDivElement>, "children">

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
  ...rest
}: AnimatedBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const config: BlockAnimationConfig = {
    ...DEFAULT_ANIMATION_CONFIG,
    ...configProp,
  }

  useBlockAnimation({
    config,
    containerRef,
    onAnimationComplete,
  })

  if (!config.enabled) {
    return (
      <div ref={containerRef} className={className} id={id} {...rest}>
        {children}
      </div>
    )
  }

  return (
    <>
      <style>{ANIMATION_KEYFRAMES}</style>

      <div
        ref={containerRef}
        className={className}
        id={id}
        {...rest}
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
  Component: import("react").ComponentType<P>,
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