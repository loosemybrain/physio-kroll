'use client'

import { FileText, Users, Lock, LogIn, Mail, Upload, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ActivityFeed() {
  const activities = [
    { id: 1, type: 'page', action: 'Seite veröffentlicht', user: 'Maria Schmidt', time: 'vor 2h', icon: FileText, status: 'success' },
    { id: 2, type: 'user', action: 'Benutzer angelegt', user: 'Admin', time: 'vor 4h', icon: Users, status: 'success' },
    { id: 3, type: 'role', action: 'Rolle geändert', user: 'Sebastian Bauer', time: 'vor 6h', icon: Lock, status: 'info' },
    { id: 4, type: 'login_failed', action: 'Login fehlgeschlagen', user: 'unknown@test.com', time: 'vor 8h', icon: LogIn, status: 'warning' },
    { id: 5, type: 'form', action: 'Formular empfangen', user: 'System', time: 'vor 10h', icon: Mail, status: 'success' },
  ]

  const getStatusBadge = (status: string) => {
    const classes = {
      success: 'text-green-600 dark:text-green-400',
      warning: 'text-orange-600 dark:text-orange-400',
      error: 'text-red-600 dark:text-red-400',
      info: 'text-blue-600 dark:text-blue-400',
    }
    return classes[status as keyof typeof classes] || classes.info
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Letzte Aktivität</h3>

      <div className="space-y-4">
        {activities.map(activity => (
          <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
            <div className={cn('p-2 rounded-lg mt-0.5', getStatusBadge(activity.status))}>
              <activity.icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{activity.action}</p>
              <p className="text-xs text-muted-foreground">von {activity.user}</p>
            </div>
            <p className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SecurityOverview() {
  const securityEvents = [
    { id: 1, type: 'Login erfolgreich', user: 'Sebastian Bauer', ip: '192.168.1.1', time: 'vor 1h', status: 'success' },
    { id: 2, type: 'MFA aktiviert', user: 'Maria Schmidt', ip: '203.0.113.45', time: 'vor 3h', status: 'success' },
    { id: 3, type: 'Login fehlgeschlagen', user: 'admin@test.com', ip: '198.51.100.12', time: 'vor 5h', status: 'warning' },
    { id: 4, type: 'API-Aufruf', user: 'System', ip: '192.168.1.50', time: 'vor 7h', status: 'info' },
  ]

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Sicherheit & Login</h3>

      <div className="space-y-3">
        {securityEvents.map(event => (
          <div key={event.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{event.type}</p>
              <p className="text-xs text-muted-foreground">{event.user} • {event.ip}</p>
            </div>
            <div className="flex items-center gap-2">
              {event.status === 'success' && <CheckCircle size={16} className="text-green-600" />}
              {event.status === 'warning' && <AlertTriangle size={16} className="text-orange-600" />}
              {event.status === 'error' && <XCircle size={16} className="text-red-600" />}
              <span className="text-xs text-muted-foreground">{event.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function RecentLeads() {
  const leads = [
    { id: 1, name: 'Anna Müller', email: 'anna@example.com', phone: '+49 123 456789', message: 'Interesse an Physiotherapie', status: 'new' },
    { id: 2, name: 'Thomas Weber', email: 'thomas@example.com', phone: '+49 987 654321', message: 'Frage zu Kursen', status: 'replied' },
    { id: 3, name: 'Lisa Fischer', email: 'lisa@example.com', phone: '+49 555 666777', message: 'Terminanfrage', status: 'new' },
  ]

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Neue Anfragen</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-3 text-muted-foreground font-medium">Name</th>
              <th className="text-left py-3 px-3 text-muted-foreground font-medium">Email</th>
              <th className="text-left py-3 px-3 text-muted-foreground font-medium">Nachricht</th>
              <th className="text-left py-3 px-3 text-muted-foreground font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                <td className="py-3 px-3 text-foreground">{lead.name}</td>
                <td className="py-3 px-3 text-muted-foreground">{lead.email}</td>
                <td className="py-3 px-3 text-muted-foreground text-xs truncate">{lead.message}</td>
                <td className="py-3 px-3">
                  <span className={cn('px-2 py-1 rounded text-xs font-medium', lead.status === 'new' ? 'bg-blue-500/10 text-blue-700' : 'bg-green-500/10 text-green-700')}>
                    {lead.status === 'new' ? 'Neu' : 'Beantwortet'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
