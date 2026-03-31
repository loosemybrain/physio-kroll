/**
 * Preview Bridge Contract v1
 * Single source of truth for postMessage communication between Editor (parent) and Preview (iFrame)
 */

export const PREVIEW_BRIDGE_NS = "cms.previewBridge" as const
export const PREVIEW_BRIDGE_V = 1 as const

/**
 * Message types exchanged between Preview and Editor
 */
export const PREVIEW_MESSAGE_TYPES = {
  PREVIEW_READY: "PREVIEW_READY",
  PREVIEW_SELECT: "PREVIEW_SELECT",
  PREVIEW_START_EDIT: "PREVIEW_START_EDIT",
  PREVIEW_HOVER: "PREVIEW_HOVER",
  PREVIEW_SCROLL: "PREVIEW_SCROLL",
} as const

export const EDITOR_MESSAGE_TYPES = {
  EDITOR_ACK: "EDITOR_ACK",
  EDITOR_HIGHLIGHT: "EDITOR_HIGHLIGHT",
  EDITOR_SCROLL_TO: "EDITOR_SCROLL_TO",
  EDITOR_SET_MODE: "EDITOR_SET_MODE",
  EDITOR_SET_DRAFT: "EDITOR_SET_DRAFT",
} as const

export type PreviewMessageType = typeof PREVIEW_MESSAGE_TYPES[keyof typeof PREVIEW_MESSAGE_TYPES]
export type EditorMessageType = typeof EDITOR_MESSAGE_TYPES[keyof typeof EDITOR_MESSAGE_TYPES]
export type MessageType = PreviewMessageType | EditorMessageType

/**
 * Request ID generator with fallback
 */
export function createRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  // Fallback: timestamp + random component
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Payloads for Preview -> Editor messages
 */

export interface PreviewReadyPayload {
  capabilities: string[] // e.g. ["select", "startEdit", "hover"]
}

/** Feine Preview-Selektion innerhalb `legalRichText` (strukturierte `contentBlocks`). */
export type LegalRichPreviewGranularSelection = {
  contentBlockId: string
  listItemId?: string | null
  runId?: string | null
}

export interface PreviewSelectPayload {
  blockId: string
  elementId?: string | null
  mode: "block" | "element"
  repeater?: { fieldPath: string; itemId: string } | null
  /**
   * `legalRichText` structured list: clicked `<li>` id (`data-legal-rich-list-item-id`).
   * Nur sinnvoll wenn `repeater.fieldPath === "contentBlocks"`.
   */
  legalRichListItemId?: string | null
  /**
   * Geklicktes Textsegment (`data-run-id`), sofern im Preview-Kontext markiert.
   */
  legalRichRunId?: string | null
  /**
   * Bounding rect of the selected BLOCK root in PREVIEW viewport coordinates.
   * Parent can use this to pin overlay to the selected block without relying on hover state.
   */
  rect?: { left: number; top: number; right: number; bottom: number; width: number; height: number } | null
}

export interface PreviewStartEditPayload {
  blockId: string
  elementId?: string | null
  fieldPath?: string | null
  /**
   * Bounding rect of the clicked field element in PREVIEW viewport coordinates.
   * Parent must translate using iframe.getBoundingClientRect().
   */
  rect?: { left: number; top: number; right: number; bottom: number; width: number; height: number } | null
}

export interface PreviewHoverPayload {
  blockId?: string | null
  elementId?: string | null
  /**
   * Bounding rect in PREVIEW viewport coordinates.
   * Parent must translate using iframe.getBoundingClientRect().
   */
  rect?: { left: number; top: number; right: number; bottom: number; width: number; height: number } | null
}

export interface PreviewScrollPayload {
  blockId: string
}

/**
 * Payloads for Editor -> Preview messages
 */

export interface EditorAckPayload {
  sessionId: string
}

export interface EditorHighlightPayload {
  state: "on" | "off"
  blockId?: string | null
  elementId?: string | null
  /** Rechteck-Highlight innerhalb eines `legalRichText`-Blocks (Preview). */
  legalRichGranular?: LegalRichPreviewGranularSelection | null
}

export interface EditorScrollToPayload {
  blockId: string
  behavior?: "auto" | "smooth"
  block?: "start" | "center" | "end" | "nearest"
  inline?: "start" | "center" | "end" | "nearest"
  /** Optional: Ursprung (Debugging/UX); ändert keine Scroll-Logik im Preview. */
  source?: "outline" | "editor"
}

export interface EditorSetModePayload {
  mode: "view" | "edit"
}

export interface EditorSetDraftPayload {
  brand: string
  pageSlug: string
  blocks: unknown[]
}

/**
 * Unified payload type
 */
export type MessagePayload =
  | PreviewReadyPayload
  | PreviewSelectPayload
  | PreviewStartEditPayload
  | PreviewHoverPayload
  | PreviewScrollPayload
  | EditorAckPayload
  | EditorHighlightPayload
  | EditorScrollToPayload
  | EditorSetModePayload
  | EditorSetDraftPayload

/**
 * Bridge envelope (outer message structure)
 */
export interface BridgeEnvelope<T extends MessagePayload = MessagePayload> {
  v: typeof PREVIEW_BRIDGE_V
  ns: typeof PREVIEW_BRIDGE_NS
  type: MessageType
  pageId: string
  requestId: string
  timestamp: number
  sessionId?: string // Required after EDITOR_ACK handshake
  source?: "preview" | "editor" // Optional, for debugging
  payload: T
}

/**
 * Type guard: checks if data is a valid BridgeEnvelope
 */
export function isBridgeMessage(data: unknown): data is BridgeEnvelope {
  if (!data || typeof data !== "object") return false

  const msg = data as Record<string, unknown>
  
  // Check required fields
  if (msg.v !== PREVIEW_BRIDGE_V) return false
  if (msg.ns !== PREVIEW_BRIDGE_NS) return false
  if (typeof msg.type !== "string") return false
  if (typeof msg.pageId !== "string") return false
  if (typeof msg.requestId !== "string") return false
  if (typeof msg.timestamp !== "number") return false
  if (!msg.payload || typeof msg.payload !== "object") return false

  // sessionId is optional but if present must be string
  if ("sessionId" in msg && msg.sessionId !== undefined && typeof msg.sessionId !== "string") {
    return false
  }

  return true
}

/**
 * Helper to create a BridgeEnvelope with defaults
 */
export function createBridgeEnvelope<T extends MessagePayload>(
  type: MessageType,
  pageId: string,
  payload: T,
  options?: {
    sessionId?: string
    source?: "preview" | "editor"
    requestId?: string
    timestamp?: number
  }
): BridgeEnvelope<T> {
  return {
    v: PREVIEW_BRIDGE_V,
    ns: PREVIEW_BRIDGE_NS,
    type,
    pageId,
    payload,
    requestId: options?.requestId ?? createRequestId(),
    timestamp: options?.timestamp ?? Date.now(),
    sessionId: options?.sessionId,
    source: options?.source,
  }
}
