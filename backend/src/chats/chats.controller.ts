import { Response, NextFunction } from 'express'
import { z } from 'zod'
import * as chatsService from './chats.service'
import { AuthRequest } from '../common/types'

export async function getMyChats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const chats = await chatsService.getUserChats(req.user!.id)
    res.json({ success: true, data: chats })
  } catch (err) {
    next(err)
  }
}

export async function createPrivateChat(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId } = z.object({ userId: z.string() }).parse(req.body)
    const chat = await chatsService.getOrCreatePrivateChat(req.user!.id, userId)
    res.status(201).json({ success: true, data: chat })
  } catch (err) {
    next(err)
  }
}

export async function createGroupChat(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = z.object({
      name: z.string().min(1).max(100),
      memberIds: z.array(z.string()).min(1).max(50),
    }).parse(req.body)
    const chat = await chatsService.createGroupChat(req.user!.id, data)
    res.status(201).json({ success: true, data: chat })
  } catch (err) {
    next(err)
  }
}

export async function getChatMessages(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(String(req.query.page ?? '1'), 10)
    const result = await chatsService.getChatMessages(req.params.chatId, req.user!.id, page)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = z.object({
      content: z.string().max(5000).optional(),
      replyToId: z.string().optional(),
    }).parse(req.body)
    const files = req.files as Express.Multer.File[] | undefined
    const message = await chatsService.sendMessage(req.params.chatId, req.user!.id, data, files)
    res.status(201).json({ success: true, data: message })
  } catch (err) {
    next(err)
  }
}

export async function editMessage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { content } = z.object({ content: z.string().min(1).max(5000) }).parse(req.body)
    const message = await chatsService.editMessage(req.params.messageId, req.user!.id, content)
    res.json({ success: true, data: message })
  } catch (err) {
    next(err)
  }
}

export async function deleteMessage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await chatsService.deleteMessage(req.params.messageId, req.user!.id)
    res.json({ success: true, message: 'Message deleted' })
  } catch (err) {
    next(err)
  }
}

export async function addReaction(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { emoji } = z.object({ emoji: z.string().min(1).max(10) }).parse(req.body)
    const result = await chatsService.addReaction(req.params.messageId, req.user!.id, emoji)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}
