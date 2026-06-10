import { Response, NextFunction } from 'express'
import { z } from 'zod'
import * as reportsService from './reports.service'
import { AuthRequest } from '../common/types'

const createReportSchema = z.object({
  contentType: z.enum(['POST', 'COMMENT', 'MESSAGE', 'PROFILE', 'FILE']),
  contentId: z.string(),
  reportType: z.enum(['HARASSMENT', 'SPAM', 'ILLEGAL_CONTENT', 'THREATS', 'ACADEMIC_CHEATING', 'HATE_SPEECH', 'INAPPROPRIATE_CONTENT', 'OTHER']),
  description: z.string().max(2000).optional(),
  targetUserId: z.string().optional(),
})

export async function createReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createReportSchema.parse(req.body)
    const report = await reportsService.createReport(req.user!.id, data)
    res.status(201).json({ success: true, data: report })
  } catch (err) {
    next(err)
  }
}

export async function getAdminReports(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(String(req.query.page ?? '1'), 10)
    const status = req.query.status as string | undefined
    const result = await reportsService.getAdminReports(page, 20, status)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function reviewReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = z.object({
      status: z.enum(['UNDER_REVIEW', 'RESOLVED', 'DISMISSED']),
      actionTaken: z.string().max(500).optional(),
    }).parse(req.body)
    const report = await reportsService.reviewReport(req.params.id, req.user!.id, data)
    res.json({ success: true, data: report })
  } catch (err) {
    next(err)
  }
}
