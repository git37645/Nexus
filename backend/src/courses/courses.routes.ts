import { Router } from 'express'
import * as coursesController from './courses.controller'
import { authenticate, requireRole } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', coursesController.getCourses)
router.post('/', requireRole('TEACHER', 'ADMIN', 'SUPERADMIN'), coursesController.createCourse)
router.get('/:id', coursesController.getCourse)
router.patch('/:id', requireRole('TEACHER', 'ADMIN', 'SUPERADMIN'), coursesController.updateCourse)
router.post('/:id/members', requireRole('TEACHER', 'ADMIN', 'SUPERADMIN'), coursesController.addMember)
router.delete('/:id/members/:userId', requireRole('TEACHER', 'ADMIN', 'SUPERADMIN'), coursesController.removeMember)

export default router
