import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { logger } from '../lib/logger'
import prisma from '../lib/prisma'
import { AuthUser } from '../common/types'

const onlineUsers = new Map<string, string>()

export function initSocketHandlers(io: Server) {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token as string
    if (!token) return next(new Error('Authentication required'))

    try {
      const payload = jwt.verify(token, config.jwt.accessSecret) as AuthUser
      socket.data.user = payload
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as AuthUser
    logger.debug(`Socket connected: ${user.id}`)

    onlineUsers.set(user.id, socket.id)
    socket.broadcast.emit('user_online', { userId: user.id })

    prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    }).catch(() => {})

    socket.on('join_chat', async (chatId: string) => {
      const membership = await prisma.chatMember.findUnique({
        where: { chatId_userId: { chatId, userId: user.id } },
      })
      if (membership) {
        socket.join(`chat:${chatId}`)
        logger.debug(`User ${user.id} joined chat ${chatId}`)
      }
    })

    socket.on('leave_chat', (chatId: string) => {
      socket.leave(`chat:${chatId}`)
    })

    socket.on('typing_start', (chatId: string) => {
      socket.to(`chat:${chatId}`).emit('user_typing', { userId: user.id, chatId })
    })

    socket.on('typing_stop', (chatId: string) => {
      socket.to(`chat:${chatId}`).emit('user_stopped_typing', { userId: user.id, chatId })
    })

    socket.on('mark_read', async (data: { chatId: string }) => {
      await prisma.chatMember.update({
        where: { chatId_userId: { chatId: data.chatId, userId: user.id } },
        data: { lastReadAt: new Date() },
      }).catch(() => {})
      socket.to(`chat:${data.chatId}`).emit('messages_read', { userId: user.id, chatId: data.chatId })
    })

    socket.on('disconnect', () => {
      onlineUsers.delete(user.id)
      socket.broadcast.emit('user_offline', { userId: user.id })
      logger.debug(`Socket disconnected: ${user.id}`)
    })
  })

  logger.info('WebSocket handlers initialized')
}

export function getOnlineUsers(): string[] {
  return Array.from(onlineUsers.keys())
}

export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId)
}
