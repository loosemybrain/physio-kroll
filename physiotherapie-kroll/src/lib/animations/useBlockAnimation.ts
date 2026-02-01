"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type { BlockAnimationConfig, SingleAnimationConfig } from "./types"
import { ANIMATION_TRIGGERS } from "./types"
import {
  usePrefersReducedMotion,
  getCSSAnimationString,
  createIntersectionObserver,
  getEffectiveDuration,
} from "./utils"

interface UseBlockAnimationProps {
  config: BlockAnimationConfig
  containerRef: React.RefObject<HTMLElement | null>
  onAnimationComplete?: (stage: "enter" | "exit" | "hover") => void
}

interface AnimationState {
  enterTriggered: boolean
  exitTriggered: boolean
  isHovering: boolean
  isVisible: boolean
}

/**
 * Hook: Verwaltet alle Animationen für einen Block
 * - Triggers (onLoad, onScroll, onHover)
 * - Reduced Motion
 * - Stagger für Kinder
 */
export function useBlockAnimation({
  config,
  containerRef,
  onAnimationComplete,
}: UseBlockAnimationProps) {
  const prefersReduced = usePrefersReducedMotion()
  const [state, setState] = useState<AnimationState>({
    enterTriggered: false,
    exitTriggered: false,
    isHovering: false,
    isVisible: config.enter?.trigger === "onLoad",
  })

  const observerRef = useRef<IntersectionObserver | null>(null)

  // Enter Animation anwenden
  const applyAnimation = useCallback(
    (animation: SingleAnimationConfig | undefined, stage: "enter" | "exit" | "hover") => {
      if (!animation || animation.type === "none" || !containerRef.current) return

      const el = containerRef.current
      const duration = getEffectiveDuration(animation, prefersReduced)
      const cssAnimation = getCSSAnimationString(animation)

      // Apply inline styles
      el.style.animation = cssAnimation
      el.style.opacity = String(animation.opacity?.to ?? 1)

      // Callback nach Animation
      const timeout = setTimeout(() => {
        onAnimationComplete?.(stage)
      }, duration + animation.delay)

      return () => clearTimeout(timeout)
    },
    [containerRef, prefersReduced, onAnimationComplete]
  )

  // Setup Enter Animation
  useEffect(() => {
    if (!config.enabled || !config.enter || state.enterTriggered) return

    const trigger = config.enter.trigger

    if (trigger === "onLoad") {
      // Sofort
      setState((s) => ({ ...s, enterTriggered: true }))
      applyAnimation(config.enter, "enter")
    } else if (trigger === "onScroll") {
      // Mit IntersectionObserver
      if (!containerRef.current) return

      observerRef.current = createIntersectionObserver((isVisible) => {
        if (isVisible && !state.enterTriggered) {
          setState((s) => ({ ...s, enterTriggered: true, isVisible: true }))
          applyAnimation(config.enter, "enter")

          // Falls 'once', observer cleanen
          if (config.enter?.once && observerRef.current) {
            observerRef.current.disconnect()
          }
        }
      }, {
        threshold: config.enter.threshold,
        rootMargin: config.enter.rootMargin,
      })

      observerRef.current.observe(containerRef.current)

      return () => {
        observerRef.current?.disconnect()
      }
    }
  }, [config.enabled, config.enter, state.enterTriggered, containerRef, applyAnimation])

  // Setup Hover Animation
  useEffect(() => {
    if (!config.enabled || !config.hover || !containerRef.current) return

    const el = containerRef.current

    const handleMouseEnter = () => {
      setState((s) => ({ ...s, isHovering: true }))
      applyAnimation(config.hover, "hover")
    }

    const handleMouseLeave = () => {
      setState((s) => ({ ...s, isHovering: false }))
      // Remove animation
      el.style.animation = "none"
    }

    if (config.hover.trigger === "onHover") {
      el.addEventListener("mouseenter", handleMouseEnter)
      el.addEventListener("mouseleave", handleMouseLeave)

      return () => {
        el.removeEventListener("mouseenter", handleMouseEnter)
        el.removeEventListener("mouseleave", handleMouseLeave)
      }
    }
  }, [config.enabled, config.hover, containerRef, applyAnimation])

  // Setup Exit Animation (bei Unmount)
  useEffect(() => {
    return () => {
      if (config.enabled && config.exit && !state.exitTriggered && containerRef.current) {
        setState((s) => ({ ...s, exitTriggered: true }))
        applyAnimation(config.exit, "exit")
      }
    }
  }, [config.enabled, config.exit, state.exitTriggered, containerRef, applyAnimation])

  return {
    state,
    isAnimating: state.enterTriggered || state.isHovering,
  }
}

/**
 * Hook: Berechne Stagger-Delays für Kinder
 */
export function useStaggerAnimation(config: SingleAnimationConfig | undefined, childIndex: number) {
  if (!config?.stagger) return 0
  return childIndex * config.stagger
}
