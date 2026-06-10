import prisma from '../lib/prisma'

export async function getNotifications(userId: string, page = 1, limit = 30) {
  const skip = (page - 1) * limit
  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ])
  return { notifications, total, unreadCount, hasMore: skip + limit < total }
}

export async function markAsRead(notificationId: string, userId: string) {
  return prisma.notification.update({
    where: { id: notificationId, userId },
    data: { isRead: true },
  })
}

export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })
}

export async function deleteNotification(notificationId: string, userId: string) {
  await prisma.notification.delete({ where: { id: notificationId, userId } })
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } })
}
