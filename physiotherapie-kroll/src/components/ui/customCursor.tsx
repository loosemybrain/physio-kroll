"use client"

import * as React from "react"

function isInteractive(el: Element | null) {
  if (!el) return false
  return Boolean(
    el.closest(
      [
        "a[href]",
        "button",
        "[role='button']",
        "input",
        "select",
        "textarea",
        "[data-cursor='hover']",
      ].join(",")
    )
  )
}

export default function CustomCursor() {
  const dotRef = React.useRef<HTMLDivElement | null>(null)
  const ringRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    // never enable in admin
    if (window.location.pathname.startsWith("/admin")) return

    const canHover =
      window.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches ?? false
    if (!canHover) return

    const root = document.documentElement
    root.classList.add("has-custom-cursor")

    let raf = 0
    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let rx = x
    let ry = y

    const show = () => {
      if (dotRef.current) dotRef.current.style.opacity = "1"
      if (ringRef.current) ringRef.current.style.opacity = "0.75"
    }

    const hide = () => {
      if (dotRef.current) dotRef.current.style.opacity = "0"
      if (ringRef.current) ringRef.current.style.opacity = "0"
    }

    const onMove = (e: MouseEvent) => {
      x = e.clientX
      y = e.clientY
      show()
    }

    const onLeave = () => hide()

    const onDown = () => root.classList.add("cursor-down")
    const onUp = () => root.classList.remove("cursor-down")

    const onOver = (e: MouseEvent) => {
      const target = e.target as Element | null
      if (isInteractive(target)) root.classList.add("cursor-hover")
    }

    const onOut = (e: MouseEvent) => {
      const target = e.target as Element | null
      if (isInteractive(target)) root.classList.remove("cursor-hover")
    }

    const tick = () => {
      // ring lags slightly behind cursor for a “smooth” feel
      rx += (x - rx) * 0.18
      ry += (y - ry) * 0.18

      // store css vars for optional transforms
      root.style.setProperty("--dx", `${x}px`)
      root.style.setProperty("--dy", `${y}px`)
      root.style.setProperty("--cx", `${rx}px`)
      root.style.setProperty("--cy", `${ry}px`)

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`
      }

      raf = requestAnimationFrame(tick)
    }

    window.addEventListener("mousemove", onMove, { passive: true })
    window.addEventListener("mouseleave", onLeave)
    window.addEventListener("mousedown", onDown)
    window.addEventListener("mouseup", onUp)
    window.addEventListener("mouseover", onOver)
    window.addEventListener("mouseout", onOut)

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseleave", onLeave)
      window.removeEventListener("mousedown", onDown)
      window.removeEventListener("mouseup", onUp)
      window.removeEventListener("mouseover", onOver)
      window.removeEventListener("mouseout", onOut)
      root.classList.remove("has-custom-cursor", "cursor-hover", "cursor-down")
      root.style.removeProperty("--dx")
      root.style.removeProperty("--dy")
      root.style.removeProperty("--cx")
      root.style.removeProperty("--cy")
    }
  }, [])

  // IMPORTANT: keep it in the tree; CSS hides it on touch devices
  return (
    <div
      aria-hidden="true"
      // color controls dot/ring due to currentColor
      className="text-primary"
    >
      <div ref={ringRef} className="cursor-ring" />
      <div ref={dotRef} className="cursor-dot" />
    </div>
  )
}
