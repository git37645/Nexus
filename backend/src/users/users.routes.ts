import { Router } from 'express'
import * as usersController from './users.controller'
import { authenticate } from '../middleware/auth.middleware'
import { uploadAvatar } from '../middleware/upload.middleware'

const router = Router()

router.use(authenticate)

router.get('/me', usersController.getMe)
router.patch('/me', usersController.updateProfile)
router.post('/me/avatar', uploadAvatar.single('avatar'), usersController.updateAvatar)
router.patch('/me/privacy', usersController.updatePrivacySettings)
router.get('/me/sessions', usersController.getSessions)
router.delete('/me/sessions/:sessionId', usersController.revokeSession)
router.get('/search', usersController.searchUsers)
router.get('/:id', usersController.getUserById)

export default router
