import { Request, Response, NextFunction } from 'express'
import * as authService from './auth.service'
import {
  registerSchema, loginSchema, forgotPasswordSchema,
  resetPasswordSchema, verifyEmailSchema, refreshSchema,
  enable2FASchema, resendVerificationSchema, setupAdminSchema, checkSetupTokenSchema
} from './auth.schemas'
import { AuthRequest } from '../common/types'

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const input = registerSchema.parse(req.body)
    const result = await authService.register(input, req.ip)
    res.status(201).json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body)
    const result = await authService.login(input, req.ip, req.headers['user-agent'])
    res.json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = refreshSchema.parse(req.body)
    const result = await authService.refreshAccessToken(refreshToken)
    res.json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = refreshSchema.parse(req.body)
    await authService.logout(refreshToken)
    res.json({ success: true, message: 'Logged out successfully' })
  } catch (err) {
    next(err)
  }
}

export async function logoutAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' })
    await authService.logoutAllDevices(req.user.id)
    res.json({ success: true, message: 'Logged out from all devices' })
  } catch (err) {
    next(err)
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = verifyEmailSchema.parse(req.body)
    const result = await authService.verifyEmail(token)
    res.json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
}

export async function resendVerification(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = resendVerificationSchema.parse(req.body)
    const result = await authService.resendVerification(email)
    res.json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = forgotPasswordSchema.parse(req.body)
    const result = await authService.forgotPassword(email)
    res.json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body)
    const result = await authService.resetPassword(token, password)
    res.json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
}

export async function checkSetupToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = checkSetupTokenSchema.parse({ token: req.query.token })
    const result = await authService.checkSetupToken(token)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function setupAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = setupAdminSchema.parse(req.body)
    const result = await authService.setupAdminPassword(token, password)
    res.json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
}

export async function setup2FA(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' })
    const result = await authService.setup2FA(req.user.id)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function enable2FA(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' })
    const { totpCode } = enable2FASchema.parse(req.body)
    const result = await authService.enable2FA(req.user.id, totpCode)
    res.json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
}
