import * as argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { TOTP, Secret } from 'otpauth'
import * as QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'
import prisma from '../lib/prisma'
import { config } from '../config'
import { AppError } from '../middleware/error.middleware'
import { sendMail, verificationEmail, passwordResetEmail } from '../lib/email'
import { getUserStoragePath } from '../storage/storage.service'
import { logger } from '../lib/logger'
import type { RegisterInput, LoginInput } from './auth.schemas'
import { AuthUser } from '../common/types'

const ACCESS_EXPIRY_MS = 15 * 60 * 1000
const REFRESH_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000

function generateAccessToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, sessionId: user.sessionId },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'] }
  )
}

async function generateRefreshToken(userId: string, sessionId: string, family: string): Promise<string> {
  const token = crypto.randomBytes(64).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  await prisma.refreshToken.create({
    data: {
      userId,
      sessionId,
      tokenHash,
      family,
      expiresAt: new Date(Date.now() + REFRESH_EXPIRY_MS),
    },
  })

  return token
}

export async function register(input: RegisterInput, ip?: string) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new AppError(409, 'An account with this email already exists')

  const passwordHash = await argon2.hash(input.password)
  const verifyToken = crypto.randomBytes(32).toString('hex')

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      emailVerifyToken: verifyToken,
      emailVerifyExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      profile: {
        create: {
          firstName: input.firstName,
          lastName: input.lastName,
          faculty: input.faculty,
          group: input.group,
        },
      },
      privacySettings: { create: {} },
    },
    include: { profile: true },
  })

  getUserStoragePath(user.id)

  await prisma.userStorageFolder.create({
    data: {
      userId: user.id,
      path: `users/${user.id}`,
    },
  })

  const verifyLink = `${config.frontendUrl}/verify-email?token=${verifyToken}`

  if (config.isDev) {
    logger.info('═══════════════════════════════════════════════════')
    logger.info('  DEV MODE — Email verification link (no SMTP needed):')
    logger.info(`  ${verifyLink}`)
    logger.info('═══════════════════════════════════════════════════')
  }

  try {
    const emailContent = verificationEmail(input.firstName, verifyToken, config.frontendUrl)
    await sendMail({ to: input.email, ...emailContent })
  } catch (err) {
    logger.warn('Failed to send verification email (link logged above in dev mode)', { userId: user.id })
  }

  logger.info('User registered', { userId: user.id, email: input.email, ip })
  return {
    userId: user.id,
    message: 'Registration successful. Please check your email to verify your account.',
    ...(config.isDev ? { devVerifyLink: verifyLink } : {}),
  }
}

export async function login(input: LoginInput, ip?: string, userAgent?: string) {
  const isEmail = input.identifier.includes('@')

  const user = await prisma.user.findFirst({
    where: isEmail
      ? { email: input.identifier.toLowerCase() }
      : { username: input.identifier },
    include: { profile: true, twoFactorSecret: true },
  })

  if (!user) {
    await new Promise((r) => setTimeout(r, 200))
    throw new AppError(401, 'Invalid email/username or password')
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
    throw new AppError(423, `Account locked. Try again in ${minutes} minutes.`)
  }

  if (user.status === 'BLOCKED') throw new AppError(403, 'Account has been blocked.')
  if (user.status === 'FROZEN') throw new AppError(403, 'Account is frozen. Contact support.')

  const valid = await argon2.verify(user.passwordHash, input.password)
  if (!valid) {
    const attempts = user.failedLoginAttempts + 1
    const update: Parameters<typeof prisma.user.update>[0]['data'] = { failedLoginAttempts: attempts }

    if (attempts >= config.security.loginAttemptLimit) {
      update.lockedUntil = new Date(Date.now() + config.security.loginLockoutMinutes * 60 * 1000)
      update.failedLoginAttempts = 0
      logger.warn('Account locked after failed attempts', { userId: user.id, ip })
    }

    await prisma.user.update({ where: { id: user.id }, data: update })
    throw new AppError(401, 'Invalid email or password')
  }

  if (!user.emailVerified) throw new AppError(403, 'Please verify your email before logging in.')

  if (user.twoFactorSecret?.isEnabled) {
    if (!input.totpCode) {
      return { requiresTwoFactor: true }
    }
    const totp = new TOTP({ secret: Secret.fromBase32(user.twoFactorSecret.secret), issuer: config.totp.issuer })
    const delta = totp.validate({ token: input.totpCode, window: 1 })
    if (delta === null) throw new AppError(401, 'Invalid two-factor code')
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastActiveAt: new Date() },
  })

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      ipAddress: ip,
      userAgent,
      expiresAt: new Date(Date.now() + REFRESH_EXPIRY_MS),
    },
  })

  const family = uuidv4()
  const authUser: AuthUser = { id: user.id, email: user.email, role: user.role, sessionId: session.id }
  const accessToken = generateAccessToken(authUser)
  const refreshToken = await generateRefreshToken(user.id, session.id, family)

  logger.info('User logged in', { userId: user.id, ip })

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile,
    },
  }
}

export async function resendVerification(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { profile: true },
  })

  if (!user) return { message: 'If that email exists and is unverified, a new link has been sent.' }
  if (user.emailVerified) return { message: 'This email is already verified. You can log in.' }

  const verifyToken = crypto.randomBytes(32).toString('hex')
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifyToken: verifyToken,
      emailVerifyExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })

  const verifyLink = `${config.frontendUrl}/verify-email?token=${verifyToken}`

  if (config.isDev) {
    logger.info('═══════════════════════════════════════════════════')
    logger.info('  DEV MODE — Resend verification link:')
    logger.info(`  ${verifyLink}`)
    logger.info('═══════════════════════════════════════════════════')
  }

  try {
    const emailContent = verificationEmail(user.profile?.firstName ?? 'User', verifyToken, config.frontendUrl)
    await sendMail({ to: user.email, ...emailContent })
  } catch (err) {
    logger.warn('Failed to send verification email (link logged above in dev mode)', { userId: user.id })
  }

  return {
    message: 'If that email exists and is unverified, a new link has been sent.',
    ...(config.isDev ? { devVerifyLink: verifyLink } : {}),
  }
}

export async function refreshAccessToken(rawToken: string) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } })

  if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
    if (stored && !stored.isRevoked) {
      await prisma.refreshToken.updateMany({
        where: { family: stored.family },
        data: { isRevoked: true },
      })
      logger.warn('Refresh token reuse detected — family revoked', { family: stored.family })
    }
    throw new AppError(401, 'Invalid or expired refresh token')
  }

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { isRevoked: true } })

  const user = await prisma.user.findUnique({
    where: { id: stored.userId },
    include: { profile: true },
  })
  if (!user || user.status === 'BLOCKED' || user.status === 'FROZEN') {
    throw new AppError(401, 'Account unavailable')
  }

  const authUser: AuthUser = { id: user.id, email: user.email, role: user.role, sessionId: stored.sessionId ?? undefined }
  const newAccess = generateAccessToken(authUser)
  const newRefresh = await generateRefreshToken(user.id, stored.sessionId ?? '', stored.family)

  return { accessToken: newAccess, refreshToken: newRefresh }
}

export async function logout(rawToken: string) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } })
  if (stored) {
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { isRevoked: true } })
    if (stored.sessionId) {
      await prisma.session.update({ where: { id: stored.sessionId }, data: { isActive: false } })
    }
  }
}

export async function logoutAllDevices(userId: string) {
  await prisma.refreshToken.updateMany({ where: { userId }, data: { isRevoked: true } })
  await prisma.session.updateMany({ where: { userId }, data: { isActive: false } })
}

export async function verifyEmail(token: string) {
  const user = await prisma.user.findFirst({
    where: {
      emailVerifyToken: token,
      emailVerifyExpiry: { gt: new Date() },
    },
  })

  if (!user) throw new AppError(400, 'Invalid or expired verification token')

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      status: 'ACTIVE',
      emailVerifyToken: null,
      emailVerifyExpiry: null,
    },
  })

  return { message: 'Email verified successfully' }
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  })

  if (!user) return { message: 'If that email exists, a reset link has been sent.' }

  const token = crypto.randomBytes(32).toString('hex')
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: token,
      passwordResetExpiry: new Date(Date.now() + 60 * 60 * 1000),
    },
  })

  try {
    const emailContent = passwordResetEmail(user.profile?.firstName ?? 'User', token, config.frontendUrl)
    await sendMail({ to: user.email, ...emailContent })
  } catch (err) {
    logger.warn('Failed to send password reset email', { userId: user.id, err })
  }

  return { message: 'If that email exists, a reset link has been sent.' }
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiry: { gt: new Date() },
    },
  })

  if (!user) throw new AppError(400, 'Invalid or expired reset token')

  const passwordHash = await argon2.hash(newPassword)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
    },
  })

  await logoutAllDevices(user.id)

  return { message: 'Password reset successfully. Please log in with your new password.' }
}

export async function checkSetupToken(rawToken: string) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const user = await prisma.user.findFirst({
    where: {
      setupToken: tokenHash,
      setupTokenExpiry: { gt: new Date() },
      isSetupComplete: false,
    },
    select: { email: true, profile: { select: { firstName: true } } },
  })
  if (!user) throw new AppError(400, 'Invalid or expired setup link')
  return { email: user.email, firstName: user.profile?.firstName ?? '' }
}

export async function setupAdminPassword(rawToken: string, password: string) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const user = await prisma.user.findFirst({
    where: {
      setupToken: tokenHash,
      setupTokenExpiry: { gt: new Date() },
      isSetupComplete: false,
    },
  })
  if (!user) throw new AppError(400, 'Invalid or expired setup link. Please contact the system administrator.')

  const passwordHash = await argon2.hash(password)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      setupToken: null,
      setupTokenExpiry: null,
      isSetupComplete: true,
      status: 'ACTIVE',
      emailVerified: true,
    },
  })

  logger.info('Admin password set up successfully', { userId: user.id, email: user.email })
  return { message: 'Admin password created successfully. You can now log in.' }
}

export async function generateAdminSetupLink(email: string): Promise<string> {
  const rawToken = crypto.randomBytes(48).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

  await prisma.user.update({
    where: { email },
    data: {
      setupToken: tokenHash,
      setupTokenExpiry: new Date(Date.now() + 72 * 60 * 60 * 1000),
      isSetupComplete: false,
    },
  })

  const link = `${config.frontendUrl}/setup-admin?token=${rawToken}`

  if (config.isDev) {
    logger.info('══════════════════════════════════════════════════════════')
    logger.info('  ADMIN SETUP LINK (valid for 72 hours):')
    logger.info(`  ${link}`)
    logger.info('══════════════════════════════════════════════════════════')
  }

  try {
    await sendMail({
      to: email,
      subject: 'Set up your Nexus admin password',
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#1e293b">You have been granted admin access to Nexus</h2>
          <p style="color:#64748b">Click the link below to set your admin password. This link is valid for 72 hours.</p>
          <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 32px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:600">
            Set Admin Password
          </a>
          <p style="color:#94a3b8;font-size:13px">If you did not expect this email, you can safely ignore it.</p>
        </div>
      `,
    })
  } catch (err) {
    logger.warn('Could not send admin setup email (link is logged above in dev mode)', { email })
  }

  return link
}

export async function setup2FA(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } })
  if (!user) throw new AppError(404, 'User not found')

  const totp = new TOTP({
    issuer: config.totp.issuer,
    label: user.email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: new Secret({ size: 20 }),
  })

  await prisma.twoFactorSecret.upsert({
    where: { userId },
    update: { secret: totp.secret.base32, isEnabled: false },
    create: { userId, secret: totp.secret.base32, isEnabled: false },
  })

  const qrCodeUrl = await QRCode.toDataURL(totp.toString())
  return { secret: totp.secret.base32, qrCodeUrl, otpauthUrl: totp.toString() }
}

export async function enable2FA(userId: string, totpCode: string) {
  const record = await prisma.twoFactorSecret.findUnique({ where: { userId } })
  if (!record) throw new AppError(400, '2FA setup not initiated')

  const totp = new TOTP({ secret: Secret.fromBase32(record.secret), issuer: config.totp.issuer })
  const delta = totp.validate({ token: totpCode, window: 1 })
  if (delta === null) throw new AppError(400, 'Invalid TOTP code')

  const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'))

  await prisma.twoFactorSecret.update({
    where: { userId },
    data: { isEnabled: true, backupCodes },
  })

  return { backupCodes, message: '2FA enabled successfully. Save your backup codes.' }
}
