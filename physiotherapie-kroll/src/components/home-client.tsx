"use client"

import { useState } from "react"
import { HeroSection, type HeroMood } from "@/components/blocks/hero-section"
import { Button } from "@/components/ui/button"

export function HomeClient() {
  const [mood, setMood] = useState<HeroMood>("physiotherapy")

  return (
    <>
      {/* Theme Switcher for Demo */}
      <nav
        className="fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-card/80 p-2 shadow-lg backdrop-blur-sm"
        aria-label="Theme selection"
      >
        <Button
          variant={mood === "physiotherapy" ? "default" : "ghost"}
          size="sm"
          onClick={() => setMood("physiotherapy")}
          className="rounded-full"
        >
          Physiotherapie
        </Button>
        <Button
          variant={mood === "physio-konzept" ? "default" : "ghost"}
          size="sm"
          onClick={() => setMood("physio-konzept")}
          className="rounded-full"
        >
          PhysioKonzept
        </Button>
      </nav>

      {/* Hero Section */}
      <HeroSection mood={mood} />
    </>
  )
}
