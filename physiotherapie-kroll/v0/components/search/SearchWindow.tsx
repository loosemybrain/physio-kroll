'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, X, Clock, Zap, Users, Pill } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

/* ──────────────────────────────────────────────────────────── */
/*  Mock Search Data - Physiotherapy Content                     */
/* ──────────────────────────────────────────────────────────── */

interface SearchResult {
  id: string
  title: string
  description: string
  category: 'Behandlungen' | 'Kurse' | 'Leistungen' | 'Team' | 'Bereiche' | 'Häufig gesucht'
  icon: React.ReactNode
  href: string
}

const MOCK_RESULTS: SearchResult[] = [
  {
    id: '1',
    title: 'Krankengymnastik',
    description: 'Klassische Physiotherapie zur Verbesserung der Mobilität',
    category: 'Behandlungen',
    icon: <Pill className="w-5 h-5" />,
    href: '#services',
  },
  {
    id: '2',
    title: 'Manuelle Therapie',
    description: 'Gezielte Handgriffe zur Mobilisierung von Gelenken',
    category: 'Behandlungen',
    icon: <Zap className="w-5 h-5" />,
    href: '#services',
  },
  {
    id: '3',
    title: 'Lymphdrainage',
    description: 'Sanfte Massage zur Förderung des Lymphflusses',
    category: 'Behandlungen',
    icon: <Pill className="w-5 h-5" />,
    href: '#services',
  },
  {
    id: '4',
    title: 'Rückenschule',
    description: 'Kurs für effektives Rückentraining und Prävention',
    category: 'Kurse',
    icon: <Clock className="w-5 h-5" />,
    href: '#courses',
  },
  {
    id: '5',
    title: 'Aquafitness',
    description: 'Gelenkschonende Trainingseinheiten im Wasser',
    category: 'Kurse',
    icon: <Clock className="w-5 h-5" />,
    href: '#courses',
  },
  {
    id: '6',
    title: 'Leistungen',
    description: 'Alle Behandlungen, Kurse und Dienstleistungen',
    category: 'Bereiche',
    icon: <Zap className="w-5 h-5" />,
    href: '#services',
  },
  {
    id: '7',
    title: 'Unser Team',
    description: 'Lernen Sie unsere erfahrenen Therapeuten kennen',
    category: 'Team',
    icon: <Users className="w-5 h-5" />,
    href: '#team',
  },
  {
    id: '8',
    title: 'Kontakt',
    description: 'Telefon, E-Mail und Öffnungszeiten',
    category: 'Bereiche',
    icon: <Zap className="w-5 h-5" />,
    href: '#contact',
  },
]

const QUICK_SUGGESTIONS = [
  { label: 'Leistungen', href: '#services' },
  { label: 'Kursplan', href: '#courses' },
  { label: 'Team', href: '#team' },
  { label: 'Kontakt', href: '#contact' },
]

/* ──────────────────────────────────────────────────────────── */
/*  SearchWindow Component                                       */
/* ──────────────────────────────────────────────────────────── */

interface SearchWindowProps {
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SearchWindow({ isOpen = false, onOpenChange }: SearchWindowProps) {
  const [open, setOpen] = useState(isOpen)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const prefersReducedMotion = useReducedMotion()

  const effectiveOpen = onOpenChange !== undefined ? isOpen : open
  const effectiveSetOpen = onOpenChange || setOpen

  // Filter results based on query
  const filteredResults = useMemo(() => {
    if (!query.trim()) return []
    const lowerQuery = query.toLowerCase()
    return MOCK_RESULTS.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery) ||
        item.category.toLowerCase().includes(lowerQuery)
    )
  }, [query])

  const handleSearch = (value: string) => {
    setQuery(value)
    setHasSearched(value.length > 0)
    setResults(value.trim() ? filteredResults : [])
  }

  const handleClear = () => {
    setQuery('')
    setHasSearched(false)
    setResults([])
    inputRef.current?.focus()
  }

  const handleClose = () => {
    effectiveSetOpen(false)
    setQuery('')
    setHasSearched(false)
    setResults([])
  }

  // Focus on open
  useEffect(() => {
    if (effectiveOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [effectiveOpen])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        effectiveSetOpen(!effectiveOpen)
      }
      if (e.key === 'Escape' && effectiveOpen) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [effectiveOpen, effectiveSetOpen])

  const motionConfig = prefersReducedMotion
    ? { initial: {}, animate: {}, exit: {} }
    : {
        initial: { opacity: 0, y: -10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
        transition: { duration: 0.2 },
      }

  return (
    <>
      {/* Search Button */}
      <button
        onClick={() => effectiveSetOpen(true)}
        className={cn(
          'group relative inline-flex items-center gap-2 px-3.5 py-2',
          'rounded-lg border border-border/40',
          'bg-background/60 backdrop-blur-sm',
          'transition-all duration-200 ease-out',
          'hover:border-border/60 hover:bg-card/40',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          'text-sm text-muted-foreground'
        )}
        aria-label="Öffne Suchfeld (Ctrl+K)"
      >
        <Search className="w-4 h-4 transition-colors group-hover:text-foreground" />
        <span className="hidden sm:inline text-xs">Suchen...</span>
        <kbd className="hidden sm:inline ml-auto px-1.5 py-0.5 rounded border border-border/30 bg-muted/50 text-xs font-mono text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      {/* Search Modal Overlay */}
      <AnimatePresence>
        {effectiveOpen && (
          <>
            <motion.div
              {...(prefersReducedMotion
                ? { initial: {}, animate: {}, exit: {} }
                : {
                    initial: { opacity: 0 },
                    animate: { opacity: 1 },
                    exit: { opacity: 0 },
                    transition: { duration: 0.15 },
                  })}
              onClick={handleClose}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Search Panel */}
            <motion.div
              {...motionConfig}
              className="fixed left-1/2 top-24 z-50 w-full max-w-2xl -translate-x-1/2 px-4"
            >
              {/* Input Container */}
              <div className="rounded-2xl border border-border/30 bg-card/95 backdrop-blur-lg shadow-xl shadow-black/10">
                {/* Input Row */}
                <div className="flex items-center gap-2 border-b border-border/20 px-4 py-3">
                  <Search className="w-5 h-5 text-primary/60 flex-shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Suchen Sie nach Behandlungen, Kursen, Team..."
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    className={cn(
                      'w-full bg-transparent text-base outline-none',
                      'text-foreground placeholder-muted-foreground/50',
                      'font-sans'
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
                        className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                        aria-label="Suchfeld leeren"
                      >
                        <X className="w-5 h-5" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {/* Results / Suggestions */}
                <div className="max-h-96 overflow-y-auto">
                  {!hasSearched ? (
                    // Empty State with Quick Links
                    <div className="space-y-4 p-4">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                        Schnellzugriff
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {QUICK_SUGGESTIONS.map((suggestion) => (
                          <a
                            key={suggestion.label}
                            href={suggestion.href}
                            onClick={() => {
                              handleClose()
                            }}
                            className={cn(
                              'p-3 rounded-lg border border-border/20',
                              'bg-muted/40 hover:bg-muted/70',
                              'transition-all duration-200',
                              'text-sm font-medium text-foreground',
                              'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring'
                            )}
                          >
                            {suggestion.label}
                          </a>
                        ))}
                      </div>

                      {/* Helpful Text */}
                      <div className="pt-4 text-xs text-muted-foreground px-2">
                        Geben Sie einen Suchbegriff ein, um die Website zu durchsuchen.
                      </div>
                    </div>
                  ) : results.length > 0 ? (
                    // Results List
                    <div className="divide-y divide-border/20 py-2">
                      {Object.entries(
                        results.reduce(
                          (acc, result) => {
                            if (!acc[result.category]) acc[result.category] = []
                            acc[result.category].push(result)
                            return acc
                          },
                          {} as Record<string, SearchResult[]>
                        )
                      ).map(([category, items]) => (
                        <div key={category}>
                          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {category}
                          </div>
                          {items.map((result, index) => (
                            <motion.a
                              key={result.id}
                              href={result.href}
                              onClick={() => handleClose()}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                delay: prefersReducedMotion ? 0 : index * 0.05,
                                duration: 0.2,
                              }}
                              className={cn(
                                'flex items-start gap-3 px-4 py-3 mx-1 rounded-lg',
                                'hover:bg-muted/60 transition-colors',
                                'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring'
                              )}
                            >
                              <div className="text-primary/70 flex-shrink-0 mt-0.5">{result.icon}</div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-foreground text-sm">{result.title}</div>
                                <div className="text-xs text-muted-foreground line-clamp-1">{result.description}</div>
                              </div>
                            </motion.a>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    // No Results State
                    <div className="p-8 text-center space-y-3">
                      <div className="text-lg font-semibold text-foreground">
                        Keine Ergebnisse gefunden
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Versuchen Sie, einen anderen Begriff zu suchen, oder kontaktieren Sie uns direkt.
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer with Hints */}
                {hasSearched && results.length > 0 && (
                  <div className="border-t border-border/20 px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
                    <span>{results.length} Ergebnis{results.length !== 1 ? 'se' : ''} gefunden</span>
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
    </>
  )
}
