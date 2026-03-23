"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Lock, Settings } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import type { LegalCookieCategory } from "@/types/cms"
import { LegalPlainTextBody } from "@/components/legal/LegalPlainTextBody"

const spacingTopMap = { none: "pt-0", sm: "pt-4", md: "pt-8", lg: "pt-12" }
const spacingBottomMap = { none: "pb-0", sm: "pb-4", md: "pb-8", lg: "pb-12" }

function getCategoryIcon(name: string) {
  const lower = name.toLowerCase()
  if (lower.includes("essenz") || lower.includes("notwendig") || lower.includes("erforderlich")) return Lock
  return Settings
}

function CategoryCard({ category }: { category: LegalCookieCategory }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = getCategoryIcon(category.name)
  const hasCookies = category.cookies?.length > 0

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card transition-all duration-300",
        category.required
          ? "border-primary/30 bg-primary/2"
          : "border-border hover:border-primary/20",
      )}
    >
      <div className="flex items-start gap-4 p-5 md:p-6">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            category.required ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">{category.name}</h3>
            {category.required && (
              <Badge variant="secondary" className="text-xs font-medium">
                Erforderlich
              </Badge>
            )}
          </div>
          <LegalPlainTextBody
            text={category.description}
            className="text-sm text-muted-foreground"
            classNameParagraph="leading-relaxed"
          />
        </div>
      </div>
      {hasCookies && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "flex w-full items-center justify-between border-t border-border px-5 py-3 text-sm font-medium transition-colors hover:bg-muted/50 md:px-6",
              "text-muted-foreground hover:text-foreground",
              expanded && "bg-muted/30",
            )}
            aria-expanded={expanded}
          >
            <span>
              {category.cookies!.length} Cookie{category.cookies!.length !== 1 ? "s" : ""} anzeigen
            </span>
            <ChevronDown
              className={cn("h-4 w-4 transition-transform duration-200", expanded && "rotate-180")}
              aria-hidden="true"
            />
          </button>
          {expanded && (
            <div className="border-t border-border">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-5 py-2.5 text-left font-medium text-foreground md:px-6">Name</th>
                      <th className="px-5 py-2.5 text-left font-medium text-foreground md:px-6">Anbieter</th>
                      <th className="px-5 py-2.5 text-left font-medium text-foreground md:px-6">Dauer</th>
                      <th className="px-5 py-2.5 text-left font-medium text-foreground md:px-6">Zweck</th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.cookies!.map((cookie, idx) => (
                      <tr
                        key={cookie.id}
                        className={cn("border-b border-border/50 last:border-b-0", idx % 2 === 1 && "bg-muted/20")}
                      >
                        <td className="px-5 py-2.5 font-mono text-xs text-foreground md:px-6">{cookie.name}</td>
                        <td className="px-5 py-2.5 text-muted-foreground md:px-6">{cookie.provider}</td>
                        <td className="px-5 py-2.5 text-muted-foreground md:px-6">{cookie.duration}</td>
                        <td className="px-5 py-2.5 text-muted-foreground md:px-6">{cookie.purpose}</td>
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

function CategoryAccordion({ categories }: { categories: LegalCookieCategory[] }) {
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
              category.required ? "border-primary/20 bg-primary/2" : "border-border",
            )}
          >
            <AccordionTrigger className="py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
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
              <LegalPlainTextBody
                text={category.description}
                className="mb-4 text-sm text-muted-foreground"
                classNameParagraph="leading-relaxed"
              />
              {category.cookies && category.cookies.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[400px] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium text-foreground">Name</th>
                        <th className="px-3 py-2 text-left font-medium text-foreground">Anbieter</th>
                        <th className="px-3 py-2 text-left font-medium text-foreground">Dauer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.cookies.map((cookie) => (
                        <tr key={cookie.id} className="border-b border-border/50 last:border-b-0">
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

export type LegalCookieCategoriesProps = {
  variant?: "cards" | "accordion"
  categories: LegalCookieCategory[]
  spacingTop?: "none" | "sm" | "md" | "lg"
  spacingBottom?: "none" | "sm" | "md" | "lg"
}

export function LegalCookieCategories({
  categories,
  variant = "cards",
  spacingTop = "md",
  spacingBottom = "md",
}: LegalCookieCategoriesProps) {
  if (!categories?.length) return null

  return (
    <div
      className={cn(
        spacingTopMap[spacingTop],
        spacingBottomMap[spacingBottom],
      )}
    >
      {variant === "cards" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      ) : (
        <CategoryAccordion categories={categories} />
      )}
    </div>
  )
}
