/**
 * Upload with Concurrency Limit Utility
 * Processes items sequentially within a max concurrency limit
 * Does not stop queue on individual item failures
 */

export type UploadStatus = {
  id: string
  fileName: string
  status: "pending" | "uploading" | "success" | "error"
  error?: string
  progress?: number
}

/**
 * Executes async operations with a concurrency limit
 * @param items - Array of items to process
 * @param limit - Maximum number of concurrent operations (default: 4)
 * @param fn - Async function to execute for each item
 * @param onProgress - Optional callback for progress updates
 */
export async function uploadWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>,
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  if (items.length === 0) return

  const queue = [...items]
  const inProgress = new Set<Promise<void>>()
  let completed = 0
  let failed = 0

  while (queue.length > 0 || inProgress.size > 0) {
    // Fill up to the concurrency limit
    while (inProgress.size < limit && queue.length > 0) {
      const item = queue.shift()!
      
      const promise = fn(item)
        .then(() => {
          completed++
          onProgress?.(completed, items.length)
        })
        .catch((error) => {
          // Log but don't throw - continue with other items
          console.error(`[uploadWithConcurrency] Item failed:`, error)
          failed++
        })
        .finally(() => {
          inProgress.delete(promise)
        })

      inProgress.add(promise)
    }

    // Wait for at least one to complete before refilling
    if (inProgress.size > 0) {
      await Promise.race(inProgress)
    }
  }

  // Final wait for all remaining
  await Promise.all(inProgress)
}

/**
 * Utility to filter and validate files before upload
 */
export function validateUploadFiles(files: FileList | File[]): { valid: File[]; errors: string[] } {
  const valid: File[] = []
  const errors: string[] = []
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedMimeTypes = ["image/", "video/"]

  Array.from(files).forEach((file, index) => {
    if (!file.name) {
      errors.push(`Datei ${index + 1}: Ungültiger Dateiname`)
      return
    }

    if (file.size === 0) {
      errors.push(`${file.name}: Datei ist leer`)
      return
    }

    if (file.size > maxSize) {
      errors.push(`${file.name}: Datei ist größer als 10 MB`)
      return
    }

    const isAllowed = allowedMimeTypes.some((type) => file.type.startsWith(type))
    if (!isAllowed) {
      errors.push(`${file.name}: Nur Bilder und Videos erlaubt`)
      return
    }

    valid.push(file)
  })

  return { valid, errors }
}

/**
 * Extract files from FileList, handling both regular files and folder uploads
 */
export function extractFilesFromInput(
  input: FileList | File[] | null | undefined,
  options?: { includeFolderPath?: boolean }
): { files: File[]; folderPaths?: Map<string, string> } {
  if (!input) return { files: [] }

  const files = Array.from(input)
  const folderPaths = options?.includeFolderPath ? new Map<string, string>() : undefined

  if (folderPaths) {
    files.forEach((file) => {
      // webkitRelativePath is set when folder upload is used
      const relativePath = (file as any).webkitRelativePath || ""
      if (relativePath) {
        folderPaths.set(file.name, relativePath)
      }
    })
  }

  return { files, folderPaths }
}
