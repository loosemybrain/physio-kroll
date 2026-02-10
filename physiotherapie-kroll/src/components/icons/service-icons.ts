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
  // Additional icons for more variety
  Lightbulb,
  Smile,
  BarChart3,
  Rocket,
  CheckCircle,
  AlertCircle,
  Leaf,
  Repeat,
  Plus,
  HelpCircle,
  Gauge,
  Accessibility,
  Smartphone,
  MapPin,
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
  Accessibility,

  // Performance & Goals
  Zap,
  Target,
  Award,
  TrendingUp,
  Rocket,
  Gauge,
  BarChart3,

  // Social & Time
  Users,
  Clock,
  Timer,

  // Aesthetic/Mood & Well-being
  Star,
  Sparkles,
  Flame,
  Wind,
  Waves,
  Footprints,
  Smile,
  Leaf,

  // Learning & Support
  Lightbulb,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Plus,

  // Digital & Location
  Smartphone,
  MapPin,
  Repeat,

  // Navigation & Fallback
  ArrowRight,
  Circle,
} as const

/**
 * Icon aliases for common typos and variations
 * Maps incorrect/alternative names to canonical icon names
 */
export const serviceIconAliases: Record<string, ServiceIconName> = {
  // Common typos
  HeartRate: "HeartPulse",
  Heartbeat: "HeartPulse",
  Pulse: "HeartPulse",
  Running: "Activity",
  Exercise: "Dumbbell",
  Training: "Dumbbell",
  Fitness: "Dumbbell",
  Doctor: "Stethoscope",
  Medical: "Stethoscope",
  Protection: "Shield",
  Safety: "Shield",
  Team: "Users",
  People: "Users",
  Group: "Users",
  Time: "Clock",
  Duration: "Timer",
  Speed: "Zap",
  Energy: "Zap",
  Thunder: "Zap",
  Trophy: "Award",
  Achievement: "Award",
  Success: "CheckCircle",
  Done: "CheckCircle",
  Completed: "CheckCircle",
  Launch: "Rocket",
  Growth: "TrendingUp",
  Analytics: "BarChart3",
  Chart: "BarChart3",
  Idea: "Lightbulb",
  Innovation: "Lightbulb",
  Happy: "Smile",
  Happiness: "Smile",
  Nature: "Leaf",
  Eco: "Leaf",
  Green: "Leaf",
  Help: "HelpCircle",
  Info: "AlertCircle",
  Warning: "AlertCircle",
  Question: "HelpCircle",
  Mobile: "Smartphone",
  Phone: "Smartphone",
  Location: "MapPin",
  Place: "MapPin",
  Refresh: "Repeat",
  Reload: "Repeat",
} as const

/**
 * Type for all available service icon names
 * Ensures type safety when passing icon names to components
 */
export type ServiceIconName = keyof typeof serviceIconMap

/**
 * Get a lucide icon component by name
 * Supports both direct names and aliases (e.g., "HeartRate" → "HeartPulse")
 * @param name - Name of the icon from serviceIconMap or alias
 * @returns Icon component, or Circle (fallback) if name not found
 */
export function getServiceIcon(
  name?: string | null
): React.ComponentType<{ className?: string }> {
  if (!name || typeof name !== "string") {
    return Circle
  }

  // Try direct match first
  let iconName = name as ServiceIconName
  if (iconName in serviceIconMap) {
    const Icon = serviceIconMap[iconName]
    return Icon || Circle
  }

  // Try alias match
  const aliasedName = serviceIconAliases[name]
  if (aliasedName && aliasedName in serviceIconMap) {
    const Icon = serviceIconMap[aliasedName]
    return Icon || Circle
  }

  // Fallback
  return Circle
}

/**
 * Humanize icon name for display
 * Converts "HeartPulse" to "Heart Pulse", "Activity" stays "Activity"
 * @param name - Icon name in camelCase
 * @returns Humanized name with spaces
 */
export function humanizeIconName(name: string): string {
  // Insert space before uppercase letters (but not at the start)
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before uppercase
    .replace(/^(.)/, (letter) => letter.toUpperCase()) // Capitalize first letter
}

/**
 * Get list of all available icon names for select dropdowns
 * Useful for inspector/forms
 */
export function getAvailableIconNames(): ServiceIconName[] {
  return Object.keys(serviceIconMap) as ServiceIconName[]
}

/**
 * Get list of icons with humanized labels for UI display
 */
export function getAvailableIconsWithLabels(): Array<{ value: ServiceIconName; label: string }> {
  return getAvailableIconNames().map((iconName) => ({
    value: iconName,
    label: humanizeIconName(iconName),
  }))
}

/**
 * Type guard to check if a string is a valid service icon name
 */
export function isValidServiceIconName(value: unknown): value is ServiceIconName {
  return typeof value === "string" && value in serviceIconMap
}
