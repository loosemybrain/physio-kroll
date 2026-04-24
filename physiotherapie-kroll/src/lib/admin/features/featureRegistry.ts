import type { FeatureRegistryEntry } from "./types"

export const featureRegistry = {
  audit: {
    label: "Audit-Log",
    required: false,
    weight: 10,
    category: "advanced",
    productStateLabel: "optionale Erweiterung",
  },
  loginObservability: {
    label: "Login-Observability",
    required: false,
    weight: 5,
    category: "security",
    productStateLabel: "optionale Erweiterung",
  },
  mfaCoverage: {
    label: "MFA-Abdeckung",
    required: false,
    weight: 5,
    category: "security",
    productStateLabel: "optionale Erweiterung",
  },
  cookieScan: {
    label: "Cookie-Scan",
    required: true,
    weight: 20,
    category: "core",
    productStateLabel: "aktive Kernfunktion",
  },
  content: {
    label: "Content-System",
    required: true,
    weight: 25,
    category: "core",
    productStateLabel: "aktive Kernfunktion",
  },
  users: {
    label: "Benutzerverwaltung",
    required: true,
    weight: 20,
    category: "core",
    productStateLabel: "aktive Kernfunktion",
  },
} as const satisfies Record<string, FeatureRegistryEntry>
