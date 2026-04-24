"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type { BlockAnimationConfig, SingleAnimationConfig } from "./types"
import { ANIMATION_TRIGGERS } from "./types"
import {
  usePrefersReducedMotion,
  getCSSAnimationString,
  createIntersectionObserver,
} from "./utils"

interface UseBlockAnimationProps {
  config: BlockAnimationConfig
  containerRef: React.RefObject<HTMLElement | null>
  onAnimationComplete?: (stage: "enter" | "exit" | "hover") => void
}

/** Verhindert „Blitz“-Fades bei fehlerhaft 0ms in der Config (nur Eingang). */
const MIN_ENTER_DURATION_MS = 200

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
    enterTriggered: config.enter?.trigger === "onLoad",
    exitTriggered: false,
    isHovering: false,
    isVisible: config.enter?.trigger === "onLoad",
  })

  const observerRef = useRef<IntersectionObserver | null>(null)
  const hasAnimatedOnce = useRef(false) // Guard against double-animation after hydration
  const cleanupRef = useRef<(() => void) | null>(null)

  // Enter Animation anwenden
  const applyAnimation = useCallback(
    (animation: SingleAnimationConfig | undefined, stage: "enter" | "exit" | "hover") => {
      if (!animation || animation.type === "none" || !containerRef.current) return

      const el = containerRef.current
      const durationMs = (() => {
        if (prefersReduced) return 1
        const raw = typeof animation.duration === "number" && !Number.isNaN(animation.duration) ? animation.duration : 400
        if (stage === "enter") {
          return Math.max(raw, MIN_ENTER_DURATION_MS)
        }
        return Math.max(raw, 16)
      })()
      const cssAnimation = getCSSAnimationString({ ...animation, duration: durationMs })

      // Cleanup any previous scheduled restores for this element
      cleanupRef.current?.()
      cleanupRef.current = null

      // Snapshot only the properties we touch here, so we can restore safely.
      // IMPORTANT: Do not set scroll-/touch-relevant styles (overflow/position/touchAction/contain/etc.).
      const prevAnimation = el.style.animation
      const prevOpacity = el.style.opacity
      const prevWillChange = el.style.willChange

      // Apply inline styles (visual-only)
      // NOTE: we intentionally do NOT set opacity directly here; opacity/transform should be handled by keyframes,
      // to avoid leaving the element in a "forced layer" state on mobile browsers.
      el.style.willChange = "opacity, transform"
      el.style.animation = cssAnimation

      // Callback nach Animation
      const timeout = setTimeout(() => {
        onAnimationComplete?.(stage)
      }, durationMs + animation.delay)

      // Restore after the animation should have finished, so we don't leave persistent inline styles.
      const restore = window.setTimeout(() => {
        // Restore only what we changed
        el.style.animation = prevAnimation
        el.style.opacity = prevOpacity
        el.style.willChange = prevWillChange
      }, durationMs + animation.delay + 50)

      const cleanup = () => {
        clearTimeout(timeout)
        clearTimeout(restore)
      }
      cleanupRef.current = cleanup
      return cleanup
    },
    [containerRef, prefersReduced, onAnimationComplete]
  )

  // Setup Enter Animation
  useEffect(() => {
    // Guard against double-animation after hydration
    if (hasAnimatedOnce.current) return
    if (!config.enabled || !config.enter || state.enterTriggered) return

    const trigger = config.enter.trigger

    if (trigger === "onLoad") {
      // Sofort
      hasAnimatedOnce.current = true
      return applyAnimation(config.enter, "enter")
    } else if (trigger === "onScroll") {
      // Mit IntersectionObserver
      if (!containerRef.current) return

      observerRef.current = createIntersectionObserver((isVisible) => {
        if (isVisible && !state.enterTriggered && !hasAnimatedOnce.current) {
          hasAnimatedOnce.current = true
          setState((s) => ({ ...s, enterTriggered: true, isVisible: true }))
          applyAnimation(config.enter, "enter")

          // Falls 'once', observer cleanen
          if (config.enter?.once && observerRef.current) {
            observerRef.current.disconnect()
          }
        }
      }, {
        // Etwas höherer Default: Animation startet nicht bei minimalem Sichtanteil
        // (wirkt beim Scrollen oft „ruckelig“).
        threshold: config.enter.threshold ?? 0.22,
        rootMargin: config.enter.rootMargin ?? "0px",
      })

      observerRef.current.observe(containerRef.current)

      return () => {
        observerRef.current?.disconnect()
        cleanupRef.current?.()
        cleanupRef.current = null
      }
    }
    return undefined
  }, [config.enabled, config.enter, state.enterTriggered, containerRef, applyAnimation]) // Only re-run if animation was already triggered or container changed

  // Setup Hover Animation
  useEffect(() => {
    if (!config.enabled || !config.hover || !containerRef.current) return

    const el = containerRef.current
    const prevAnimation = el.style.animation

    const handleMouseEnter = () => {
      setState((s) => ({ ...s, isHovering: true }))
      applyAnimation(config.hover, "hover")
    }

    const handleMouseLeave = () => {
      setState((s) => ({ ...s, isHovering: false }))
      // Restore animation style (do not force "none")
      el.style.animation = prevAnimation
    }

    if (config.hover.trigger === "onHover") {
      el.addEventListener("mouseenter", handleMouseEnter)
      el.addEventListener("mouseleave", handleMouseLeave)

      return () => {
        el.removeEventListener("mouseenter", handleMouseEnter)
        el.removeEventListener("mouseleave", handleMouseLeave)
        cleanupRef.current?.()
        cleanupRef.current = null
      }
    }
  }, [config.enabled, config.hover, containerRef, applyAnimation])

  // Setup Exit Animation (bei Unmount)
  useEffect(() => {
    return () => {
      // On unmount, only cleanup observers/timeouts. Avoid state updates during unmount.
      observerRef.current?.disconnect()
      cleanupRef.current?.()
      cleanupRef.current = null
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
