"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Lock, Settings, BarChart3, Megaphone } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import type { LegalCookieCategoriesBlock, CookieCategoryItem } from "@/types/legal"

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface CookieCategoryCardsProps
  extends Omit<LegalCookieCategoriesBlock, "type" | "id"> {
  className?: string
}

/* ------------------------------------------------------------------ */
/*  Category Icon Map                                                  */
/* ------------------------------------------------------------------ */

function getCategoryIcon(name: string) {
  const lower = name.toLowerCase()
  if (lower.includes("essenz") || lower.includes("notwendig") || lower.includes("required"))
    return Lock
  if (lower.includes("funktion") || lower.includes("präferenz"))
    return Settings
  if (lower.includes("statistik") || lower.includes("analyse"))
    return BarChart3
  if (lower.includes("marketing") || lower.includes("werbung"))
    return Megaphone
  return Settings
}

const spacingTopMap: Record<string, string> = {
  none: "pt-0",
  sm: "pt-4",
  md: "pt-8",
  lg: "pt-12",
}

const spacingBottomMap: Record<string, string> = {
  none: "pb-0",
  sm: "pb-4",
  md: "pb-8",
  lg: "pb-12",
}

/* ------------------------------------------------------------------ */
/*  Category Card (for cards variant)                                  */
/* ------------------------------------------------------------------ */

function CategoryCard({ category }: { category: CookieCategoryItem }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = getCategoryIcon(category.name)
  const hasCookies = category.cookies && category.cookies.length > 0

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card transition-all duration-300",
        category.required
          ? "border-primary/30 bg-primary/[0.02]"
          : "border-border hover:border-primary/20",
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-4 p-5 md:p-6">
        {/* Icon */}
        <div
          className={cn(
            "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl",
            category.required ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-foreground">{category.name}</h3>
            {category.required && (
              <Badge variant="secondary" className="text-xs font-medium">
                Erforderlich
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {category.description}
          </p>
        </div>
      </div>

      {/* Expandable cookies list */}
      {hasCookies && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "flex w-full items-center justify-between border-t px-5 py-3 text-sm font-medium transition-colors md:px-6",
              "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              expanded && "bg-muted/30",
            )}
            aria-expanded={expanded}
          >
            <span>
              {category.cookies!.length} Cookie{category.cookies!.length !== 1 && "s"} anzeigen
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                expanded && "rotate-180",
              )}
              aria-hidden="true"
            />
          </button>

          {expanded && (
            <div className="border-t">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-5 py-2.5 text-left font-medium text-foreground md:px-6">
                        Name
                      </th>
                      <th className="px-5 py-2.5 text-left font-medium text-foreground md:px-6">
                        Anbieter
                      </th>
                      <th className="px-5 py-2.5 text-left font-medium text-foreground md:px-6">
                        Dauer
                      </th>
                      <th className="px-5 py-2.5 text-left font-medium text-foreground md:px-6">
                        Zweck
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.cookies!.map((cookie, idx) => (
                      <tr
                        key={cookie.id}
                        className={cn(
                          "border-b last:border-b-0",
                          idx % 2 === 1 && "bg-muted/20",
                        )}
                      >
                        <td className="px-5 py-2.5 font-mono text-xs text-foreground md:px-6">
                          {cookie.name}
                        </td>
                        <td className="px-5 py-2.5 text-muted-foreground md:px-6">
                          {cookie.provider}
                        </td>
                        <td className="px-5 py-2.5 text-muted-foreground md:px-6">
                          {cookie.duration}
                        </td>
                        <td className="px-5 py-2.5 text-muted-foreground md:px-6">
                          {cookie.purpose}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Accordion Variant                                                  */
/* ------------------------------------------------------------------ */

function CategoryAccordion({ categories }: { categories: CookieCategoryItem[] }) {
  return (
    <Accordion type="multiple" className="flex flex-col gap-3">
      {categories.map((category) => {
        const Icon = getCategoryIcon(category.name)
        return (
          <AccordionItem
            key={category.id}
            value={category.id}
            className={cn(
              "rounded-xl border px-5 data-[state=open]:border-primary/30",
              category.required ? "border-primary/20 bg-primary/[0.02]" : "border-border",
            )}
          >
            <AccordionTrigger className="py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
                    category.required ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <span className="font-semibold text-foreground">{category.name}</span>
                {category.required && (
                  <Badge variant="secondary" className="text-xs font-medium">
                    Erforderlich
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-5">
              <p className="mb-4 text-sm text-muted-foreground">
                {category.description}
              </p>
              {category.cookies && category.cookies.length > 0 && (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[400px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium text-foreground">Name</th>
                        <th className="px-3 py-2 text-left font-medium text-foreground">Anbieter</th>
                        <th className="px-3 py-2 text-left font-medium text-foreground">Dauer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.cookies.map((cookie) => (
                        <tr key={cookie.id} className="border-b last:border-b-0">
                          <td className="px-3 py-2 font-mono text-xs">{cookie.name}</td>
                          <td className="px-3 py-2 text-muted-foreground">{cookie.provider}</td>
                          <td className="px-3 py-2 text-muted-foreground">{cookie.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function CookieCategoryCards({
  categories,
  variant = "cards",
  spacingTop = "md",
  spacingBottom = "md",
  className,
}: CookieCategoryCardsProps) {
  return (
    <div
      className={cn(
        spacingTopMap[spacingTop],
        spacingBottomMap[spacingBottom],
        className,
      )}
    >
      {variant === "cards" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      ) : (
        <CategoryAccordion categories={categories} />
      )}
    </div>
  )
}
