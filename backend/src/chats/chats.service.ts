import prisma from '../lib/prisma'
import { AppError } from '../middleware/error.middleware'
import { getFileUrl } from '../storage/storage.service'
import { io } from '../index'

export async function getOrCreatePrivateChat(userId: string, otherUserId: string) {
  const existing = await prisma.chat.findFirst({
    where: {
      type: 'PRIVATE',
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: otherUserId } } },
      ],
    },
    include: {
      members: { include: { user: { include: { profile: true } } } },
      messages: { take: 1, orderBy: { createdAt: 'desc' } },
    },
  })
  if (existing) return existing

  const other = await prisma.user.findUnique({ where: { id: otherUserId } })
  if (!other) throw new AppError(404, 'User not found')

  return prisma.chat.create({
    data: {
      type: 'PRIVATE',
      members: {
        create: [{ userId }, { userId: otherUserId }],
      },
    },
    include: {
      members: { include: { user: { include: { profile: true } } } },
      messages: { take: 1, orderBy: { createdAt: 'desc' } },
    },
  })
}

export async function createGroupChat(userId: string, data: {
  name: string
  memberIds: string[]
}) {
  const allMembers = [...new Set([userId, ...data.memberIds])]

  return prisma.chat.create({
    data: {
      type: 'GROUP',
      name: data.name,
      members: {
        create: allMembers.map((id) => ({
          userId: id,
          role: id === userId ? 'OWNER' : 'MEMBER',
        })),
      },
    },
    include: {
      members: { include: { user: { include: { profile: true } } } },
    },
  })
}

export async function getUserChats(userId: string) {
  const chats = await prisma.chat.findMany({
    where: { members: { some: { userId } } },
    include: {
      members: {
        include: { user: { include: { profile: true } } },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        include: { sender: { include: { profile: true } } },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })
  return chats
}

export async function getChatMessages(chatId: string, userId: string, page = 1, limit = 50) {
  const membership = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId } },
  })
  if (!membership) throw new AppError(403, 'Not a member of this chat')

  const skip = (page - 1) * limit
  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { chatId, isDeleted: false },
      include: {
        sender: { include: { profile: true } },
        attachments: true,
        reactions: { include: { user: { include: { profile: true } } } },
        replyTo: {
          include: { sender: { include: { profile: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.message.count({ where: { chatId, isDeleted: false } }),
  ])

  await prisma.chatMember.update({
    where: { chatId_userId: { chatId, userId } },
    data: { lastReadAt: new Date() },
  })

  return { messages: messages.reverse(), total, hasMore: skip + limit < total }
}

export async function sendMessage(
  chatId: string,
  senderId: string,
  data: { content?: string; replyToId?: string },
  files?: Express.Multer.File[]
) {
  const membership = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId: senderId } },
  })
  if (!membership) throw new AppError(403, 'Not a member of this chat')

  const message = await prisma.message.create({
    data: {
      chatId,
      senderId,
      content: data.content,
      replyToId: data.replyToId,
      attachments: files?.length
        ? {
            create: files.map((f) => ({
              url: getFileUrl(f.path),
              fileName: f.filename,
              fileSize: f.size,
              mimeType: f.mimetype,
            })),
          }
        : undefined,
    },
    include: {
      sender: { include: { profile: true } },
      attachments: true,
      replyTo: { include: { sender: { include: { profile: true } } } },
    },
  })

  await prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } })

  io.to(`chat:${chatId}`).emit('new_message', message)

  return message
}

export async function editMessage(messageId: string, userId: string, content: string) {
  const message = await prisma.message.findUnique({ where: { id: messageId } })
  if (!message) throw new AppError(404, 'Message not found')
  if (message.senderId !== userId) throw new AppError(403, 'Not authorized')

  const editWindow = 15 * 60 * 1000
  if (Date.now() - message.createdAt.getTime() > editWindow) {
    throw new AppError(400, 'Message can no longer be edited')
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { content, isEdited: true },
    include: { sender: { include: { profile: true } } },
  })

  io.to(`chat:${message.chatId}`).emit('message_edited', updated)
  return updated
}

export async function deleteMessage(messageId: string, userId: string) {
  const message = await prisma.message.findUnique({ where: { id: messageId } })
  if (!message) throw new AppError(404, 'Message not found')
  if (message.senderId !== userId) throw new AppError(403, 'Not authorized')

  await prisma.message.update({ where: { id: messageId }, data: { isDeleted: true, content: null } })
  io.to(`chat:${message.chatId}`).emit('message_deleted', { messageId })
}

export async function addReaction(messageId: string, userId: string, emoji: string) {
  const existing = await prisma.messageReaction.findUnique({
    where: { messageId_userId_emoji: { messageId, userId, emoji } },
  })

  if (existing) {
    await prisma.messageReaction.delete({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
    })
    return { removed: true }
  } else {
    const reaction = await prisma.messageReaction.create({
      data: { messageId, userId, emoji },
      include: { user: { include: { profile: true } } },
    })
    const message = await prisma.message.findUnique({ where: { id: messageId } })
    if (message) io.to(`chat:${message.chatId}`).emit('reaction_added', { messageId, reaction })
    return { added: true, reaction }
  }
}
