'use client'

import { useState } from 'react'
import { Menu, X, Search, Bell, LogOut, Settings, Users, BarChart3, FileText, MessageSquare, Upload, Lock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(true)

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, active: true },
    { id: 'pages', label: 'Seiten', icon: FileText },
    { id: 'content', label: 'Inhalte', icon: FileText },
    { id: 'media', label: 'Medien', icon: Upload },
    { id: 'forms', label: 'Formulare', icon: MessageSquare },
    { id: 'users', label: 'Nutzer', icon: Users },
    { id: 'roles', label: 'Rollen & Rechte', icon: Lock },
    { id: 'popups', label: 'Pop-ups', icon: Zap },
    { id: 'settings', label: 'Einstellungen', icon: Settings },
  ]

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button onClick={() => setIsOpen(!isOpen)} className="fixed left-4 top-4 z-40 lg:hidden md:hidden">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-64 bg-background border-r border-border transition-transform duration-300 z-30',
          !isOpen && '-translate-x-full lg:translate-x-0 md:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground">CMS Admin</h2>
            <p className="text-xs text-muted-foreground">Physiotherapie Dashboard</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors',
                  item.active
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="pt-4 border-t border-border">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <LogOut size={16} className="mr-2" />
              Abmelden
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}

export function AdminTopbar() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-20 lg:pl-64">
      <div className="h-full px-6 flex items-center justify-between gap-4">
        {/* Search */}
        <div className="flex-1 max-w-md hidden sm:flex">
          <div className="relative w-full">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Seiten, Medien, Nutzer durchsuchen…"
              className="pl-10 py-2 h-10"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Notifications */}
          <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
            <Bell size={20} className="text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Environment Badge */}
          <div className="px-3 py-1 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-700 dark:text-green-400">
            Live
          </div>

          {/* User Menu */}
          <button className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-lg transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
              SB
            </div>
            <span className="text-sm hidden sm:inline">Sebastian</span>
          </button>
        </div>
      </div>
    </header>
  )
}
