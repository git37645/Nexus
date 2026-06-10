import { Router } from 'express'
import * as lecturesController from './lectures.controller'
import { authenticate, requireRole } from '../middleware/auth.middleware'
import { uploadCourseFile } from '../middleware/upload.middleware'

const router = Router()

router.use(authenticate)

router.get('/courses/:courseId/lectures', lecturesController.getCourseLectures)
router.post('/courses/:courseId/lectures', requireRole('TEACHER', 'ADMIN', 'SUPERADMIN'), uploadCourseFile.array('files', 5), lecturesController.createLecture)
router.get('/:id', lecturesController.getLecture)
router.patch('/:id', requireRole('TEACHER', 'ADMIN', 'SUPERADMIN'), lecturesController.updateLecture)
router.delete('/:id', requireRole('TEACHER', 'ADMIN', 'SUPERADMIN'), lecturesController.deleteLecture)

export default router
