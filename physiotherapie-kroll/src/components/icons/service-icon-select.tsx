/**
 * Service Icons Select Component
 * Displays a dropdown for icon selection with icon previews
 */

"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { getServiceIcon, humanizeIconName, getAvailableIconNames } from "@/components/icons/service-icons"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ServiceIconSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function ServiceIconSelect({
  value,
  onValueChange,
  placeholder = "Select an icon...",
  className,
  disabled = false,
}: ServiceIconSelectProps) {
  const icons = getAvailableIconNames()
  const IconComponent = value ? getServiceIcon(value) : null
  
  return (
    <Select value={value || ""} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue 
          placeholder={placeholder}
          className="flex items-center gap-2"
        >
          {value && IconComponent ? (
            <div className="flex items-center gap-2">
              <IconComponent className="h-4 w-4" />
              <span>{humanizeIconName(value)}</span>
            </div>
          ) : (
            placeholder
          )}
        </SelectValue>
      </SelectTrigger>
      
      <SelectContent className="max-h-[300px]">
        {icons.map((iconName) => {
          const Icon = getServiceIcon(iconName)
          return (
            <SelectItem key={iconName} value={iconName} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{humanizeIconName(iconName)}</span>
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
