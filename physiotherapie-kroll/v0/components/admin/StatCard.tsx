'use client'

import { TrendingUp, TrendingDown, Eye, Mail, FileCheck, Users, AlertCircle, HardDrive } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
  trendPercent?: number
  icon: React.ReactNode
  color: 'teal' | 'blue' | 'orange' | 'red' | 'green'
  description?: string
}

export function StatCard({ label, value, trend, trendPercent, icon, color, description }: StatCardProps) {
  const colorClasses = {
    teal: 'bg-teal-500/10 text-teal-700 dark:text-teal-400',
    blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    orange: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
    red: 'bg-red-500/10 text-red-700 dark:text-red-400',
    green: 'bg-green-500/10 text-green-700 dark:text-green-400',
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 hover:border-border/80 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('p-3 rounded-lg', colorClasses[color])}>
          {icon}
        </div>
        {trend && trendPercent !== undefined && (
          <div className={cn('flex items-center gap-1 text-sm font-semibold', trend === 'up' ? 'text-green-600' : 'text-red-600')}>
            {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {trendPercent}%
          </div>
        )}
      </div>

      <h3 className="text-sm text-muted-foreground mb-1">{label}</h3>
      <p className="text-3xl font-bold text-foreground mb-2">{value}</p>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        label="Seitenaufrufe"
        value="24,582"
        trend="up"
        trendPercent={12}
        icon={<Eye size={20} />}
        color="blue"
        description="heute im Vergleich zu gestern"
      />
      <StatCard
        label="Neue Leads"
        value="48"
        trend="up"
        trendPercent={8}
        icon={<Mail size={20} />}
        color="teal"
        description="Kontaktanfragen diese Woche"
      />
      <StatCard
        label="Veröffentlichte Seiten"
        value="156"
        trend="neutral"
        icon={<FileCheck size={20} />}
        color="green"
        description="12 neue Entwürfe"
      />
      <StatCard
        label="Aktive Nutzer"
        value="8"
        trend="up"
        trendPercent={3}
        icon={<Users size={20} />}
        color="orange"
        description="Aktuell online"
      />
      <StatCard
        label="Fehlgeschlagene Logins"
        value="3"
        trend="down"
        trendPercent={45}
        icon={<AlertCircle size={20} />}
        color="red"
        description="Letzte 24 Stunden"
      />
      <StatCard
        label="Speicherauslastung"
        value="68%"
        trend="neutral"
        icon={<HardDrive size={20} />}
        color="blue"
        description="15.2 GB von 22.4 GB"
      />
      <StatCard
        label="Formularquote"
        value="4.2%"
        trend="up"
        trendPercent={2}
        icon={<FileCheck size={20} />}
        color="teal"
        description="Conversion Rate"
      />
      <StatCard
        label="API-Aufrufe"
        value="12,847"
        trend="neutral"
        icon={<Eye size={20} />}
        color="green"
        description="Diese Woche"
      />
    </div>
  )
}
