"use client"

import * as React from "react"
import type { ElementConfig } from "@/types/cms"
import { resolveBoxShadow } from "@/lib/shadow/resolveBoxShadow"
import { cn } from "@/lib/utils"

interface ElementWithShadowProps {
  elementId: string
  elementConfig?: ElementConfig
  className?: string
  children: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
  [key: string]: unknown
}

/**
 * Wrapper component for elements with shadow support
 * Automatically applies boxShadow from elementConfig
 */
export function ElementWithShadow({
  elementId,
  elementConfig,
  className,
  children,
  onClick,
  ...props
}: ElementWithShadowProps) {
  const shadowStyle = resolveBoxShadow(elementConfig?.style?.shadow)
  const styleFromProps =
    props.style && typeof props.style === "object" ? (props.style as React.CSSProperties) : undefined

  return (
    <div
      data-element-id={elementId}
      className={cn(className)}
      style={{
        boxShadow: shadowStyle,
        ...styleFromProps,
      }}
      onClick={onClick}
      {...Object.entries(props)
        .filter(([key]) => !["style", "className"].includes(key))
        .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {})}
    >
      {children}
    </div>
  )
}
