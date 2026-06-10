import { Router } from 'express'
import * as authController from './auth.controller'
import { authenticate } from '../middleware/auth.middleware'
import { authRateLimiter } from '../middleware/rate-limit.middleware'

const router = Router()

router.post('/register', authRateLimiter, authController.register)
router.post('/login', authRateLimiter, authController.login)
router.post('/logout', authController.logout)
router.post('/logout-all', authenticate, authController.logoutAll)
router.post('/refresh', authController.refresh)
router.post('/verify-email', authController.verifyEmail)
router.post('/resend-verification', authRateLimiter, authController.resendVerification)
router.post('/forgot-password', authRateLimiter, authController.forgotPassword)
router.post('/reset-password', authController.resetPassword)
router.get('/setup-admin/check', authController.checkSetupToken)
router.post('/setup-admin', authController.setupAdmin)
router.post('/2fa/setup', authenticate, authController.setup2FA)
router.post('/2fa/enable', authenticate, authController.enable2FA)

export default router
