import prisma from '../lib/prisma'
import { AppError } from '../middleware/error.middleware'
import { getFileUrl } from '../storage/storage.service'
import path from 'path'

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      privacySettings: true,
      twoFactorSecret: { select: { isEnabled: true } },
    },
  })
  if (!user) throw new AppError(404, 'User not found')

  const { passwordHash, emailVerifyToken, passwordResetToken, ...safeUser } = user
  return safeUser
}

export async function getUserById(requesterId: string, targetId: string) {
  const user = await prisma.user.findUnique({
    where: { id: targetId },
    include: { profile: true, privacySettings: true },
  })
  if (!user) throw new AppError(404, 'User not found')

  const { passwordHash, emailVerifyToken, passwordResetToken, emailVerifyExpiry, passwordResetExpiry,
    failedLoginAttempts, lockedUntil, emailVerifyToken: _, ...publicUser } = user as typeof user & { emailVerifyToken: string | null }

  return publicUser
}

export async function updateProfile(userId: string, data: {
  firstName?: string
  lastName?: string
  bio?: string
  faculty?: string
  department?: string
  group?: string
  phoneNumber?: string
}) {
  const updated = await prisma.profile.update({
    where: { userId },
    data,
  })
  return updated
}

export async function updateAvatar(userId: string, file: Express.Multer.File) {
  const url = getFileUrl(file.path)
  await prisma.profile.update({
    where: { userId },
    data: { avatarUrl: url },
  })
  return { avatarUrl: url }
}

export async function updatePrivacySettings(userId: string, data: {
  profileVisibility?: string
  postVisibility?: string
  messagePermission?: string
  groupAddPermission?: string
  showOnlineStatus?: boolean
  showReadReceipts?: boolean
}) {
  const updated = await prisma.privacySettings.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  })
  return updated
}

export async function searchUsers(query: string, requesterId: string, page = 1, limit = 20) {
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: {
        AND: [
          { id: { not: requesterId } },
          { status: 'ACTIVE' },
          {
            OR: [
              { profile: { firstName: { contains: query, mode: 'insensitive' } } },
              { profile: { lastName: { contains: query, mode: 'insensitive' } } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      include: { profile: { select: { firstName: true, lastName: true, avatarUrl: true, faculty: true } } },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.user.count({
      where: {
        AND: [
          { id: { not: requesterId } },
          { status: 'ACTIVE' },
          {
            OR: [
              { profile: { firstName: { contains: query, mode: 'insensitive' } } },
              { profile: { lastName: { contains: query, mode: 'insensitive' } } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
    }),
  ])

  return { users: users.map(u => ({ id: u.id, email: u.email, role: u.role, profile: u.profile })), total }
}

export async function getUserSessions(userId: string) {
  return prisma.session.findMany({
    where: { userId, isActive: true, expiresAt: { gt: new Date() } },
    select: { id: true, deviceInfo: true, ipAddress: true, createdAt: true, lastUsedAt: true },
    orderBy: { lastUsedAt: 'desc' },
  })
}

export async function revokeSession(userId: string, sessionId: string) {
  const session = await prisma.session.findUnique({ where: { id: sessionId } })
  if (!session || session.userId !== userId) throw new AppError(404, 'Session not found')

  await prisma.session.update({ where: { id: sessionId }, data: { isActive: false } })
  await prisma.refreshToken.updateMany({ where: { sessionId }, data: { isRevoked: true } })
}
