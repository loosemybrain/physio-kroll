'use client'

import { useState } from 'react'
import { SearchWindow } from '@/components/search'
import { Button } from '@/components/ui/button'

export default function SearchDemo() {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-background transition-colors">
        {/* Header */}
        <div className="border-b border-border/20">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Suchfenster Demo</h1>
              <p className="text-sm text-muted-foreground">Premium Search Component für Physiotherapie-Website</p>
            </div>
            <Button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              variant="outline"
            >
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="space-y-12">
            {/* Section 1: Search Button */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Search Button</h2>
              <p className="text-muted-foreground">Klick auf den Button um das Suchfenster zu öffnen:</p>
              <div className="flex items-center justify-center p-8 border border-border/20 rounded-lg bg-card/50">
                <SearchWindow isOpen={open} onOpenChange={setOpen} />
              </div>
              <p className="text-xs text-muted-foreground">Tastaturkürzel: <kbd className="px-1.5 py-0.5 rounded border border-border/30 bg-muted/50 text-xs font-mono">Ctrl+K</kbd> (oder <kbd className="px-1.5 py-0.5 rounded border border-border/30 bg-muted/50 text-xs font-mono">⌘K</kbd> auf Mac)</p>
            </div>

            {/* Section 2: Features */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Features</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border border-border/20 rounded-lg bg-card/50 space-y-2">
                  <h3 className="font-medium text-foreground">Responsive Design</h3>
                  <p className="text-sm text-muted-foreground">Funktioniert perfekt auf Desktop, Tablet und Mobile</p>
                </div>
                <div className="p-4 border border-border/20 rounded-lg bg-card/50 space-y-2">
                  <h3 className="font-medium text-foreground">Dark Mode</h3>
                  <p className="text-sm text-muted-foreground">Native Light & Dark Mode Unterstützung</p>
                </div>
                <div className="p-4 border border-border/20 rounded-lg bg-card/50 space-y-2">
                  <h3 className="font-medium text-foreground">Accessible</h3>
                  <p className="text-sm text-muted-foreground">Vollständig tastaturnavigierbar mit Screen Reader Support</p>
                </div>
                <div className="p-4 border border-border/20 rounded-lg bg-card/50 space-y-2">
                  <h3 className="font-medium text-foreground">Smooth Animations</h3>
                  <p className="text-sm text-muted-foreground">Respektiert prefers-reduced-motion</p>
                </div>
              </div>
            </div>

            {/* Section 3: Search Categories */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Verfügbare Suchkategorien</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border border-border/20 rounded-lg bg-card/50">
                  <h3 className="font-medium text-foreground mb-2">Behandlungen</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Krankengymnastik</li>
                    <li>Manuelle Therapie</li>
                    <li>Lymphdrainage</li>
                  </ul>
                </div>
                <div className="p-4 border border-border/20 rounded-lg bg-card/50">
                  <h3 className="font-medium text-foreground mb-2">Kurse</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Rückenschule</li>
                    <li>Aquafitness</li>
                    <li>Bobath</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 4: Keyboard Shortcuts */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Tastaturkürzel</h2>
              <div className="p-4 border border-border/20 rounded-lg bg-card/50 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Suchfenster öffnen</span>
                  <kbd className="px-2 py-1 rounded border border-border/30 bg-muted/50 font-mono text-xs">Ctrl+K</kbd>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Suchfenster schließen</span>
                  <kbd className="px-2 py-1 rounded border border-border/30 bg-muted/50 font-mono text-xs">Escape</kbd>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Suchfeld leeren</span>
                  <kbd className="px-2 py-1 rounded border border-border/30 bg-muted/50 font-mono text-xs">Ctrl+L</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border/20 mt-16">
          <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
            <p>Premium Suchkomponente für hochwertige Physiotherapie-Websites</p>
          </div>
        </div>
      </div>
    </div>
  )
}
