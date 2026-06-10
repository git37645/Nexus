import { Router } from 'express'
import * as adminController from './admin.controller'
import * as reportsController from '../reports/reports.controller'
import { authenticate, requireAdmin, requireSuperAdmin } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate, requireAdmin)

router.get('/users', adminController.getUsers)
router.patch('/users/:userId/role', requireSuperAdmin, adminController.setUserRole)
router.patch('/users/:userId/status', adminController.setUserStatus)
router.get('/reports', reportsController.getAdminReports)
router.patch('/reports/:id', reportsController.reviewReport)
router.get('/audit-log', adminController.getAuditLog)
router.get('/statistics', adminController.getStatistics)
router.get('/security-events', adminController.getSecurityEvents)

export default router
