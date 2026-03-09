/**
 * Array operation utilities for CMS blocks
 * All operations return new arrays (immutable)
 */

/**
 * Inserts an item at the specified index
 */
export function arrayInsert<T>(arr: T[], index: number, item: T): T[] {
  const newArr = [...arr]
  newArr.splice(index, 0, item)
  return newArr
}

/**
 * Removes an item at the specified index
 */
export function arrayRemove<T>(arr: T[], index: number): T[] {
  const newArr = [...arr]
  newArr.splice(index, 1)
  return newArr
}

/**
 * Moves an item from one index to another
 */
export function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const newArr = [...arr]
  const [removed] = newArr.splice(from, 1)
  newArr.splice(to, 0, removed)
  return newArr
}

/**
 * Generates a UUID v4. Prefers crypto.randomUUID(); fallback is a pure-JS implementation
 * so that block ids are always valid UUIDs (required by API and DB).
 */
export function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback: UUID v4 in pure JS (no timestamp-based ids that API would reject)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
