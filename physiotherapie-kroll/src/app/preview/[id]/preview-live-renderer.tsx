"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { CMSBlock } from "@/types/cms"
import type { BrandKey } from "@/components/brand/brandAssets"
import { CMSRenderer } from "@/components/cms/BlockRenderer"
import { PreviewClickBridge } from "./PreviewClickBridge"
import { Bug, BugOff } from "lucide-react"
import {
  EDITOR_MESSAGE_TYPES,
  PREVIEW_MESSAGE_TYPES,
  createBridgeEnvelope,
  isBridgeMessage,
  type EditorHighlightPayload,
  type EditorScrollToPayload,
  type EditorSetDraftPayload,
} from "@/shared/previewBridge/contract"
import { getBlockAnchorId } from "@/lib/navigation/scrollToAnchor"

function isLikelyBlockArray(v: unknown): v is CMSBlock[] {
  return (
    Array.isArray(v) &&
    v.every(
      (x) =>
        x &&
        typeof x === "object" &&
        "id" in (x as Record<string, unknown>) &&
        "type" in (x as Record<string, unknown>)
    )
  )
}

function withPreviewBrand(blocks: CMSBlock[], brand: BrandKey): CMSBlock[] {
  return blocks.map((b) => ({
    ...b,
    props: {
      ...(typeof b.props === "object" && b.props ? (b.props as Record<string, unknown>) : {}),
      __previewBrand: brand,
    } as Record<string, unknown>,
  } as unknown as CMSBlock))
}

function clearInlineOutline(el: HTMLElement) {
  el.style.outline = ""
  el.style.outlineOffset = ""
}

function applyInlineOutline(el: HTMLElement) {
  el.style.outline = "2px solid hsl(var(--primary))"
  el.style.outlineOffset = "2px"
}

export function PreviewLiveRenderer({
  pageId,
  initialBrand,
  initialPageSlug,
  initialBlocks,
}: {
  pageId: string
  initialBrand: BrandKey
  initialPageSlug: string
  initialBlocks: CMSBlock[]
}) {
  const [brand, setBrand] = useState<BrandKey>(initialBrand)
  const [pageSlug, setPageSlug] = useState<string>(initialPageSlug)
  const [blocks, setBlocks] = useState<CMSBlock[]>(() => withPreviewBrand(initialBlocks, initialBrand))

  const [showDebug, setShowDebug] = useState(false)
  const [queryBrand] = useState<string>(() => {
    if (typeof window === "undefined" || process.env.NODE_ENV === "production") return ""
    try {
      const sp = new URLSearchParams(window.location.search)
      return sp.get("brand") ?? ""
    } catch {
      return ""
    }
  })
  const [htmlDataBrand] = useState<string>(() => {
    if (typeof document === "undefined" || process.env.NODE_ENV === "production") return ""
    return document.documentElement.getAttribute("data-brand") ?? ""
  })
  const [headerBrand, setHeaderBrand] = useState<string>("")

  const sessionIdRef = useRef<string | null>(null)
  const lastHighlightedRef = useRef<HTMLElement | null>(null)
  const lastHighlightedBlockRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return
    try {
      const stored = window.sessionStorage.getItem("preview.debug")
      if (stored === "1") {
        const t = window.setTimeout(() => setShowDebug(true), 0)
        return () => window.clearTimeout(t)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return
    try {
      window.sessionStorage.setItem("preview.debug", showDebug ? "1" : "0")
    } catch {
      // ignore
    }
  }, [showDebug])

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return
    let alive = true
    ;(async () => {
      try {
        const res = await fetch(window.location.href, { method: "HEAD" })
        if (!alive) return
        setHeaderBrand(res.headers.get("x-brand") ?? "")
      } catch {
        // ignore
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  // In iframe context: prevent navigation for anchors/buttons unless explicitly allowed.
  useEffect(() => {
    const onClickCapture = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      if (!t) return
      const a = t.closest("a")
      if (a) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    document.addEventListener("click", onClickCapture, true)
    return () => document.removeEventListener("click", onClickCapture, true)
  }, [])

  // Receive draft updates + highlight from editor
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!isBridgeMessage(event.data)) return
      const msg = event.data
      if (msg.pageId !== pageId) return

      if (msg.type === EDITOR_MESSAGE_TYPES.EDITOR_ACK) {
        sessionIdRef.current = msg.sessionId ?? null
        return
      }

      if (msg.type === EDITOR_MESSAGE_TYPES.EDITOR_SET_DRAFT) {
        const payload = msg.payload as EditorSetDraftPayload
        const nextBrand = typeof payload?.brand === "string" ? (payload.brand as BrandKey) : brand
        if (typeof payload?.brand === "string") setBrand(nextBrand)
        if (typeof payload?.pageSlug === "string") setPageSlug(payload.pageSlug)
        if (isLikelyBlockArray(payload?.blocks)) setBlocks(withPreviewBrand(payload.blocks, nextBrand))
        return
      }

      if (msg.type === EDITOR_MESSAGE_TYPES.EDITOR_SCROLL_TO) {
        const payload = msg.payload as EditorScrollToPayload
        const blockId = typeof payload?.blockId === "string" ? payload.blockId : ""
        if (!blockId) return

        const el =
          document.querySelector<HTMLElement>(`[data-block-id="${CSS.escape(blockId)}"]`) ??
          document.getElementById(getBlockAnchorId(blockId))
        if (!el) return

        const behavior = payload.behavior === "auto" ? "auto" : "smooth"
        const blockAlign = payload.block ?? "center"
        const inlineAlign = payload.inline ?? "nearest"
        el.scrollIntoView({ behavior, block: blockAlign, inline: inlineAlign })

        const flash = ["ring-2", "ring-primary/50", "ring-offset-2", "rounded-lg"] as const
        el.classList.add(...flash)
        window.setTimeout(() => {
          el.classList.remove(...flash)
        }, 800)
        return
      }

      if (msg.type === EDITOR_MESSAGE_TYPES.EDITOR_HIGHLIGHT) {
        const payload = msg.payload as EditorHighlightPayload

        // Clear previous
        if (lastHighlightedRef.current) clearInlineOutline(lastHighlightedRef.current)
        if (lastHighlightedBlockRef.current) clearInlineOutline(lastHighlightedBlockRef.current)
        lastHighlightedRef.current = null
        lastHighlightedBlockRef.current = null

        if (payload?.state !== "on") return

        const blockId = payload.blockId ?? null
        const elementId = payload.elementId ?? null
        const granular = payload.legalRichGranular

        if (blockId && granular?.contentBlockId) {
          const root = document.querySelector<HTMLElement>(`[data-block-id="${CSS.escape(blockId)}"]`)
          let granularEl: HTMLElement | null = null
          if (root) {
            if (granular.runId) {
              granularEl = root.querySelector<HTMLElement>(`[data-run-id="${CSS.escape(granular.runId)}"]`)
            }
            if (!granularEl && granular.listItemId) {
              granularEl = root.querySelector<HTMLElement>(`[data-list-item-id="${CSS.escape(granular.listItemId)}"]`)
            }
            if (!granularEl) {
              granularEl = root.querySelector<HTMLElement>(
                `[data-content-block-id="${CSS.escape(granular.contentBlockId)}"]`,
              )
            }
          }
          if (granularEl) {
            applyInlineOutline(granularEl)
            lastHighlightedRef.current = granularEl
            return
          }
        }

        if (elementId) {
          const el = document.querySelector<HTMLElement>(`[data-element-id="${CSS.escape(elementId)}"]`)
          if (el) {
            applyInlineOutline(el)
            lastHighlightedRef.current = el
          }
        }

        if (blockId) {
          const blockEl = document.querySelector<HTMLElement>(`[data-block-id="${CSS.escape(blockId)}"]`)
          if (blockEl) {
            applyInlineOutline(blockEl)
            lastHighlightedBlockRef.current = blockEl
          }
        }
      }
    }

    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [pageId])

  const stableBlocks = useMemo(() => blocks, [blocks])
  const previewBrandFromBlocks =
    ((stableBlocks?.[0]?.props as Record<string, unknown> | undefined)?.__previewBrand as string | undefined) ?? ""

  const handleEditField = (blockId: string, fieldPath: string, anchorRect?: DOMRect) => {
    const rect = anchorRect
      ? {
          left: anchorRect.left,
          top: anchorRect.top,
          right: anchorRect.right,
          bottom: anchorRect.bottom,
          width: anchorRect.width,
          height: anchorRect.height,
        }
      : null

    window.parent?.postMessage(
      createBridgeEnvelope(
        PREVIEW_MESSAGE_TYPES.PREVIEW_START_EDIT,
        pageId,
        {
          blockId,
          fieldPath,
          rect,
        },
        { source: "preview", sessionId: sessionIdRef.current ?? undefined }
      ),
      "*"
    )
  }

  return (
    <>
      {process.env.NODE_ENV !== "production" ? (
        <button
          type="button"
          className="fixed left-3 bottom-3 z-9999 inline-flex items-center gap-2 rounded-lg border border-border bg-background/90 px-3 py-2 text-xs text-foreground shadow-sm backdrop-blur hover:bg-background"
          onClick={() => setShowDebug((v) => !v)}
        >
          {showDebug ? <BugOff className="h-4 w-4" /> : <Bug className="h-4 w-4" />}
          {showDebug ? "Debug aus" : "Debug"}
        </button>
      ) : null}

      {process.env.NODE_ENV !== "production" && showDebug ? (
        <div
          className="fixed left-3 top-3 z-9999 rounded-lg border border-border bg-background/90 px-3 py-2 text-xs text-foreground shadow-sm backdrop-blur"
          style={{ pointerEvents: "none" }}
        >
          <div className="font-semibold">Preview Debug</div>
          <div className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
            <div className="text-muted-foreground">brand(state)</div>
            <div className="font-mono">{String(brand)}</div>
            <div className="text-muted-foreground">brand(query)</div>
            <div className="font-mono">{queryBrand || "—"}</div>
            <div className="text-muted-foreground">__previewBrand</div>
            <div className="font-mono">{previewBrandFromBlocks || "—"}</div>
            <div className="text-muted-foreground">pageSlug</div>
            <div className="font-mono">{pageSlug || "—"}</div>
            <div className="text-muted-foreground">html[data-brand]</div>
            <div className="font-mono">{htmlDataBrand || "—"}</div>
            <div className="text-muted-foreground">resp[x-brand]</div>
            <div className="font-mono">{headerBrand || "—"}</div>
          </div>
        </div>
      ) : null}
      <PreviewClickBridge pageId={pageId} />
      <CMSRenderer blocks={stableBlocks} pageSlug={pageSlug} brand={brand} editable onEditField={handleEditField} />
    </>
  )
}

