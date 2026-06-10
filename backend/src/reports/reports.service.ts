import prisma from '../lib/prisma'
import { AppError } from '../middleware/error.middleware'
import { ContentType, ReportType } from '@prisma/client'

export async function createReport(reporterId: string, data: {
  contentType: ContentType
  contentId: string
  reportType: ReportType
  description?: string
  targetUserId?: string
}) {
  const report = await prisma.report.create({
    data: {
      reporterId,
      targetUserId: data.targetUserId,
      contentType: data.contentType,
      contentId: data.contentId,
      reportType: data.reportType,
      description: data.description,
      postId: data.contentType === 'POST' ? data.contentId : undefined,
      commentId: data.contentType === 'COMMENT' ? data.contentId : undefined,
      messageId: data.contentType === 'MESSAGE' ? data.contentId : undefined,
    },
  })
  return report
}

export async function getAdminReports(page = 1, limit = 20, status?: string) {
  const skip = (page - 1) * limit
  const where = status ? { status: status as any } : {}

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: {
        reporter: { include: { profile: true } },
        targetUser: { include: { profile: true } },
        reviewedBy: { include: { profile: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.report.count({ where }),
  ])

  return { reports, total, hasMore: skip + limit < total }
}

export async function reviewReport(reportId: string, adminId: string, data: {
  status: 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED'
  actionTaken?: string
}) {
  const report = await prisma.report.findUnique({ where: { id: reportId } })
  if (!report) throw new AppError(404, 'Report not found')

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: data.status,
      actionTaken: data.actionTaken,
      reviewedById: adminId,
      reviewedAt: new Date(),
    },
  })

  await prisma.adminActionLog.create({
    data: {
      adminId,
      targetUserId: report.targetUserId,
      action: `REPORT_REVIEWED`,
      details: { reportId, status: data.status, actionTaken: data.actionTaken },
    },
  })

  if (report.reporterId) {
    await prisma.notification.create({
      data: {
        userId: report.reporterId,
        type: 'REPORT_REVIEWED',
        title: 'Your report has been reviewed',
        body: `Status: ${data.status}`,
        link: '/app/settings',
      },
    })
  }

  return updated
}
