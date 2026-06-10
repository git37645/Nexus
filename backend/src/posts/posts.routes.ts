import { Router } from 'express'
import * as postsController from './posts.controller'
import { authenticate } from '../middleware/auth.middleware'
import { uploadPostImage } from '../middleware/upload.middleware'

const router = Router()

router.use(authenticate)

router.get('/feed', postsController.getFeed)
router.get('/saved', postsController.getSaved)
router.post('/', uploadPostImage.array('images', 10), postsController.createPost)
router.get('/:id', postsController.getPost)
router.patch('/:id', postsController.updatePost)
router.delete('/:id', postsController.deletePost)
router.post('/:id/like', postsController.likePost)
router.post('/:id/save', postsController.savePost)
router.post('/:id/comments', postsController.addComment)
router.delete('/comments/:id', postsController.deleteComment)

export default router
