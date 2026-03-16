/**
 * Editor path operations for nested object/array mutation
 * Supports patterns like "cards.0.title" for nested array access
 */

export function getByPath(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split(".")
  let current: unknown = obj
  for (const key of keys) {
    if (current && typeof current === "object") {
      if (Array.isArray(current)) {
        const index = parseInt(key, 10)
        if (!isNaN(index) && index >= 0 && index < current.length) {
          current = current[index]
        } else {
          return undefined
        }
      } else if (key in current) {
        current = (current as Record<string, unknown>)[key]
      } else {
        return undefined
      }
    } else {
      return undefined
    }
  }
  return current
}

export function setByPath<T extends Record<string, unknown>>(
  obj: T,
  path: string,
  value: unknown
): T {
  const keys = path.split(".")
  if (keys.length === 1) {
    return { ...obj, [keys[0]]: value } as T
  }

  const [first, ...rest] = keys
  const currentValue = obj[first]
  const maybeIndex = parseInt(rest[0] ?? "", 10)
  const isIndex = rest.length > 0 && !isNaN(maybeIndex) && maybeIndex >= 0

  // Handle arrays (e.g., "trustItems.0" or "cards.0.title")
  if (Array.isArray(currentValue) || isIndex) {
    const index = maybeIndex
    if (index >= 0) {
      let base: unknown[] = []
      if (Array.isArray(currentValue)) {
        base = [...currentValue]
      } else if (currentValue && typeof currentValue === "object") {
        const rec = currentValue as Record<string, unknown>
        const numericKeys = Object.keys(rec).filter((k) => /^\d+$/.test(k))
        if (numericKeys.length > 0) {
          const max = Math.max(...numericKeys.map((k) => parseInt(k, 10)))
          const arr = new Array(max + 1).fill("")
          for (const k of numericKeys) {
            arr[parseInt(k, 10)] = rec[k]
          }
          base = arr
        }
      }

      const newArray = [...base]

      // Extend array if needed BEFORE accessing
      while (newArray.length <= index) {
        newArray.push(rest.length > 1 ? {} : "")
      }

      // If there are more keys after the index, it's a nested object in the array
      if (rest.length > 1) {
        const arrayItem =
          newArray[index] &&
          typeof newArray[index] === "object" &&
          !Array.isArray(newArray[index])
            ? { ...(newArray[index] as Record<string, unknown>) }
            : {}

        const nestedPath = rest.slice(1).join(".")
        newArray[index] = setByPath(arrayItem as Record<string, unknown>, nestedPath, value)
      } else {
        // Direct array index assignment
        newArray[index] = value
      }

      return { ...obj, [first]: newArray } as T
    }
  }

  // Handle nested objects
  const nested =
    currentValue && typeof currentValue === "object" && !Array.isArray(currentValue)
      ? (currentValue as Record<string, unknown>)
      : {}
  return {
    ...obj,
    [first]: setByPath(nested, rest.join("."), value),
  } as T
}
