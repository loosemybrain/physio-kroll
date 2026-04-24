export type FeatureStatus = "active" | "inactive" | "not_configured" | "unavailable"

export type FeatureCategory = "core" | "security" | "advanced"

export type FeatureRegistryEntry = {
  label: string
  required: boolean
  weight: number
  category: FeatureCategory
  productStateLabel: string
}
