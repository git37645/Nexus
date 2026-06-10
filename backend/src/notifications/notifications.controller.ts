import { Response, NextFunction } from 'express'
import * as notificationsService from './notifications.service'
import { AuthRequest } from '../common/types'

export async function getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(String(req.query.page ?? '1'), 10)
    const result = await notificationsService.getNotifications(req.user!.id, page)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await notificationsService.markAsRead(req.params.id, req.user!.id)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await notificationsService.markAllAsRead(req.user!.id)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function deleteNotification(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await notificationsService.deleteNotification(req.params.id, req.user!.id)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}
