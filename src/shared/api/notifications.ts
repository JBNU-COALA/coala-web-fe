import client from './client'

export type NotificationType = 'COMMENT' | 'INTERESTED_INFO'

export type NotificationItem = {
  id: number
  type: NotificationType
  title: string
  message: string
  linkUrl?: string | null
  read: boolean
  readAt?: string | null
  createdAt?: string | null
}

export type UnreadNotificationCountResponse = {
  count: number
}

export const notificationsApi = {
  getNotifications: () =>
    client.get<NotificationItem[]>('/api/notifications').then((response) => response.data),

  getUnreadCount: () =>
    client.get<UnreadNotificationCountResponse>('/api/notifications/unread-count').then((response) => response.data),

  markRead: (notificationId: number) =>
    client.patch<NotificationItem>(`/api/notifications/${notificationId}/read`).then((response) => response.data),

  markAllRead: () =>
    client.patch<void>('/api/notifications/read-all').then((response) => response.data),
}
