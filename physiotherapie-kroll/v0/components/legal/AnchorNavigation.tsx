"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { List } from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface AnchorItem {
  id: string
  label: string
  level?: 1 | 2
}

interface AnchorNavigationProps {
  items: AnchorItem[]
  position?: "sidebar" | "inline"
  className?: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AnchorNavigation({
  items,
  position = "inline",
  className,
}: AnchorNavigationProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  /* ---- Intersection observer for active section tracking ---- */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: "-20% 0px -70% 0px",
        threshold: 0,
      },
    )

    items.forEach((item) => {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [items])

  /* ---- Smooth scroll handler ---- */
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault()
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" })
        setActiveId(id)
        // Update URL hash
        window.history.pushState(null, "", `#${id}`)
      }
    },
    [],
  )

  if (position === "sidebar") {
    return (
      <nav
        className={cn(
          "sticky top-24 hidden lg:block",
          className,
        )}
        aria-label="Inhaltsverzeichnis"
      >
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <List className="h-4 w-4" aria-hidden="true" />
            <span>Inhalt</span>
          </div>
          <ul className="space-y-1.5">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => handleClick(e, item.id)}
                  className={cn(
                    "block rounded-md px-2.5 py-1.5 text-sm transition-colors",
                    item.level === 2 && "pl-5",
                    activeId === item.id
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    )
  }

  // Inline variant
  return (
    <nav
      className={cn(
        "rounded-xl border border-border bg-card/50 p-5 md:p-6",
        className,
      )}
      aria-label="Inhaltsverzeichnis"
    >
      <div className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
        <List className="h-5 w-5 text-primary" aria-hidden="true" />
        <span>Inhaltsverzeichnis</span>
      </div>
      <ol className="columns-1 gap-x-8 space-y-2 md:columns-2">
        {items.map((item, index) => (
          <li key={item.id} className="break-inside-avoid">
            <a
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
              className={cn(
                "group flex items-baseline gap-2 text-sm transition-colors",
                item.level === 2 && "ml-4",
                activeId === item.id
                  ? "font-medium text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="flex-shrink-0 text-xs font-medium text-muted-foreground/70 group-hover:text-primary">
                {index + 1}.
              </span>
              <span className="group-hover:underline">{item.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
