import { Router } from 'express'
import * as reportsController from './reports.controller'
import { authenticate, requireAdmin } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.post('/', reportsController.createReport)
router.get('/admin', requireAdmin, reportsController.getAdminReports)
router.patch('/admin/:id', requireAdmin, reportsController.reviewReport)

export default router
