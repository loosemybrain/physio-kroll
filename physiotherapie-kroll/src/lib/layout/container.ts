/**
 * Centralized container classes for consistent layout across the app
 * Used by both CMS blocks and footer to ensure visual alignment
 */

export const CONTAINER_CLASSES = {
  /**
   * Inner content container - used for "contained" layout mode
   * Matches the standard block section width (max-w-7xl)
   */
  contained: "mx-auto w-full max-w-7xl px-4",

  /**
   * Full width container with horizontal padding only
   * Used for "full" layout mode backgrounds
   */
  full: "mx-auto w-full px-4",
} as const

export type ContainerMode = keyof typeof CONTAINER_CLASSES

/**
 * Get container classes for a given mode
 */
export function getContainerClass(mode: ContainerMode = "contained"): string {
  return CONTAINER_CLASSES[mode]
}
