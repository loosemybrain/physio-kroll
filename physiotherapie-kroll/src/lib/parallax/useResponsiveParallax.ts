"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Hook: Responsive Parallax System
 * 
 * Berechnet dynamische Parallax-Parameter basierend auf:
 * - Section-Höhe
 * - Viewport-Höhe
 * - prefers-reduced-motion
 * - Viewport-Größe
 * 
 * Nutzt CSS-Variablen und RequestAnimationFrame für Performance.
 */

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export interface ParallaxConfig {
  maxShift: number      // Maximaler Pixel-Shift
  scale: number         // Overscan-Scale
  factor: number        // Scroll-Faktor
}

/**
 * Berechne Parallax-Parameter responsive aus Section/Viewport-Dimensionen
 */
export function calculateParallaxConfig(sectionHeight: number, viewportHeight: number): ParallaxConfig {
  // Basis: kleinere von Section- oder Viewport-Höhe
  const basis = Math.min(sectionHeight, viewportHeight)

  // maxShift: 12% der Basis, aber zwischen 40px und 180px
  // Kleine Sections: ~40px, große Sections: bis 180px
  const maxShift = clamp(basis * 0.12, 40, 180)

  // Factor: 0.22 Standard
  // Optional dynamisch: 0.18 + (basis/viewportHeight)*0.08
  // Für V0: konstant 0.22
  const factor = 0.22

  // Overscan-Scale: 1 + (2 * maxShift) / sectionHeight
  // Min 1.04 (4% extra), Max 1.18 (18% extra)
  // Sichert dass kein Clipping an Ober/Unterkante auftritt
  const scale = clamp(1 + (2 * maxShift) / sectionHeight, 1.04, 1.18)

  return { maxShift, scale, factor }
}

/**
 * Prüfe ob Parallax deaktiviert sein sollte
 */
function shouldDisableParallax(): boolean {
  if (typeof window === "undefined") return true
  // prefers-reduced-motion
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return true
  // Touch devices (hover: none)
  if (window.matchMedia?.("(hover: none)")?.matches) return true
  // Kleine Bildschirme
  if (window.innerWidth < 768) return true
  return false
}

/**
 * Global parallax update system (shared für alle Sections)
 */
type ParallaxItem = {
  container: HTMLElement
  target: HTMLElement
  config: ParallaxConfig
  isIntersecting: boolean
}

const parallaxItems = new Set<ParallaxItem>()
let parallaxRaf = 0
let parallaxListenersAttached = false

function scheduleParallaxUpdate() {
  if (parallaxRaf) return
  parallaxRaf = window.requestAnimationFrame(() => {
    parallaxRaf = 0
    const vh = window.innerHeight || 0

    for (const item of parallaxItems) {
      if (!item.isIntersecting) continue

      const rect = item.container.getBoundingClientRect()
      // Prüfe ob außerhalb sichtbarem Bereich + Buffer
      if (rect.bottom < -200 || rect.top > vh + 200) continue

      // Berechne Distanz von Viewport-Mitte
      const center = rect.top + rect.height / 2
      const dist = center - vh / 2

      // Berechne Y-Shift mit Clamp
      const y = clamp(-dist * item.config.factor, -item.config.maxShift, item.config.maxShift)

      // Apply als CSS-Variablen
      item.target.style.setProperty("--section-parallax-y", `${y.toFixed(1)}px`)
      item.target.style.setProperty("--section-parallax-scale", `${item.config.scale.toFixed(4)}`)
    }
  })
}

function ensureParallaxListeners() {
  if (parallaxListenersAttached) return
  parallaxListenersAttached = true

  window.addEventListener("scroll", scheduleParallaxUpdate, { passive: true })
  window.addEventListener("resize", scheduleParallaxUpdate)
}

export interface UseResponsiveParallaxProps {
  enabled: boolean
  containerRef: React.RefObject<HTMLElement | null>
  targetRef: React.RefObject<HTMLElement | null>
  strength?: number // 0.5 to 2.0, default 1.0
  onConfigChange?: (config: ParallaxConfig) => void
}

/**
 * Hook: Verwalte responsives Parallax für eine Section
 * 
 * - Registriert Container/Target in globalem System
 * - Berechnet dynamische Parameter basierend auf Größen
 * - Nutzt IntersectionObserver für Visibility
 * - Nutzt ResizeObserver für dynamische Größen-Updates
 * - Respektiert prefers-reduced-motion
 * - strength Parameter multipliziert den factor
 */
export function useResponsiveParallax(props: UseResponsiveParallaxProps) {
  const itemRef = useRef<ParallaxItem | null>(null)
  const [config, setConfig] = useState<ParallaxConfig | null>(null)
  const strength = props.strength ?? 1.0

  useEffect(() => {
    if (!props.enabled) return
    if (shouldDisableParallax()) return

    const container = props.containerRef.current
    const target = props.targetRef.current
    if (!container || !target) return

    ensureParallaxListeners()

    // Berechne initiale Config mit Strength-Multiplikator
    let initialConfig = calculateParallaxConfig(
      container.offsetHeight,
      window.innerHeight
    )
    // Multipliziere factor mit strength
    initialConfig = {
      ...initialConfig,
      factor: initialConfig.factor * strength,
    }
    setConfig(initialConfig)
    props.onConfigChange?.(initialConfig)

    // Erstelle ParallaxItem
    const item: ParallaxItem = {
      container,
      target,
      config: initialConfig,
      isIntersecting: false,
    }
    itemRef.current = item
    parallaxItems.add(item)

    // IntersectionObserver: Track visibility
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return
        item.isIntersecting = entry.isIntersecting
        if (entry.isIntersecting) {
          scheduleParallaxUpdate()
        } else {
          // Reset auf sichtbarem Verlassen
          target.style.setProperty("--section-parallax-y", "0px")
        }
      },
      { root: null, threshold: 0 }
    )
    intersectionObserver.observe(container)

    // ResizeObserver: Recompute config wenn Section sich ändert
    const resizeObserver = new ResizeObserver(() => {
      let newConfig = calculateParallaxConfig(
        container.offsetHeight,
        window.innerHeight
      )
      // Multipliziere factor mit strength
      newConfig = {
        ...newConfig,
        factor: newConfig.factor * strength,
      }
      item.config = newConfig
      setConfig(newConfig)
      props.onConfigChange?.(newConfig)
      scheduleParallaxUpdate()
    })
    resizeObserver.observe(container)

    // Cleanup
    return () => {
      intersectionObserver.disconnect()
      resizeObserver.disconnect()
      parallaxItems.delete(item)
      target.style.removeProperty("--section-parallax-y")
      target.style.removeProperty("--section-parallax-scale")
      itemRef.current = null
    }
  }, [props.enabled, props.containerRef, props.targetRef, props.onConfigChange, strength])

  return config
}
