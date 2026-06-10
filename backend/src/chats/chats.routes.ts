import { Router } from 'express'
import * as chatsController from './chats.controller'
import { authenticate } from '../middleware/auth.middleware'
import { uploadMessageAttachment } from '../middleware/upload.middleware'

const router = Router()

router.use(authenticate)

router.get('/', chatsController.getMyChats)
router.post('/private', chatsController.createPrivateChat)
router.post('/group', chatsController.createGroupChat)
router.get('/:chatId/messages', chatsController.getChatMessages)
router.post('/:chatId/messages', uploadMessageAttachment.array('files', 5), chatsController.sendMessage)
router.patch('/messages/:messageId', chatsController.editMessage)
router.delete('/messages/:messageId', chatsController.deleteMessage)
router.post('/messages/:messageId/react', chatsController.addReaction)

export default router
