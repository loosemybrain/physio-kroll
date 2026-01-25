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
 * Generates a unique ID using crypto.randomUUID() or fallback
 */
export function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}
