import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  faculty: z.string().max(100).optional(),
  group: z.string().max(50).optional(),
})

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required').trim(),
  password: z.string().min(1),
  totpCode: z.string().optional(),
})

export const resendVerificationSchema = z.object({
  email: z.string().email(),
})

export const setupAdminSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const checkSetupTokenSchema = z.object({
  token: z.string().min(1),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
})

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export const enable2FASchema = z.object({
  totpCode: z.string().length(6),
})

export const verify2FASchema = z.object({
  totpCode: z.string().length(6),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>
export type SetupAdminInput = z.infer<typeof setupAdminSchema>
