import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function formatMessageTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isToday(d)) return format(d, 'HH:mm')
  if (isYesterday(d)) return `Yesterday ${format(d, 'HH:mm')}`
  return format(d, 'MMM d, HH:mm')
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'MMM d, yyyy')
}

export function formatDeadline(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, "MMM d, yyyy 'at' HH:mm")
}

export function getInitials(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return '?'
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()
}

export function getFullName(profile?: { firstName?: string; lastName?: string }): string {
  if (!profile) return 'Unknown User'
  return `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || 'Unknown User'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function isImageType(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📊'
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return '🗜️'
  return '📎'
}

export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    STUDENT: 'text-blue-600 bg-blue-50',
    TEACHER: 'text-emerald-600 bg-emerald-50',
    ADMIN: 'text-orange-600 bg-orange-50',
    SUPERADMIN: 'text-violet-600 bg-violet-50',
  }
  return colors[role] ?? 'text-gray-600 bg-gray-50'
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: 'text-emerald-600 bg-emerald-50',
    FROZEN: 'text-yellow-600 bg-yellow-50',
    BLOCKED: 'text-red-600 bg-red-50',
    PENDING_VERIFICATION: 'text-gray-600 bg-gray-50',
  }
  return colors[status] ?? 'text-gray-600 bg-gray-50'
}

export function getAssignmentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    NOT_SUBMITTED: 'text-gray-500 bg-gray-50',
    SUBMITTED: 'text-blue-600 bg-blue-50',
    GRADED: 'text-emerald-600 bg-emerald-50',
    RETURNED: 'text-orange-600 bg-orange-50',
    LATE: 'text-red-600 bg-red-50',
  }
  return colors[status] ?? 'text-gray-500 bg-gray-50'
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength)}...`
}
