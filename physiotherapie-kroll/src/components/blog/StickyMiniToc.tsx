"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type TocItem = {
  id: string
  text: string
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function StickyMiniToc({ className }: { className?: string }) {
  const [items, setItems] = React.useState<TocItem[]>([])
  const [activeId, setActiveId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const container = document.querySelector("[data-article]")
    if (!container) return

    const headings = Array.from(container.querySelectorAll("h2"))
    const nextItems: TocItem[] = []
    const used = new Map<string, number>()

    headings.forEach((heading) => {
      const text = (heading.textContent || "").trim()
      if (!text) return

      let id = heading.id?.trim()
      if (!id) {
        id = slugify(text)
      }
      if (!id) return

      const baseId = id
      if (document.getElementById(id) && document.getElementById(id) !== heading) {
        const count = (used.get(baseId) ?? 1) + 1
        id = `${baseId}-${count}`
        used.set(baseId, count)
      } else {
        used.set(baseId, 1)
      }

      heading.id = id
      nextItems.push({ id, text })
    })

    setItems(nextItems)
  }, [])

  React.useEffect(() => {
    if (items.length < 2) return
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el))

    if (headings.length < 2) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        root: null,
        rootMargin: "0px 0px -60% 0px",
        threshold: 0.1,
      }
    )

    headings.forEach((heading) => observer.observe(heading))
    return () => observer.disconnect()
  }, [items])

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  const handleClick = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" })
  }

  if (items.length < 2) return null

  return (
    <nav className={cn("hidden lg:block", className)} aria-label="Inhaltsverzeichnis">
      <div className="sticky top-24 max-w-[240px]">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Inhalt
        </p>
        <ul className="space-y-2 text-sm">
          {items.map((item) => {
            const isActive = item.id === activeId
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={handleClick(item.id)}
                  className={cn(
                    "block border-l pl-3 transition-colors",
                    isActive
                      ? "border-primary text-foreground font-medium"
                      : "border-border/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.text}
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
