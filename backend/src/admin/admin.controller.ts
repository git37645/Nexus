import { Response, NextFunction } from 'express'
import { z } from 'zod'
import * as adminService from './admin.service'
import { AuthRequest } from '../common/types'

export async function getUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(String(req.query.page ?? '1'), 10)
    const search = req.query.search as string | undefined
    const role = req.query.role as string | undefined
    const status = req.query.status as string | undefined
    const result = await adminService.getUsers(page, 20, search, role, status)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function setUserRole(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { role } = z.object({ role: z.enum(['STUDENT', 'TEACHER', 'ADMIN', 'SUPERADMIN']) }).parse(req.body)
    const user = await adminService.setUserRole(req.user!.id, req.params.userId, role as any)
    res.json({ success: true, data: user })
  } catch (err) {
    next(err)
  }
}

export async function setUserStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status, reason } = z.object({
      status: z.enum(['ACTIVE', 'FROZEN', 'BLOCKED']),
      reason: z.string().max(500).optional(),
    }).parse(req.body)
    const user = await adminService.setUserStatus(req.user!.id, req.params.userId, status as any, reason)
    res.json({ success: true, data: user })
  } catch (err) {
    next(err)
  }
}

export async function getAuditLog(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(String(req.query.page ?? '1'), 10)
    const userId = req.query.userId as string | undefined
    const result = await adminService.getAuditLog(page, 50, userId)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function getStatistics(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const stats = await adminService.getStatistics()
    res.json({ success: true, data: stats })
  } catch (err) {
    next(err)
  }
}

export async function getSecurityEvents(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(String(req.query.page ?? '1'), 10)
    const result = await adminService.getSecurityEvents(page)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}
