import { Response, NextFunction } from 'express'
import { z } from 'zod'
import * as postsService from './posts.service'
import { AuthRequest } from '../common/types'

const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  visibility: z.enum(['UNIVERSITY', 'GROUP', 'COURSE', 'FOLLOWERS']).optional(),
  courseId: z.string().optional(),
})

const commentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(),
})

export async function createPost(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createPostSchema.parse(req.body)
    const files = req.files as Express.Multer.File[] | undefined
    const post = await postsService.createPost(req.user!.id, data, files)
    res.status(201).json({ success: true, data: post })
  } catch (err) {
    next(err)
  }
}

export async function getFeed(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(String(req.query.page ?? '1'), 10)
    const limit = parseInt(String(req.query.limit ?? '20'), 10)
    const result = await postsService.getFeed(req.user!.id, page, limit)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function getPost(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const post = await postsService.getPostById(req.params.id, req.user!.id)
    res.json({ success: true, data: post })
  } catch (err) {
    next(err)
  }
}

export async function updatePost(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { content } = z.object({ content: z.string().min(1).max(5000) }).parse(req.body)
    const post = await postsService.updatePost(req.params.id, req.user!.id, content)
    res.json({ success: true, data: post })
  } catch (err) {
    next(err)
  }
}

export async function deletePost(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await postsService.deletePost(req.params.id, req.user!.id, req.user!.role)
    res.json({ success: true, message: 'Post deleted' })
  } catch (err) {
    next(err)
  }
}

export async function likePost(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await postsService.toggleLike(req.params.id, req.user!.id)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function savePost(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await postsService.toggleSave(req.params.id, req.user!.id)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function addComment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { content, parentId } = commentSchema.parse(req.body)
    const comment = await postsService.addComment(req.params.id, req.user!.id, content, parentId)
    res.status(201).json({ success: true, data: comment })
  } catch (err) {
    next(err)
  }
}

export async function deleteComment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await postsService.deleteComment(req.params.id, req.user!.id, req.user!.role)
    res.json({ success: true, message: 'Comment deleted' })
  } catch (err) {
    next(err)
  }
}

export async function getSaved(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(String(req.query.page ?? '1'), 10)
    const result = await postsService.getSavedPosts(req.user!.id, page)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}
