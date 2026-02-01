import { useEffect, useState } from "react"
import type { AnimationType, EasingType, SingleAnimationConfig } from "./types"

/**
 * Hook: Respektiert prefers-reduced-motion
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReduced(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReduced(e.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return prefersReduced
}

/**
 * Konvertiere AnimationType zu CSS Keyframe Names
 */
export function getAnimationKeyframes(type: AnimationType): string | null {
  const keyframeMap: Record<AnimationType, string> = {
    none: "",
    fade: "fadeAnimation",
    "fade-up": "fadeUpAnimation",
    "fade-down": "fadeDownAnimation",
    "fade-left": "fadeLeftAnimation",
    "fade-right": "fadeRightAnimation",
    scale: "scaleAnimation",
    "scale-fade": "scaleFadeAnimation",
    "slide-up": "slideUpAnimation",
    "slide-down": "slideDownAnimation",
    "slide-left": "slideLeftAnimation",
    "slide-right": "slideRightAnimation",
    "blur-fade": "blurFadeAnimation",
    rotate: "rotateAnimation",
    custom: "",
  }
  return keyframeMap[type] || null
}

/**
 * CSS Easing zu JS-Map
 */
export function getCSSEasing(easing: EasingType): string {
  const easingMap: Record<EasingType, string> = {
    linear: "linear",
    ease: "ease",
    "ease-in": "cubic-bezier(0.42, 0, 1, 1)",
    "ease-out": "cubic-bezier(0, 0, 0.58, 1)",
    "ease-in-out": "cubic-bezier(0.42, 0, 0.58, 1)",
    "cubic-bezier": "cubic-bezier(0.42, 0, 0.58, 1)", // default fallback
  }
  return easingMap[easing]
}

/**
 * Generiere CSS Animation String
 */
export function getCSSAnimationString(config: SingleAnimationConfig): string {
  if (config.type === "none") return "none"

  const keyframes = getAnimationKeyframes(config.type)
  if (!keyframes) return "none"

  const easing = getCSSEasing(config.easing)
  const duration = `${config.duration}ms`
  const delay = config.delay ? `${config.delay}ms` : "0ms"
  const fillMode = "both"

  // animation: name duration timing-function delay fill-mode
  return `${keyframes} ${duration} ${easing} ${delay} ${fillMode}`
}

/**
 * Berechne finale Duration mit prefers-reduced-motion
 */
export function getEffectiveDuration(
  config: SingleAnimationConfig,
  prefersReduced: boolean
): number {
  if (prefersReduced) {
    // Bei reduced motion: nur sehr kurz animieren oder sofort
    return 0
  }
  return config.duration
}

/**
 * Fallback Styles für Animationen (z.B. wenn Keyframes nicht geladen)
 */
export function getAnimationFallbackStyles(
  type: AnimationType,
  config: SingleAnimationConfig
): React.CSSProperties {
  const styles: React.CSSProperties = {
    opacity: 1,
  }

  if (type === "none") {
    return styles
  }

  // Nur Animation-unabhängige Styles hier
  // Spezifische Transforms gehören in die Keyframes

  return styles
}

/**
 * IntersectionObserver Helper für Scroll-Trigger
 */
export interface IntersectionConfig {
  threshold?: number | number[]
  rootMargin?: string
  root?: Element | null
}

export function createIntersectionObserver(
  callback: (isVisible: boolean) => void,
  config?: IntersectionConfig
): IntersectionObserver {
  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        callback(entry.isIntersecting)
      })
    },
    {
      threshold: config?.threshold ?? 0.1,
      rootMargin: config?.rootMargin ?? "0px",
      root: config?.root ?? null,
    }
  )
}

/**
 * Stagger Helper: Berechne Delay für Kind-Elemente
 */
export function calculateStaggerDelay(index: number, stagger: number): number {
  return index * stagger
}

/**
 * Animation Config Helper: Validierung & Normalisierung
 */
export function normalizeAnimationConfig(config: Partial<SingleAnimationConfig>): SingleAnimationConfig {
  return {
    type: config.type ?? "none",
    duration: config.duration ?? 300,
    delay: config.delay ?? 0,
    easing: config.easing ?? "ease-out",
    stagger: config.stagger ?? 0,
    trigger: config.trigger ?? "onLoad",
    once: config.once ?? true,
    threshold: config.threshold ?? 0.1,
    rootMargin: config.rootMargin ?? "0px",
    direction: config.direction ?? "up",
    distance: config.distance ?? 20,
    scale: config.scale ?? { from: 0.8, to: 1 },
    rotate: config.rotate ?? { from: 0, to: 0 },
    opacity: config.opacity ?? { from: 0, to: 1 },
    transformOrigin: config.transformOrigin ?? "center",
  }
}
