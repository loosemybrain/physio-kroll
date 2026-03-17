"use client"

import { useEffect, useState } from "react"

/**
 * Detect if animations should be disabled (mobile, reduced motion, etc.)
 * 
 * On mobile and touch devices, we disable whileInView animations to ensure
 * content is always visible. Desktop users get full animations.
 */
export function useMotionPreference() {
  const [isMobile, setIsMobile] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // Check for reduced motion preference
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(motionQuery.matches)
    
    const motionHandler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }
    motionQuery.addEventListener("change", motionHandler)

    // Check for touch/mobile
    const touchQuery = window.matchMedia("(hover: none)")
    setIsMobile(touchQuery.matches)
    
    const touchHandler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }
    touchQuery.addEventListener("change", touchHandler)

    return () => {
      motionQuery.removeEventListener("change", motionHandler)
      touchQuery.removeEventListener("change", touchHandler)
    }
  }, [])

  return {
    /**
     * True if device is mobile/touch or user prefers reduced motion
     * Use for disabling whileInView and complex animations
     */
    shouldDisableViewAnimations: isMobile || prefersReducedMotion,
    
    /**
     * True if device is mobile/touch
     */
    isMobile,
    
    /**
     * True if user prefers reduced motion
     */
    prefersReducedMotion,
  }
}

/**
 * Get initial state for animations.
 * 
 * On mobile: always "visible" to ensure content is never hidden
 * On desktop: "hidden" to trigger whileInView animation
 */
export function getAnimationInitial(shouldDisable: boolean): "hidden" | "visible" {
  return shouldDisable ? "visible" : "hidden"
}

/**
 * Get viewport trigger config.
 * 
 * On mobile: don't trigger animation (content already visible)
 * On desktop: trigger when entering viewport
 */
export function getViewportTrigger(
  shouldDisable: boolean
): { whileInView?: "visible"; viewport?: { once: boolean; margin: string } } {
  if (shouldDisable) {
    return {}
  }
  return {
    whileInView: "visible",
    viewport: { once: true, margin: "0px 0px -100px 0px" },
  }
}
