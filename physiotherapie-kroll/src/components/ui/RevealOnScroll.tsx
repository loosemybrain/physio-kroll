"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type RevealOnScrollProps = {
  children: React.ReactNode
  className?: string
}

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

export function RevealOnScroll({ children, className }: RevealOnScrollProps) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = React.useState(false)

  useIsomorphicLayoutEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const isDesktop =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(min-width: 1024px)").matches

    if (prefersReduced || !isDesktop) {
      setIsVisible(true)
      return
    }

    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 360ms ease-out, transform 360ms ease-out",
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  )
}
