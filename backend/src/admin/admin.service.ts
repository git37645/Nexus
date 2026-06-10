import prisma from '../lib/prisma'
import { AppError } from '../middleware/error.middleware'
import { AccountStatus, Role } from '@prisma/client'
import { logger } from '../lib/logger'

export async function getUsers(page = 1, limit = 20, search?: string, role?: string, status?: string) {
  const skip = (page - 1) * limit
  const where: any = {}
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { profile: { firstName: { contains: search, mode: 'insensitive' } } },
      { profile: { lastName: { contains: search, mode: 'insensitive' } } },
    ]
  }
  if (role) where.role = role
  if (status) where.status = status

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.user.count({ where }),
  ])

  return {
    users: users.map(u => {
      const { passwordHash, emailVerifyToken, passwordResetToken, ...safe } = u
      return safe
    }),
    total,
    hasMore: skip + limit < total,
  }
}

export async function setUserRole(adminId: string, targetUserId: string, role: Role) {
  const admin = await prisma.user.findUnique({ where: { id: adminId } })
  if (!admin) throw new AppError(404, 'Admin not found')

  if (role === 'SUPERADMIN' && admin.role !== 'SUPERADMIN') {
    throw new AppError(403, 'Only SuperAdmins can promote to SuperAdmin')
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } })
  if (!target) throw new AppError(404, 'User not found')

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { role },
  })

  await prisma.adminActionLog.create({
    data: {
      adminId,
      targetUserId,
      action: 'SET_ROLE',
      details: { previousRole: target.role, newRole: role },
    },
  })

  logger.info('Admin set user role', { adminId, targetUserId, role })
  return updated
}

export async function setUserStatus(adminId: string, targetUserId: string, status: AccountStatus, reason?: string) {
  const target = await prisma.user.findUnique({ where: { id: targetUserId } })
  if (!target) throw new AppError(404, 'User not found')

  const admin = await prisma.user.findUnique({ where: { id: adminId } })
  if (!admin) throw new AppError(404, 'Admin not found')

  if (target.role === 'SUPERADMIN') throw new AppError(403, 'Cannot modify SuperAdmin account')
  if (target.role === 'ADMIN' && admin.role !== 'SUPERADMIN') {
    throw new AppError(403, 'Only SuperAdmins can modify Admin accounts')
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { status },
  })

  await prisma.adminActionLog.create({
    data: {
      adminId,
      targetUserId,
      action: `SET_STATUS_${status}`,
      details: { previousStatus: target.status, newStatus: status, reason },
    },
  })

  logger.info('Admin set user status', { adminId, targetUserId, status })
  return updated
}

export async function getAuditLog(page = 1, limit = 50, userId?: string) {
  const skip = (page - 1) * limit
  const where = userId ? { adminId: userId } : {}

  const [logs, total] = await Promise.all([
    prisma.adminActionLog.findMany({
      where,
      include: {
        admin: { include: { profile: true } },
        targetUser: { include: { profile: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.adminActionLog.count({ where }),
  ])

  return { logs, total, hasMore: skip + limit < total }
}

export async function getStatistics() {
  const [
    totalUsers,
    activeUsers,
    studentCount,
    teacherCount,
    adminCount,
    totalPosts,
    totalCourses,
    pendingReports,
    totalReports,
    totalMessages,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE', lastActiveAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'TEACHER' } }),
    prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPERADMIN'] } } }),
    prisma.post.count({ where: { isRemoved: false } }),
    prisma.course.count({ where: { isActive: true } }),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.report.count(),
    prisma.message.count({ where: { isDeleted: false } }),
  ])

  return {
    totalUsers,
    activeUsers,
    byRole: { students: studentCount, teachers: teacherCount, admins: adminCount },
    totalPosts,
    totalCourses,
    pendingReports,
    totalReports,
    totalMessages,
  }
}

export async function getSecurityEvents(page = 1, limit = 50) {
  const skip = (page - 1) * limit
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { action: { in: ['LOGIN_FAILED', 'ACCOUNT_LOCKED', 'TOKEN_REUSE', 'LEGAL_REVIEW_REQUEST'] } },
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.auditLog.count({
      where: { action: { in: ['LOGIN_FAILED', 'ACCOUNT_LOCKED', 'TOKEN_REUSE', 'LEGAL_REVIEW_REQUEST'] } },
    }),
  ])
  return { logs, total, hasMore: skip + limit < total }
}
