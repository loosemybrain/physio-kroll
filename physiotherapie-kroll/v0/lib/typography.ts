/**
 * Merges a base set of Tailwind typography classes with optional CMS overrides.
 * If `overrideClasses` is a non-empty string it replaces the defaults entirely;
 * otherwise the defaults are returned unchanged.
 */
export function mergeTypographyClasses(
  defaultClasses: string,
  overrideClasses?: unknown
): string {
  if (typeof overrideClasses === "string" && overrideClasses.trim().length > 0) {
    return overrideClasses.trim()
  }
  return defaultClasses
}
