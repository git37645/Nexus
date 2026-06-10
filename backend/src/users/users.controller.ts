import { Response, NextFunction } from 'express'
import { z } from 'zod'
import * as usersService from './users.service'
import { AuthRequest } from '../common/types'

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  bio: z.string().max(300).optional(),
  faculty: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  group: z.string().max(50).optional(),
  phoneNumber: z.string().max(20).optional(),
})

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getMe(req.user!.id)
    res.json({ success: true, data: user })
  } catch (err) {
    next(err)
  }
}

export async function getUserById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getUserById(req.user!.id, req.params.id)
    res.json({ success: true, data: user })
  } catch (err) {
    next(err)
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = updateProfileSchema.parse(req.body)
    const profile = await usersService.updateProfile(req.user!.id, data)
    res.json({ success: true, data: profile })
  } catch (err) {
    next(err)
  }
}

export async function updateAvatar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
    const result = await usersService.updateAvatar(req.user!.id, req.file)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function updatePrivacySettings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const settings = await usersService.updatePrivacySettings(req.user!.id, req.body)
    res.json({ success: true, data: settings })
  } catch (err) {
    next(err)
  }
}

export async function searchUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const q = String(req.query.q ?? '').trim()
    if (q.length < 2) return res.json({ success: true, data: { users: [], total: 0 } })
    const result = await usersService.searchUsers(q, req.user!.id)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function getSessions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const sessions = await usersService.getUserSessions(req.user!.id)
    res.json({ success: true, data: sessions })
  } catch (err) {
    next(err)
  }
}

export async function revokeSession(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await usersService.revokeSession(req.user!.id, req.params.sessionId)
    res.json({ success: true, message: 'Session revoked' })
  } catch (err) {
    next(err)
  }
}
