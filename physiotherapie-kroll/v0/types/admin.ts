export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  avatar?: string
}

export interface ActivityEvent {
  id: string
  type: 'page_published' | 'user_added' | 'role_changed' | 'login_failed' | 'form_submitted' | 'media_uploaded' | 'content_updated'
  user: string
  action: string
  timestamp: Date
  status?: 'success' | 'warning' | 'error'
}

export interface StatCardData {
  label: string
  value: number | string
  trend?: 'up' | 'down' | 'neutral'
  trendPercent?: number
  icon: string
  color: 'teal' | 'blue' | 'orange' | 'red' | 'green' | 'purple'
}

export interface SecurityEvent {
  id: string
  type: 'login' | 'failed_login' | 'mfa' | 'access' | 'api_call'
  user: string
  ip: string
  status: 'success' | 'warning' | 'critical'
  timestamp: Date
}

export interface FormLead {
  id: string
  name: string
  email: string
  phone?: string
  message: string
  form: string
  status: 'new' | 'replied' | 'archived'
  timestamp: Date
}
