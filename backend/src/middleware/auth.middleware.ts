import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { Role } from '@prisma/client'
import { config } from '../config'
import { AuthRequest, AuthUser } from '../common/types'
import prisma from '../lib/prisma'

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' })
  }

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, config.jwt.accessSecret) as AuthUser
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(authHeader.slice(7), config.jwt.accessSecret) as AuthUser
      req.user = payload
    } catch {
      // ignore — proceed without user
    }
  }
  next()
}

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' })
    }
    next()
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' })
  }
  if (req.user.role !== Role.ADMIN && req.user.role !== Role.SUPERADMIN) {
    return res.status(403).json({ success: false, message: 'Admin access required' })
  }
  next()
}

export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' })
  }
  if (req.user.role !== Role.SUPERADMIN) {
    return res.status(403).json({ success: false, message: 'SuperAdmin access required' })
  }
  next()
}

export async function requireActiveSession(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.sessionId) return next()

  const session = await prisma.session.findUnique({
    where: { id: req.user.sessionId },
  })

  if (!session || !session.isActive || session.expiresAt < new Date()) {
    return res.status(401).json({ success: false, message: 'Session expired' })
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date() },
  })

  next()
}
