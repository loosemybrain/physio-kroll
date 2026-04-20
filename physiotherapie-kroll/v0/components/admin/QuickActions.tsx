'use client'

import { Plus, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function QuickActions() {
  const actions = [
    { icon: Plus, label: 'Neue Seite', color: 'bg-blue-500' },
    { icon: Plus, label: 'Formular prüfen', color: 'bg-teal-500' },
    { icon: Plus, label: 'Medien hochladen', color: 'bg-orange-500' },
    { icon: Plus, label: 'Benutzer anlegen', color: 'bg-green-500' },
  ]

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Schnellaktionen</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action, i) => (
          <button key={i} className="p-3 rounded-lg hover:bg-muted transition-colors text-center group">
            <div className={cn(action.color, 'w-10 h-10 rounded-lg flex items-center justify-center text-white mx-auto mb-2 group-hover:scale-110 transition-transform')}>
              <action.icon size={18} />
            </div>
            <p className="text-xs font-medium text-foreground">{action.label}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export function TasksList() {
  const tasks = [
    { id: 1, title: 'SEO-Titel für 5 Seiten erforderlich', priority: 'high', icon: AlertCircle },
    { id: 2, title: 'Impressum aktualisieren', priority: 'high', icon: AlertCircle },
    { id: 3, title: 'Formularantwort prüfen (3 neue)', priority: 'medium', icon: Clock },
    { id: 4, title: 'Bilder für Kursgalerie hinzufügen', priority: 'medium', icon: Clock },
    { id: 5, title: 'Änderungen an Startseite überprüft', priority: 'low', icon: CheckCircle2 },
  ]

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Aufgaben & Hinweise</h3>

      <div className="space-y-3">
        {tasks.map(task => (
          <div key={task.id} className="flex items-start gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer">
            <div className={cn(
              'p-1.5 rounded flex-shrink-0 mt-0.5',
              task.priority === 'high' && 'text-red-600',
              task.priority === 'medium' && 'text-orange-600',
              task.priority === 'low' && 'text-green-600'
            )}>
              <task.icon size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{task.title}</p>
              <p className={cn(
                'text-xs mt-1',
                task.priority === 'high' && 'text-red-600',
                task.priority === 'medium' && 'text-orange-600',
                task.priority === 'low' && 'text-green-600'
              )}>
                {task.priority === 'high' ? 'Dringend' : task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
