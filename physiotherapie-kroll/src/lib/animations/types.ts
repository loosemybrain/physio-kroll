/**
 * Animation System für CMS-Blöcke
 * 
 * Einheitliches, erweiterbares Animationssystem mit:
 * - Typsicherheit
 * - Reduced Motion Support
 * - Performance-Optimierung
 * - Einheitlicher Inspector-API
 */

/**
 * Verfügbare Animationstypen
 */
export const ANIMATION_TYPES = {
  none: "none",
  fade: "fade",
  fadeUp: "fade-up",
  fadeDown: "fade-down",
  fadeLeft: "fade-left",
  fadeRight: "fade-right",
  scale: "scale",
  scaleFade: "scale-fade",
  slideUp: "slide-up",
  slideDown: "slide-down",
  slideLeft: "slide-left",
  slideRight: "slide-right",
  blurFade: "blur-fade",
  rotate: "rotate",
  custom: "custom",
} as const

export type AnimationType = (typeof ANIMATION_TYPES)[keyof typeof ANIMATION_TYPES]

/**
 * Easing Functions
 */
export const EASING_TYPES = {
  linear: "linear",
  ease: "ease",
  easeIn: "ease-in",
  easeOut: "ease-out",
  easeInOut: "ease-in-out",
  cubicBezier: "cubic-bezier",
} as const

export type EasingType = (typeof EASING_TYPES)[keyof typeof EASING_TYPES]

/**
 * Animation Trigger
 */
export const ANIMATION_TRIGGERS = {
  onLoad: "onLoad",
  onScroll: "onScroll",
  onHover: "onHover",
  onClick: "onClick",
} as const

export type AnimationTrigger = (typeof ANIMATION_TRIGGERS)[keyof typeof ANIMATION_TRIGGERS]

/**
 * Einzelne Animation Config
 */
export interface SingleAnimationConfig {
  type: AnimationType
  duration: number // ms
  delay: number // ms
  easing: EasingType
  stagger?: number // ms - für Children
  trigger: AnimationTrigger
  once: boolean // nur einmal bei Scroll
  threshold?: number // 0-1 für Viewport
  rootMargin?: string
  // Optional: Direction & Transform Params
  direction?: "up" | "down" | "left" | "right"
  distance?: number // px für Slide/Fade
  scale?: { from: number; to: number }
  rotate?: { from: number; to: number }
  opacity?: { from: number; to: number }
  transformOrigin?: string
}

/**
 * Block-level Animation Config
 */
export interface BlockAnimationConfig {
  enter?: SingleAnimationConfig
  exit?: SingleAnimationConfig
  hover?: SingleAnimationConfig
  enabled: boolean
}

/**
 * Default Animation für neue Blöcke
 */
export const DEFAULT_ANIMATION_CONFIG: BlockAnimationConfig = {
  enabled: false,
  enter: {
    type: "none",
    duration: 0,
    delay: 0,
    easing: "ease-out",
    trigger: "onLoad",
    once: true,
  },
  exit: {
    type: "none",
    duration: 0,
    delay: 0,
    easing: "ease-out",
    trigger: "onLoad",
    once: true,
  },
  hover: {
    type: "none",
    duration: 0,
    delay: 0,
    easing: "ease-out",
    trigger: "onHover",
    once: false,
  },
}

/**
 * Helper: Animation Labels für Inspector Dropdowns
 */
export const ANIMATION_LABELS: Record<AnimationType, string> = {
  none: "Keine Animation",
  fade: "Fade (Ein-/Ausblenden)",
  "fade-up": "Fade Up (von unten)",
  "fade-down": "Fade Down (von oben)",
  "fade-left": "Fade Left (von links)",
  "fade-right": "Fade Right (von rechts)",
  scale: "Scale (Zoom)",
  "scale-fade": "Scale Fade (Zoom + Fade)",
  "slide-up": "Slide Up",
  "slide-down": "Slide Down",
  "slide-left": "Slide Left",
  "slide-right": "Slide Right",
  "blur-fade": "Blur Fade",
  rotate: "Rotate",
  custom: "Custom (erweitert)",
}

/**
 * Helper: Easing Labels
 */
export const EASING_LABELS: Record<EasingType, string> = {
  linear: "Linear",
  ease: "Ease (Standard)",
  "ease-in": "Ease In (langsam starten)",
  "ease-out": "Ease Out (langsam enden)",
  "ease-in-out": "Ease In-Out (beides)",
  "cubic-bezier": "Custom Bezier",
}

/**
 * Helper: Trigger Labels
 */
export const TRIGGER_LABELS: Record<AnimationTrigger, string> = {
  onLoad: "beim Laden",
  onScroll: "beim Scrollen (sichtbar)",
  onHover: "beim Hover",
  onClick: "beim Klick",
}
