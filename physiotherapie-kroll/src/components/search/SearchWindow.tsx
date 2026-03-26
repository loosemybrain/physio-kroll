"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, X, Clock, Zap, Users, FileText, Hash } from "lucide-react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { BrandKey } from "@/components/brand/brandAssets"
import type { SearchItem, SearchResult } from "@/lib/search/types"
import { rankItems } from "@/lib/search/rank"

function iconFor(item: SearchItem): React.ReactNode {
  switch (item.category) {
    case "Team":
      return <Users className="h-5 w-5" />
    case "Kurse":
      return <Clock className="h-5 w-5" />
    case "Leistungen":
      return <Zap className="h-5 w-5" />
    case "Anker":
      return <Hash className="h-5 w-5" />
    case "Seiten":
    case "Navigation":
    case "Bereiche":
    default:
      return <FileText className="h-5 w-5" />
  }
}

export interface SearchWindowProps {
  brand: BrandKey
  navItems: SearchItem[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchWindow({ brand, navItems, isOpen, onOpenChange }: SearchWindowProps) {
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()
  const inputRef = useRef<HTMLInputElement>(null)
  const requestSeqRef = useRef(0)

  const brandTintHover = brand === "physio-konzept" ? "hover:bg-accent/10" : "hover:bg-primary/10"
  const brandTintIcon = brand === "physio-konzept" ? "text-accent/70" : "text-primary/70"
  const brandTintIconSoft = brand === "physio-konzept" ? "text-accent/60" : "text-primary/60"

  const [query, setQuery] = useState("")
  const [hasSearched, setHasSearched] = useState(false)
  const [pageItems, setPageItems] = useState<SearchItem[]>([])

  const allItems = useMemo(() => {
    // Dedup by href+title, keep highest priority
    const byKey = new Map<string, SearchItem>()
    for (const it of [...navItems, ...pageItems]) {
      const key = `${it.href}::${it.title.toLowerCase()}`
      const prev = byKey.get(key)
      if (!prev || (it.priority ?? 0) > (prev.priority ?? 0)) byKey.set(key, it)
    }
    return Array.from(byKey.values())
  }, [navItems, pageItems])

  const results: SearchResult[] = useMemo(() => rankItems(allItems, query, 30), [allItems, query])

  const quick = useMemo(() => {
    // Prefer anchors/sections, then pages
    const preferred = navItems
      .slice()
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
      .filter((i) => i.category === "Anker" || i.category === "Seiten" || i.category === "Bereiche")
    return preferred.slice(0, 4)
  }, [navItems])

  const grouped = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {}
    for (const r of results) {
      const key = r.category
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    }
    return groups
  }, [results])

  const handleClose = () => {
    onOpenChange(false)
    setQuery("")
    setHasSearched(false)
    setPageItems([])
  }

  const handleClear = () => {
    setQuery("")
    setHasSearched(false)
    setPageItems([])
    inputRef.current?.focus()
  }

  const navigateTo = (href: string) => {
    handleClose()
    // Let AnchorHashScroll handle hash scrolling after navigation.
    router.push(href)
  }

  // Focus on open
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isOpen])

  // Fetch page results from server when searching (real data, no mocks)
  useEffect(() => {
    if (!isOpen) return
    const q = query.trim()
    setHasSearched(q.length > 0)
    if (q.length < 2) {
      setPageItems([])
      return
    }

    const requestSeq = ++requestSeqRef.current
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&brand=${encodeURIComponent(brand)}`)
        if (!res.ok) return
        const mapped = (await res.json()) as SearchItem[]
        if (requestSeq !== requestSeqRef.current) return
        setPageItems(mapped ?? [])
      } catch (err: unknown) {
        // ignore other fetch errors (offline, etc.)
      }
    }, 250)

    return () => {
      clearTimeout(t)
    }
  }, [brand, isOpen, query])

  const motionPanel = prefersReducedMotion
    ? { initial: {}, animate: {}, exit: {} }
    : {
        initial: { opacity: 0, y: -10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
        transition: { duration: 0.2 },
      }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            {...(prefersReducedMotion
              ? { initial: {}, animate: {}, exit: {} }
              : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } })}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div {...motionPanel} className="fixed left-1/2 top-24 z-50 w-full max-w-2xl -translate-x-1/2 px-4">
            <div className="rounded-2xl border border-border/30 bg-card/95 backdrop-blur-lg shadow-xl shadow-black/10">
              <div className="flex items-center gap-2 border-b border-border/20 px-4 py-3">
                <Search className={cn("h-5 w-5 shrink-0", brandTintIconSoft)} />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Suchen…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className={cn(
                    "w-full bg-transparent text-base outline-none",
                    "text-foreground placeholder-muted-foreground/50"
                  )}
                  aria-label="Suchfeld"
                />
                <AnimatePresence mode="wait">
                  {query && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.1 }}
                      onClick={handleClear}
                      className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      aria-label="Suchfeld leeren"
                      type="button"
                    >
                      <X className="h-5 w-5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              <div className="max-h-96 overflow-y-auto overflow-x-hidden">
                {!hasSearched ? (
                  <div className="space-y-4 p-4">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                      Schnellzugriff
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {quick.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => navigateTo(s.href)}
                          className={cn(
                            "p-3 rounded-lg border border-border/20 text-left",
                            "bg-muted/40",
                            brandTintHover,
                            "transition-all duration-200",
                            "text-sm font-medium text-foreground",
                            "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                          )}
                        >
                          {s.title}
                        </button>
                      ))}
                    </div>
                    <div className="pt-4 text-xs text-muted-foreground px-2">
                      Geben Sie einen Suchbegriff ein, um die Website zu durchsuchen.
                    </div>
                  </div>
                ) : results.length > 0 ? (
                  <div className="divide-y divide-border/20 py-2">
                    {Object.entries(grouped).map(([category, items]) => (
                      <div key={category}>
                        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {category}
                        </div>
                        {items.map((r, idx) => (
                          <motion.button
                            key={r.id}
                            type="button"
                            onClick={() => navigateTo(r.href)}
                            initial={prefersReducedMotion ? undefined : { opacity: 0, x: -10 }}
                            animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                            transition={{ delay: prefersReducedMotion ? 0 : idx * 0.03, duration: 0.2 }}
                            className={cn(
                              "flex w-full items-start gap-3 px-4 py-3 mx-1 rounded-lg text-left",
                              brandTintHover,
                              "transition-colors",
                              "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                            )}
                          >
                            <div className={cn("shrink-0 mt-0.5", brandTintIcon)}>{iconFor(r)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-foreground text-sm">{r.title}</div>
                              {r.description ? (
                                <div className="text-xs text-muted-foreground line-clamp-1">{r.description}</div>
                              ) : null}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center space-y-3">
                    <div className="text-lg font-semibold text-foreground">Keine Ergebnisse gefunden</div>
                    <div className="text-sm text-muted-foreground">Versuchen Sie einen anderen Begriff.</div>
                  </div>
                )}
              </div>

              {hasSearched && results.length > 0 && (
                <div className="border-t border-border/20 px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
                  <span>
                    {results.length} Ergebnis{results.length !== 1 ? "se" : ""} gefunden
                  </span>
                  <div className="flex gap-2">
                    <kbd className="px-1.5 py-0.5 rounded border border-border/30 bg-muted/50 text-xs font-mono">
                      Esc
                    </kbd>
                    <span>zum Schließen</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

