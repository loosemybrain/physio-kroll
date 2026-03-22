/**
 * Legal Icons Registry
 * Central configuration for icons used in legal page blocks (legalHero, etc.)
 */

import {
  Scale,
  Shield,
  FileText,
  AlertCircle,
  CheckCircle,
  Lock,
  Eye,
  Cookie,
  InfoIcon,
  Gavel,
} from "lucide-react"

export interface LegalIcon {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export const legalIconRegistry: Record<string, LegalIcon> = {
  Scale: { key: "Scale", label: "Waage", icon: Scale },
  Shield: { key: "Shield", label: "Schild", icon: Shield },
  FileText: { key: "FileText", label: "Dokument", icon: FileText },
  AlertCircle: { key: "AlertCircle", label: "Warnung", icon: AlertCircle },
  CheckCircle: { key: "CheckCircle", label: "Bestätigung", icon: CheckCircle },
  Lock: { key: "Lock", label: "Schloss", icon: Lock },
  Eye: { key: "Eye", label: "Auge", icon: Eye },
  Cookie: { key: "Cookie", label: "Cookie", icon: Cookie },
  Info: { key: "Info", label: "Info", icon: InfoIcon },
  Gavel: { key: "Gavel", label: "Hammer", icon: Gavel },
}

/**
 * Get all available legal icon names
 */
export function getLegalIconNames(): string[] {
  return Object.keys(legalIconRegistry)
}

/**
 * Get all legal icons with humanized labels for UI display
 */
export function getLegalIconsWithLabels(): Array<{ value: string; label: string }> {
  return getLegalIconNames().map((iconName) => ({
    value: iconName,
    label: legalIconRegistry[iconName].label,
  }))
}

/**
 * Get a legal icon component by name
 * @param name - Name of the icon from legalIconRegistry
 * @returns Icon component or Scale (default) if not found
 */
export function getLegalIcon(
  name?: string | null
): React.ComponentType<{ className?: string }> {
  if (!name || typeof name !== "string" || !(name in legalIconRegistry)) {
    return Scale
  }
  return legalIconRegistry[name].icon
}

/**
 * Type-safe icon name for legal icons
 */
export type LegalIconName = keyof typeof legalIconRegistry
