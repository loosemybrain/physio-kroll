"use client"

import { useMemo, useState, useRef, useEffect, useCallback, useLayoutEffect } from "react"
import { useLiveScrollLock } from "@/hooks/use-live-scroll-lock"
import { useInspectorAutoscroll } from "@/hooks/use-inspector-autoscroll"
import { ArrowLeft, Save, Send, Type, ImageIcon, Layout, Grid3X3, Megaphone, Trash2, Square, Grid, HelpCircle, Users, User, Plus, ChevronUp, ChevronDown, Copy, FileText, MessageSquareQuote, Images, Clock, CalendarDays, Table2, Info, Cookie } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { BlockSectionProps, CMSBlock, HeroBlock, CourseScheduleBlock, CourseSlot, CourseScheduleWeekday, PageSubtype, PageType } from "@/types/cms"
import { isLegalPageType, PAGE_TYPE_VALUES, PAGE_SUBTYPE_VALUES } from "@/types/cms"
import { useSearchParams } from "next/navigation"
import { BlockRenderer } from "@/components/cms/BlockRenderer"
import { usePage } from "@/lib/cms/useLocalCms"
import { createEmptyPage, generateUniqueSlug, type AdminPage } from "@/lib/cms/supabaseStore"
import type { BrandKey } from "@/components/brand/brandAssets"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getBlockDefinition } from "@/cms/blocks/registry"
import { normalizeBlock } from "@/cms/blocks/normalize"
import { getDefaultBlocksForPageType, doBlocksMatchDefaultLegalSet } from "@/cms/blocks/defaultPageBlocks"
import { arrayRemove, arrayMove, arrayInsert } from "@/lib/cms/arrayOps"
import { duplicateBlock } from "@/cms/blocks/duplicateBlock"
import { InlineFieldEditor } from "./InlineFieldEditor"
import { ImageField } from "./ImageField"
import { Accordion } from "@/components/ui/accordion"
import { validatePageForPublish, type PublishIssue } from "@/cms/validation/publishValidator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, X } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import type { TypographySettings } from "@/lib/typography"
import { ColorField } from "./ColorField"
import { LivePreviewTheme } from "./LivePreviewTheme"
import { ShadowInspector } from "./ShadowInspector"
import type { ElementConfig } from "@/types/cms"
import { INSPECTOR_CARD_ID_ATTR } from "./inspector/InspectorCardItem"
import { PageEditorHeader } from "./editor/PageEditorHeader"
import { PageEditorPreview } from "./editor/PageEditorPreview"
import { PageEditorInspector } from "./editor/PageEditorInspector"
import { usePageEditorActions } from "@/hooks/usePageEditorActions"
import { useEditorSelection } from "@/hooks/useEditorSelection"


interface PageEditorProps {
  pageId: string | null
  onBack: () => void
}

const blockTypes: Array<{ icon: React.ElementType; label: string; type: CMSBlock["type"] }> = [
  { icon: Layout, label: "Hero", type: "hero" },
  { icon: Type, label: "Text", type: "text" },
  { icon: ImageIcon, label: "Image+Text", type: "imageText" },
  { icon: Grid3X3, label: "Features", type: "featureGrid" },
  { icon: Megaphone, label: "CTA", type: "cta" },
  { icon: Square, label: "Section", type: "section" },
  { icon: Grid, label: "Services", type: "servicesGrid" },
  { icon: MessageSquareQuote, label: "Testimonials", type: "testimonials" },
  { icon: Images, label: "Galerie", type: "gallery" },
  { icon: Images, label: "Bild-Slider", type: "imageSlider" },
  { icon: CalendarDays, label: "Kursplan", type: "courseSchedule" },
  { icon: Clock, label: "Öffnungszeiten", type: "openingHours" },
  { icon: HelpCircle, label: "FAQ", type: "faq" },
  { icon: Users, label: "Team", type: "team" },
  { icon: FileText, label: "Kontaktformular", type: "contactForm" },
  { icon: FileText, label: "Seitenkopf", type: "legalHero" },
  { icon: Type, label: "Fließtext", type: "legalRichText" },
  { icon: Table2, label: "Tabelle", type: "legalTable" },
  { icon: Info, label: "Info-Box", type: "legalInfoBox" },
  { icon: Cookie, label: "Cookie-Kategorien", type: "legalCookieCategories" },
  { icon: User, label: "Kontakt-Karte", type: "legalContactCard" },
]

function uuid() {
  // React keys/IDs must be unique even when multiple items are created within the same millisecond.
  // In some environments (SSR/older browsers) crypto.randomUUID() may be unavailable.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  // Fallback must still be a *valid UUID*, otherwise Supabase inserts/updates will fail
  // because blocks.id is a uuid column.
  const buf = new Uint8Array(16)
  const cryptoObj = (globalThis as unknown as { crypto?: Crypto }).crypto
  if (cryptoObj?.getRandomValues) {
    cryptoObj.getRandomValues(buf)
  }

  // RFC 4122 v4
  buf[6] = (buf[6] & 0x0f) | 0x40
  buf[8] = (buf[8] & 0x3f) | 0x80

  const hex = [...buf].map((b) => b.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function defaultBlock<T extends CMSBlock["type"]>(type: T, brand: BrandKey): Extract<CMSBlock, { type: T }> {
  const id = uuid()
  const definition = getBlockDefinition(type)
  const defaults = { ...definition.defaults }
  
  // Override brand-specific defaults
  if (type === "hero" && "mood" in defaults) {
    defaults.mood = brand
  }
  
      return {
        id,
        type,
    props: defaults,
  } as Extract<CMSBlock, { type: T }>
}

/**
 * Helper to get value from object by path (e.g. "headline" or "props.content")
 */
/**
 * Helper to get value from object by path (e.g. "headline" or "cards.0.title")
 * Supports nested paths including arrays with object items
 */
function getByPath(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split(".")
  let current: unknown = obj
  for (const key of keys) {
    if (current && typeof current === "object") {
      if (Array.isArray(current)) {
        // Handle array index access (e.g., "cards.0")
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

/**
 * Helper to set value in object by path (immutable)
 * Supports nested paths like "trustItems.0" for arrays
 * Supports nested object paths in arrays like "cards.0.title"
 */
function setByPath<T extends Record<string, unknown>>(obj: T, path: string, value: unknown): T {
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
      // If currentValue is not an array yet (e.g. trustItems missing), create one.
      // Also: if it was accidentally stored as an object with numeric keys, convert it.
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
      
      // If there are more keys after the index, it's a nested object in the array (e.g., "cards.0.title")
      if (rest.length > 1) {
        // Get the object at this index, or create a new one
        const arrayItem = (newArray[index] && typeof newArray[index] === "object" && !Array.isArray(newArray[index]))
          ? { ...(newArray[index] as Record<string, unknown>) }
          : {}
        
        // Recursively set the nested path (e.g., "title" from "cards.0.title")
        const nestedPath = rest.slice(1).join(".")
        newArray[index] = setByPath(arrayItem as Record<string, unknown>, nestedPath, value)
      } else {
        // Direct array index assignment (e.g., "trustItems.0")
        newArray[index] = value
      }
      
      return { ...obj, [first]: newArray } as T
    }
  }
  
  // Handle nested objects
  const nested = (currentValue && typeof currentValue === "object" && !Array.isArray(currentValue))
    ? (currentValue as Record<string, unknown>)
    : {}
  return {
    ...obj,
    [first]: setByPath(nested, rest.join("."), value),
  } as T
}

function normalizeStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string") as string[]
  if (typeof v === "string") return [v]
  if (v && typeof v === "object") {
    const rec = v as Record<string, unknown>
    const numericKeys = Object.keys(rec).filter((k) => /^\d+$/.test(k)).sort((a, b) => Number(a) - Number(b))
    if (numericKeys.length > 0) {
      return numericKeys
        .map((k) => rec[k])
        .filter((x) => typeof x === "string") as string[]
    }
  }
  return []
}

function mapHeroFieldPathForActiveBrand(
  block: CMSBlock,
  fieldPath: string,
  activeBrandTab: Record<string, "physiotherapy" | "physio-konzept">
): string {
  if (block.type !== "hero") return fieldPath

  const heroProps = block.props as HeroBlock["props"]
  const brand = activeBrandTab[block.id] || heroProps.mood || "physiotherapy"

  const brandContentFieldMap: Record<string, string> = {
    headline: `brandContent.${brand}.headline`,
    subheadline: `brandContent.${brand}.subheadline`,
    ctaText: `brandContent.${brand}.ctaText`,
    ctaHref: `brandContent.${brand}.ctaHref`,
    secondaryCtaText: `brandContent.${brand}.secondaryCtaText`,
    secondaryCtaHref: `brandContent.${brand}.secondaryCtaHref`,
    badgeText: `brandContent.${brand}.badgeText`,
    playText: `brandContent.${brand}.playText`,
    floatingTitle: `brandContent.${brand}.floatingTitle`,
    floatingValue: `brandContent.${brand}.floatingValue`,
    floatingLabel: `brandContent.${brand}.floatingLabel`,
  }

  if (fieldPath.startsWith("trustItems.")) {
    return `brandContent.${brand}.${fieldPath}`
  }

  return brandContentFieldMap[fieldPath] || fieldPath
}

/**
 * Determines if a field should be multiline based on block type and field path
 */
function isMultilineField(blockType: CMSBlock["type"], fieldPath: string): boolean {
  if (fieldPath === "content") {
    return true // text.content, imageText.content are always multiline
  }
  
  // cards.*.text fields are multiline
  if (fieldPath.match(/^cards\.\d+\.text$/)) {
    return true
  }
  
  // faq items.*.answer fields are multiline
  if (fieldPath.match(/^items\.\d+\.answer$/)) {
    return true
  }
  
  // featureGrid features.*.description fields are multiline
  if (fieldPath.match(/^features\.\d+\.description$/)) {
    return true
  }
  
  // hero.subheadline and cta.subheadline are single-line (Input)
  if (fieldPath === "subheadline") {
    return false
  }
  
  // All other fields are single-line by default
  return false
}

export function PageEditor({ pageId, onBack }: PageEditorProps) {
  const searchParams = useSearchParams()
  const newPageParams = useMemo(() => {
    if (pageId && pageId !== "new") return undefined
    const pt = searchParams.get("pageType")
    const st = searchParams.get("pageSubtype")
    const pageType = pt && PAGE_TYPE_VALUES.includes(pt as PageType) ? (pt as PageType) : undefined
    const pageSubtype = st && PAGE_SUBTYPE_VALUES.includes(st as NonNullable<PageSubtype>) ? (st as PageSubtype) : undefined
    if (!pageType && !pageSubtype) return undefined
    return { pageType, pageSubtype }
  }, [pageId, searchParams])
  const { page, setPage, save } = usePage(pageId, { newPageParams })
  const { toast } = useToast()
  const isNewPage = !pageId || pageId === "new"
  
  // Central selection model
  const editorSelection = useEditorSelection()
  const { selectedBlockId, selectedElementId, activeFieldPath, selectBlock, selectField, selectElement, deselectElement, clearSelection, blockIdChanged } = editorSelection
  
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>>({})

  /** Internal marker: true only while the page is a new legal page with untouched default start blocks. Used to allow automatic block replacement on pageSubtype change. Not persisted. */
  const [initialLegalDefaultsActive, setInitialLegalDefaultsActive] = useState(false)
  
  // Inspector scroll ref and accordion state (must be defined before hooks that use it)
  const inspectorScrollRef = useRef<HTMLDivElement>(null)
  const [accordionValue, setAccordionValue] = useState<string | undefined>(undefined)
  
  // Live scroll lock hook
  const { liveScrollRef, withLiveScrollLock } = useLiveScrollLock()
  
  // Inspector auto-scroll hook
  useInspectorAutoscroll({
    inspectorScrollRef,
    selectedBlockId,
    selectedElementId,
    openAccordionValue: (value) => setAccordionValue(value),
    accordionValue,
  })
  
  // Reset element selection and accordion when block selection changes
  // Detect actual block switch (not just selection type change)
  useEffect(() => {
    if (blockIdChanged.changed) {
      // Block was switched (or cleared)
      setAccordionValue(undefined)
      // Only reset repeater cards if switching away from a block (not just clearing)
      if (blockIdChanged.from !== null && blockIdChanged.to !== blockIdChanged.from) {
        setExpandedRepeaterCards({})
      }
    }
  }, [blockIdChanged])

  // Set marker true only when a new page is first loaded with legal params from URL (no re-derivation from page.blocks)
  useEffect(() => {
    if (!page || !isNewPage) {
      setInitialLegalDefaultsActive(false)
      return
    }
    if (newPageParams?.pageType === "legal" && newPageParams?.pageSubtype) {
      setInitialLegalDefaultsActive(true)
    }
  }, [page?.id, isNewPage, newPageParams?.pageType, newPageParams?.pageSubtype])

  // Inline editor state
  const [inlineOpen, setInlineOpen] = useState(false)
  const [inlineBlockId, setInlineBlockId] = useState<string | null>(null)
  const [inlineFieldPath, setInlineFieldPath] = useState<string | null>(null)
  const [inlineAnchorRect, setInlineAnchorRect] = useState<DOMRect | null>(null)

  // Publish validation state
  const [publishIssues, setPublishIssues] = useState<PublishIssue[]>([])

  // Array operation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ blockId: string; arrayPath: string; index: number } | null>(null)

  // Brand tab state for Hero blocks (per block ID)
  const [activeBrandTab, setActiveBrandTab] = useState<Record<string, "physiotherapy" | "physio-konzept">>({})
  /** Global: welche Repeater-Card pro Block+Feld offen ist. Key = `${blockId}:${fieldPath}` → itemId. */
  const [expandedRepeaterCards, setExpandedRepeaterCards] = useState<Record<string, string | null>>({})
  /** Nach "Item hinzufügen": Fokus auf erste Eingabe der neuen Card (key + itemId). */
  const lastAddedRepeaterRef = useRef<{ key: string; itemId: string } | null>(null)

  // Nach "Item hinzufügen": Card in den sichtbaren Bereich scrollen und Fokus auf erste Eingabe
  useEffect(() => {
    const added = lastAddedRepeaterRef.current
    if (!added) return
    const currentExpanded = expandedRepeaterCards[added.key]
    if (currentExpanded !== added.itemId) return
    lastAddedRepeaterRef.current = null
    const container = inspectorScrollRef.current
    const card = container?.querySelector(`[${INSPECTOR_CARD_ID_ATTR}="${added.itemId}"]`) as HTMLElement | null
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "nearest" })
      setTimeout(() => {
        const firstInput = card.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea")
        firstInput?.focus({ preventScroll: true })
      }, 200)
    }
  }, [expandedRepeaterCards])

  // Track which Hero blocks have been migrated to avoid re-migration loops
  const migratedHeroBlocksRef = useRef<Set<string>>(new Set())

  // Ensure createEmptyPage is only called on client after mount to avoid hydration mismatch
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  // IMPORTANT:
  // Do NOT call createEmptyPage() during render as a fallback. It generates new UUIDs,
  // which makes "new page" interactions (e.g. brand toggle) flaky before `usePage()`
  // finishes initializing state.
  const current = page

  // Track block structure to only normalize when blocks are added/removed
  const prevBlockIdsRef = useRef<string>('')
  const isInitialMountRef = useRef(true)
  
  // Normalize blocks on load - but preserve user edits
  // Only normalize if blocks structure changed (length/ids), not on every prop update
  const normalizedBlocks = useMemo(() => {
    if (!current) return []
    // Check if blocks structure changed (new blocks added/removed)
    const blockIds = current.blocks.map(b => b.id).join(',')
    const structureChanged = blockIds !== prevBlockIdsRef.current
    
    // On initial mount or structure change, normalize
    if (isInitialMountRef.current || structureChanged) {
      isInitialMountRef.current = false
      prevBlockIdsRef.current = blockIds
      return current.blocks.map(normalizeBlock)
    }
    
    // Structure unchanged - preserve existing blocks as-is (don't re-normalize)
    // This prevents overwriting user edits with defaults
    return current.blocks
  }, [current?.blocks])

  const selectedBlock = useMemo(() => {
    if (!current) return null
    // Use current.blocks to avoid stale state
    const block = current.blocks.find((b) => b.id === selectedBlockId) ?? null
    // Don't normalize here - it would overwrite user edits with defaults
    return block
  }, [current?.blocks, selectedBlockId])
  
  // Initialize activeBrandTab when Hero block is selected (must be after selectedBlock definition)
  useEffect(() => {
    if (selectedBlock?.type === "hero" && !activeBrandTab[selectedBlock.id]) {
      const props = selectedBlock.props as HeroBlock["props"]
      // Use mood prop or default to physiotherapy
      const defaultBrand = props.mood || "physiotherapy"
      setActiveBrandTab((prev) => ({ ...prev, [selectedBlock.id]: defaultBrand }))
    }
  }, [selectedBlock, activeBrandTab])
  
  // Migrate Hero block brandContent structure (only once per block, in useEffect to avoid render loop)
  useEffect(() => {
    if (!selectedBlock || selectedBlock.type !== "hero") return
    const blockId = selectedBlock.id
    // Skip if already migrated
    if (migratedHeroBlocksRef.current.has(blockId)) return
    
    const heroProps = selectedBlock.props as HeroBlock["props"]
    let needsUpdate = false
    let updatedBrandContent = heroProps.brandContent || {
      physiotherapy: {
        headline: heroProps.headline || "",
        subheadline: heroProps.subheadline || "",
      },
      "physio-konzept": {
        headline: "",
        subheadline: "",
      },
    }
    
    // Check if migration is needed
    if (!heroProps.brandContent) {
      // Full migration from legacy props
      updatedBrandContent = {
        physiotherapy: {
          headline: heroProps.headline || "",
          subheadline: heroProps.subheadline || "",
          ctaText: heroProps.ctaText,
          ctaHref: heroProps.ctaHref,
          badgeText: heroProps.badgeText,
          playText: heroProps.playText,
          trustItems: heroProps.trustItems,
          floatingTitle: heroProps.floatingTitle,
          floatingValue: heroProps.floatingValue,
          floatingLabel: heroProps.floatingLabel,
          image: heroProps.mediaUrl ? { url: heroProps.mediaUrl } : undefined,
        },
        "physio-konzept": {
          headline: "",
          subheadline: "",
        },
      }
      needsUpdate = true
    } else {
      // Ensure both brands exist
      if (!updatedBrandContent.physiotherapy) {
        updatedBrandContent.physiotherapy = {
          headline: heroProps.headline || "",
          subheadline: heroProps.subheadline || "",
        }
        needsUpdate = true
      }
      if (!updatedBrandContent["physio-konzept"]) {
        updatedBrandContent["physio-konzept"] = {
          headline: "",
          subheadline: "",
        }
        needsUpdate = true
      }
      
      // Ensure headline and subheadline always exist
      if (typeof updatedBrandContent.physiotherapy.headline === "undefined") {
        updatedBrandContent.physiotherapy = {
          ...updatedBrandContent.physiotherapy,
          headline: heroProps.headline || "",
        }
        needsUpdate = true
      }
      if (typeof updatedBrandContent.physiotherapy.subheadline === "undefined") {
        updatedBrandContent.physiotherapy = {
          ...updatedBrandContent.physiotherapy,
          subheadline: heroProps.subheadline || "",
        }
        needsUpdate = true
      }
      if (typeof updatedBrandContent["physio-konzept"].headline === "undefined") {
        updatedBrandContent["physio-konzept"] = {
          ...updatedBrandContent["physio-konzept"],
          headline: "",
        }
        needsUpdate = true
      }
      if (typeof updatedBrandContent["physio-konzept"].subheadline === "undefined") {
        updatedBrandContent["physio-konzept"] = {
          ...updatedBrandContent["physio-konzept"],
          subheadline: "",
        }
        needsUpdate = true
      }
    }
    
    // Only update if we made changes
    if (needsUpdate) {
      const updatedProps = {
        ...heroProps,
        brandContent: updatedBrandContent,
      }
      // Mark as migrated before updating to prevent loop
      migratedHeroBlocksRef.current.add(blockId)
      updateSelectedProps(updatedProps as CMSBlock["props"])
    } else {
      // Mark as migrated even if no update needed
      migratedHeroBlocksRef.current.add(blockId)
    }
  }, [selectedBlock?.id]) // Only run when block ID changes
  
  // Focus active field when it changes (only when explicitly set via handleEditField, not on every render)
  const prevActiveFieldPathRef = useRef<string | null>(null)
  const prevSelectedBlockIdRef = useRef<string | null>(null)
  const isTypingRef = useRef(false)
  
  useEffect(() => {
    // Don't steal focus / scroll inside inspector while inline editor is open
    if (inlineOpen) {
      return
    }

    // Only focus if activeFieldPath or selectedBlock actually changed
    const fieldPathChanged = activeFieldPath !== prevActiveFieldPathRef.current
    const blockChanged = selectedBlock?.id !== prevSelectedBlockIdRef.current
    
    // Don't focus if user is currently typing
    if (isTypingRef.current) {
      return
    }
    
    if (activeFieldPath && (fieldPathChanged || blockChanged) && selectedBlock) {
      prevActiveFieldPathRef.current = activeFieldPath
      prevSelectedBlockIdRef.current = selectedBlock.id
      const fieldKey = `${selectedBlock.id}.${activeFieldPath}`
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const fieldRef = fieldRefs.current[fieldKey]
        // Only focus if the field exists and is not already focused
        if (fieldRef && document.activeElement !== fieldRef) {
          // Prevent scroll when focusing - use preventScroll option
          try {
            ;(fieldRef as HTMLElement).focus({ preventScroll: true })
          } catch {
            // Fallback for browsers that don't support preventScroll
            fieldRef.focus()
          }
          // Scroll only within Inspector sidebar, not the page
          fieldRef.scrollIntoView({ behavior: "smooth", block: "nearest" })
        }
      }, 0)
      return () => clearTimeout(timer)
    } else if (!activeFieldPath) {
      // Reset refs when activeFieldPath is cleared
      prevActiveFieldPathRef.current = null
      prevSelectedBlockIdRef.current = selectedBlock?.id || null
    }
  }, [activeFieldPath, selectedBlock, inlineOpen])

  // Get current value for inline editor - use current.blocks to avoid stale state
  const inlineValue = useMemo(() => {
    if (!inlineBlockId || !inlineFieldPath || !current) return ""
    const block = current.blocks.find((b) => b.id === inlineBlockId)
    if (!block) return ""
    const actualFieldPath = mapHeroFieldPathForActiveBrand(block, inlineFieldPath, activeBrandTab)
    const value = getByPath(block.props as Record<string, unknown>, actualFieldPath)
    return String(value ?? "")
  }, [inlineBlockId, inlineFieldPath, current?.blocks, activeBrandTab])
  
  // Determine if inline editor should be multiline - use current.blocks to avoid stale state
  const inlineMultiline = useMemo(() => {
    if (!inlineBlockId || !current) return false
    const block = current.blocks.find((b) => b.id === inlineBlockId)
    if (!block) return false
    return isMultilineField(block.type, inlineFieldPath || "")
  }, [inlineBlockId, inlineFieldPath, current?.blocks])
  
  // Get field label for inline editor - use current.blocks to avoid stale state
  const inlineLabel = useMemo(() => {
    if (!inlineBlockId || !inlineFieldPath || !current) return "Feld bearbeiten"
    const block = current.blocks.find((b) => b.id === inlineBlockId)
    if (!block) return "Feld bearbeiten"
    const definition = getBlockDefinition(block.type)
    const field = definition.inspectorFields.find((f) => f.key === inlineFieldPath)
    return field?.label || "Feld bearbeiten"
  }, [inlineBlockId, inlineFieldPath, current?.blocks])

  /** Preview → Inspector: Repeater-Item angeklickt → Block auswählen, passende Card öffnen, scroll/focus. (Must be before any early return.) */
  const handleSelectRepeaterItem = useCallback(
    (blockId: string, fieldPath: string, itemId: string) => {
      selectBlock(blockId)
      const key = `${blockId}:${fieldPath}`
      setExpandedRepeaterCards((prev) => ({ ...prev, [key]: itemId }))
      requestAnimationFrame(() => {
        const container = inspectorScrollRef.current
        if (!container) return
        const card = container.querySelector(`[${INSPECTOR_CARD_ID_ATTR}="${itemId}"]`) as HTMLElement | null
        if (card) {
          card.scrollIntoView({ behavior: "smooth", block: "nearest" })
          const firstInput = card.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea")
          setTimeout(() => firstInput?.focus({ preventScroll: true }), 150)
        }
      })
    },
    [selectBlock]
  )

  // Initialize editor actions hook with all mutations
  const editorActions = usePageEditorActions({
    current: current || ({} as AdminPage),
    setPage,
    selectedBlockId,
    activeFieldPath,
    isNewPage,
    initialLegalDefaultsActive,
    selectBlock,
    selectField,
    setActiveBrandTabForBlock: (blockId: string, brand: BrandKey) => {
      setActiveBrandTab((prevTabs) => {
        const nextTabs = { ...prevTabs }
        nextTabs[blockId] = brand
        return nextTabs
      })
    },
    setInitialLegalDefaultsActive,
    withLiveScrollLock,
    addBlockFn: (defaultBlock as (type: CMSBlock["type"], brand?: BrandKey) => CMSBlock),
  })

  // Return early until mounted + page state is ready (prevents SSR/client mismatch)
  // This must come AFTER all hooks to follow Rules of Hooks
  if (!mounted || !page) {
    return <div className="flex h-full items-center justify-center">Laden...</div>
  }

  // TS narrow: after the guard above, `current` is always set for runtime,
  // but we keep this check to narrow the `current` variable type.
  if (!current) {
    return <div className="flex h-full items-center justify-center">Fehler beim Laden der Seite</div>
  }




  // Wrappers for hook actions with PageEditor-specific logic (that need additional logic)
  const removeBlock = (id: string) => {
    editorActions.removeBlock(id)
    if (selectedBlockId === id) {
      clearSelection()
    }
  }

  const moveBlock = (index: number, direction: -1 | 1) => {
    // Validate bounds before calling hook
    if (index + direction < 0 || index + direction >= current.blocks.length) return
    editorActions.moveBlock(index, direction)
  }

  const handleRemoveArrayItem = (blockId: string, arrayPath: string, index: number) => {
    editorActions.handleRemoveArrayItem(blockId, arrayPath, index)
    setDeleteConfirmOpen(false)
    setDeleteTarget(null)
  }

  const updateSelectedProps = (nextProps: CMSBlock["props"]) => {
    if (!selectedBlock) return
    // Lock Live Preview scroll during update
    withLiveScrollLock(() => {
      editorActions.updateSelectedProps(nextProps)
    })
  }

  // Wrapper for updateBlockPropsById with scroll lock
  const updateBlockPropsById = (
    blockId: string,
    updater: (prevProps: Record<string, unknown>) => CMSBlock["props"]
  ) => {
    withLiveScrollLock(() => {
      editorActions.updateBlockPropsById(blockId, updater)
    })
  }

  const handleEditField = (blockId: string, fieldPath: string, anchorRect?: DOMRect) => {
    // Open inline editor
    setInlineBlockId(blockId)
    setInlineFieldPath(fieldPath)
    setInlineAnchorRect(anchorRect || null)
    setInlineOpen(true)
    
    // Also update inspector selection
    selectField(blockId, fieldPath)
    // Note: Don't clear selectedElementId - let it persist for shadow inspector
    // This allows users to select an element for shadows, then click on it to edit the text

    // Ensure the Inspector scrolls to the corresponding field even if it was already active.
    const key = `${blockId}.${fieldPath}`
    const tryScroll = () => {
      const el = fieldRefs.current[key]
      if (!el) return false
      try {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
      } catch {
        el.scrollIntoView()
      }
      return true
    }
    // Use rAF retries to wait for inspector DOM (and tab panel) to mount.
    let tries = 0
    const tick = () => {
      if (tryScroll()) return
      tries += 1
      if (tries > 12) return
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }
  
  // Handle inline editor change
  const handleInlineChange = (next: string) => {
    if (!inlineBlockId || !inlineFieldPath) return
    setInitialLegalDefaultsActive(false)
    setPage((prev) => {
      if (!prev) return prev
      const block = prev.blocks.find((b) => b.id === inlineBlockId)
      if (!block) return prev

      const actualFieldPath = mapHeroFieldPathForActiveBrand(block, inlineFieldPath, activeBrandTab)

      // --- SEED contactInfoCards on first edit (ContactForm only) ---
      let baseProps = block.props as Record<string, unknown>

      if (block.type === "contactForm" && actualFieldPath.startsWith("contactInfoCards.")) {
        const cur = (baseProps as any).contactInfoCards
        const isEmpty = !Array.isArray(cur) || cur.length === 0

        if (isEmpty) {
          baseProps = setByPath(baseProps, "contactInfoCards", [
            { id: "hours", icon: "clock", title: "Schnelle Antwort", value: "Innerhalb von 24 Stunden" },
            { id: "consultation", icon: "phone", title: "Kostenlose Beratung", value: "Unverbindliches Erstgespräch" },
            { id: "location", icon: "mapPin", title: "Lokale Betreuung", value: "Persönlich vor Ort für Sie da" },
          ]) as Record<string, unknown>
        }
      }
      // --- END seed ---

      const updatedProps = setByPath(
        baseProps,
        actualFieldPath,
        next
      ) as CMSBlock["props"]

      return {
        ...prev,
        blocks: prev.blocks.map((b) =>
          b.id === inlineBlockId ? ({ ...b, props: updatedProps } as CMSBlock) : b
        ),
      }
    })
  }

  
  // Handle inline editor close
  const handleInlineClose = () => {
    setInlineOpen(false)
    setInlineBlockId(null)
    setInlineFieldPath(null)
    setInlineAnchorRect(null)
  }

  const handleSaveDraft = async () => {
    try {
      const saved = await save({ ...current, status: "draft" })
      toast({
        title: "Gespeichert",
        description: `Seite "${saved.title}" wurde als Entwurf gespeichert.`,
      })
    } catch (e) {
      toast({
        title: "Fehler beim Speichern",
        description: "Die Seite konnte nicht gespeichert werden.",
      })
      console.error(e)
    }
  }

  const handlePublish = async () => {
    if (!current) {
      toast({
        title: "Fehler",
        description: "Keine Seite zum Veröffentlichen gefunden.",
      })
      return
    }

    // Validate page before publishing
    const validation = validatePageForPublish(current)
    
    if (!validation.ok) {
      // Set issues and show error
      setPublishIssues(validation.issues)
      
      // Auto-select first block with error
      if (validation.issues.length > 0) {
        const firstIssue = validation.issues[0]
        selectField(firstIssue.blockId, firstIssue.fieldPath)

        // If the first issue is in Hero, switch the Hero brand-tab to the page brand
        if (firstIssue.blockType === "hero") {
          setActiveBrandTab((prev) => ({ ...prev, [firstIssue.blockId]: current.brand }))
        }
        
        // Scroll to block in preview
        setTimeout(() => {
          const blockElement = document.querySelector(`[data-block-id="${firstIssue.blockId}"]`)
          if (blockElement) {
            blockElement.scrollIntoView({ behavior: "smooth", block: "center" })
          }
        }, 100)
      }
      
      toast({
        title: "Validierungsfehler",
        description: `${validation.issues.length} Fehler gefunden. Bitte beheben Sie die Fehler vor dem Veröffentlichen.`,
      })
      return
    }
    
    // Clear issues on successful validation
    setPublishIssues([])
    
    try {
      // Slug uniqueness in DB space, filtered by brand
      const slug = await generateUniqueSlug(current.title, current.id, current.brand)
      const saved = await save({ ...current, status: "published", slug })
      toast({
        title: "Veröffentlicht",
        description: `Seite "${saved.title}" wurde erfolgreich veröffentlicht. URL: /${saved.slug}`,
      })
    } catch (e) {
      toast({
        title: "Fehler beim Veröffentlichen",
        description: "Die Seite konnte nicht veröffentlicht werden.",
      })
      console.error(e)
    }
  }

  // Handle click on publish issue - navigate to block
  const handleIssueClick = (issue: PublishIssue) => {
    selectField(issue.blockId, issue.fieldPath)
    
    // Scroll to block in preview
    setTimeout(() => {
      const blockElement = document.querySelector(`[data-block-id="${issue.blockId}"]`)
      if (blockElement) {
        blockElement.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }, 100)
  }



  const confirmDeleteItem = (blockId: string, arrayPath: string, index: number) => {
    // Always confirm for team.members and servicesGrid.cards, optional for others
    const needsConfirmation = arrayPath === "members" || arrayPath === "cards"
    
    if (needsConfirmation) {
      setDeleteTarget({ blockId, arrayPath, index })
      setDeleteConfirmOpen(true)
    } else {
      // For other arrays, delete directly (trustItems, features, items)
      handleRemoveArrayItem(blockId, arrayPath, index)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {publishIssues.length > 0 && (
        <div className="border-b border-destructive/50 bg-destructive/5 px-4 py-3">
          <Alert variant="destructive" className="mb-0">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {publishIssues.length} Validierungsfehler gefunden
            </AlertTitle>
            <AlertDescription>
              <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                {publishIssues.slice(0, 8).map((issue, index) => {
                  const issueKey = `${issue.blockId}-${issue.fieldPath ?? "root"}-${issue.blockType}-${issue.message}-${index}`
                  return (
                  <button
                    key={issueKey}
                    onClick={() => handleIssueClick(issue)}
                    className="block w-full text-left rounded px-2 py-1 text-sm hover:bg-destructive/10 transition-colors"
                  >
                    <span className="font-medium">{issue.blockType}</span>
                    {issue.fieldPath && (
                      <span className="text-muted-foreground"> • {issue.fieldPath}</span>
                    )}
                    {": "}
                    <span>{issue.message}</span>
                  </button>
                  )
                })}
                {publishIssues.length > 8 && (
                  <p className="text-xs text-muted-foreground pt-1">
                    ... und {publishIssues.length - 8} weitere Fehler
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <PageEditorHeader
        current={current}
        onBack={onBack}
        onUpdatePage={editorActions.updatePage}
        onBrandChange={editorActions.handlePageBrandChange}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
      />

      <div className="flex flex-1 overflow-hidden h-full min-h-0">
        <PageEditorPreview
          current={current}
          selectedBlockId={selectedBlockId}
          selectedElementId={selectedElementId}
          expandedRepeaterCards={expandedRepeaterCards}
          inlineOpen={inlineOpen}
          inlineAnchorRect={inlineAnchorRect}
          inlineLabel={inlineLabel}
          inlineValue={inlineValue}
          inlineMultiline={inlineMultiline}
          onInlineChange={handleInlineChange}
          onInlineClose={handleInlineClose}
          onEditField={handleEditField}
          onBlockSelect={(blockId) => {
            selectBlock(blockId)
          }}
          onElementClick={(blockId, elementId) => {
            selectElement(blockId, elementId)
            const block = current?.blocks.find((b: CMSBlock) => b.id === blockId)
            if (block?.type === "section" && elementId === "section.divider") {
              selectField(blockId, "dividerColor")
            }
          }}
          onMoveBlock={(index, direction) => moveBlock(index, direction as -1 | 1)}
          onDuplicateBlock={(index) => editorActions.duplicateAt(index)}
          onRemoveBlock={removeBlock}
          onSelectRepeaterItem={handleSelectRepeaterItem}
        />

        {/* Block Editor Panel */}
        <div
          ref={inspectorScrollRef}
          className="relative w-96 border-l border-border bg-background overflow-y-auto overflow-x-hidden z-50 min-h-0"
          style={{ height: "100%" }}
        >
          <PageEditorInspector
            isNewPage={isNewPage}
            current={current}
            selectedBlock={selectedBlock}
            selectedBlockId={selectedBlockId}
            expandedRepeaterCards={expandedRepeaterCards}
            setExpandedRepeaterCards={setExpandedRepeaterCards}
            lastAddedRepeaterRef={lastAddedRepeaterRef}
            updateSelectedProps={updateSelectedProps}
            updateBlockPropsById={updateBlockPropsById}
            removeBlock={removeBlock}
            editorActions={editorActions}
            confirmDeleteItem={confirmDeleteItem}
            handleRemoveArrayItem={handleRemoveArrayItem}
            setInitialLegalDefaultsActive={setInitialLegalDefaultsActive}
            withLiveScrollLock={withLiveScrollLock}
            save={save}
            setPage={setPage}
            activeFieldPath={activeFieldPath}
            selectedElementId={selectedElementId}
            selectField={selectField}
            deselectElement={deselectElement}
            selectElement={selectElement}
            fieldRefs={fieldRefs}
            isTypingRef={isTypingRef}
            blockTypes={blockTypes}
            moveBlock={moveBlock}
            selectBlock={selectBlock}
            activeBrandTab={activeBrandTab}
            setActiveBrandTab={setActiveBrandTab}
            accordionValue={accordionValue}
            setAccordionValue={setAccordionValue}
          />
        </div>
      </div>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Das Element wird permanent gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  handleRemoveArrayItem(deleteTarget.blockId, deleteTarget.arrayPath, deleteTarget.index)
                }
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}