/**
 * Service Icons Module
 * Central registry for all available service icons from lucide-react
 * Used by ServicesGridBlock and other components
 */

import {
  ArrowRight,
  Circle,
  Activity,
  Heart,
  Brain,
  Bone,
  Dumbbell,
  Stethoscope,
  Zap,
  Shield,
  Users,
  Clock,
  Star,
  Award,
  Target,
  TrendingUp,
  HandHeart,
  Sparkles,
  Flame,
  Wind,
  Waves,
  Footprints,
  HeartPulse,
  Timer,
} from "lucide-react"

/**
 * Immutable map of all available service icons
 * Icons are organized by semantic meaning for easier discovery
 */
export const serviceIconMap = {
  // Health & Wellness
  Activity,
  Heart,
  HeartPulse,
  Brain,
  Bone,
  Dumbbell,
  Stethoscope,
  Shield,
  HandHeart,

  // Performance & Goals
  Zap,
  Target,
  Award,
  TrendingUp,

  // Social & Time
  Users,
  Clock,
  Timer,

  // Aesthetic/Mood
  Star,
  Sparkles,
  Flame,
  Wind,
  Waves,
  Footprints,

  // Navigation & Fallback
  ArrowRight,
  Circle,
} as const

/**
 * Type for all available service icon names
 * Ensures type safety when passing icon names to components
 */
export type ServiceIconName = keyof typeof serviceIconMap

/**
 * Get a lucide icon component by name
 * @param name - Name of the icon from serviceIconMap
 * @returns Icon component, or Circle (fallback) if name not found
 */
export function getServiceIcon(
  name?: string | null
): React.ComponentType<{ className?: string }> {
  if (!name || typeof name !== "string") {
    return Circle
  }

  const Icon =
    serviceIconMap[name as ServiceIconName] ||
    (serviceIconMap[name as keyof typeof serviceIconMap] as any)

  return Icon || Circle
}

/**
 * Get list of all available icon names for select dropdowns
 * Useful for inspector/forms
 */
export function getAvailableIconNames(): ServiceIconName[] {
  return Object.keys(serviceIconMap) as ServiceIconName[]
}

/**
 * Type guard to check if a string is a valid service icon name
 */
export function isValidServiceIconName(value: unknown): value is ServiceIconName {
  return typeof value === "string" && value in serviceIconMap
}
