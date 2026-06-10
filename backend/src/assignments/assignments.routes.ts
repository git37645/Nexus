import { Router } from 'express'
import * as assignmentsController from './assignments.controller'
import { authenticate, requireRole } from '../middleware/auth.middleware'
import { uploadAssignmentSubmission } from '../middleware/upload.middleware'

const router = Router()

router.use(authenticate)

router.post('/courses/:courseId/assignments', requireRole('TEACHER', 'ADMIN', 'SUPERADMIN'), assignmentsController.createAssignment)
router.get('/courses/:courseId/assignments', assignmentsController.getCourseAssignments)
router.get('/:id', assignmentsController.getAssignment)
router.post('/:id/submit', uploadAssignmentSubmission.array('files', 5), assignmentsController.submitAssignment)
router.get('/:id/submissions', requireRole('TEACHER', 'ADMIN', 'SUPERADMIN'), assignmentsController.getSubmissions)
router.patch('/submissions/:submissionId/grade', requireRole('TEACHER', 'ADMIN', 'SUPERADMIN'), assignmentsController.gradeSubmission)

export default router
