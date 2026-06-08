import { api, type ApiResult } from '../../core/api/client'

export type NotificationType = 0 | 1 | 2 | 3

export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  0: 'Bilgi',
  1: 'Başarılı',
  2: 'Uyarı',
  3: 'Hata',
}

export interface AppNotification {
  id: string
  title: string
  message: string
  type: NotificationType
  link: string | null
  isRead: boolean
  createdAt: string
}

export interface Paged<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

export interface NotificationQuery {
  page: number
  pageSize: number
  unreadOnly?: boolean
}

export function listNotifications(query: NotificationQuery): Promise<ApiResult<Paged<AppNotification>>> {
  const p = new URLSearchParams()
  p.set('page', String(query.page))
  p.set('pageSize', String(query.pageSize))
  if (query.unreadOnly) p.set('unreadOnly', 'true')
  return api.get<Paged<AppNotification>>(`/notifications?${p.toString()}`)
}

export function unreadCount(): Promise<ApiResult<number>> {
  return api.get<number>('/notifications/unread-count')
}

export function markNotificationRead(id: string): Promise<ApiResult> {
  return api.put(`/notifications/${id}/read`)
}

export function markAllNotificationsRead(): Promise<ApiResult> {
  return api.put('/notifications/read-all')
}

export function deleteNotification(id: string): Promise<ApiResult> {
  return api.delete(`/notifications/${id}`)
}
