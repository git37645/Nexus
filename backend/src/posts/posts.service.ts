import prisma from '../lib/prisma'
import { AppError } from '../middleware/error.middleware'
import { getFileUrl } from '../storage/storage.service'

export async function createPost(authorId: string, data: {
  content: string
  visibility?: string
  courseId?: string
}, files?: Express.Multer.File[]) {
  const post = await prisma.post.create({
    data: {
      authorId,
      content: data.content,
      visibility: (data.visibility as any) ?? 'UNIVERSITY',
      courseId: data.courseId,
      images: files?.length
        ? {
            create: files.map((f, i) => ({
              url: getFileUrl(f.path),
              fileName: f.filename,
              fileSize: f.size,
              order: i,
            })),
          }
        : undefined,
    },
    include: {
      author: { include: { profile: true } },
      images: true,
      _count: { select: { likes: true, comments: true } },
    },
  })
  return post
}

export async function getFeed(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { isRemoved: false, visibility: 'UNIVERSITY' },
      include: {
        author: { include: { profile: true } },
        images: { orderBy: { order: 'asc' } },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { userId }, select: { id: true } },
        savedBy: { where: { userId }, select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.post.count({ where: { isRemoved: false, visibility: 'UNIVERSITY' } }),
  ])

  return {
    posts: posts.map(p => ({
      ...p,
      isLiked: p.likes.length > 0,
      isSaved: p.savedBy.length > 0,
    })),
    total,
    hasMore: skip + limit < total,
  }
}

export async function getPostById(postId: string, userId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId, isRemoved: false },
    include: {
      author: { include: { profile: true } },
      images: { orderBy: { order: 'asc' } },
      comments: {
        where: { isRemoved: false, parentId: null },
        include: {
          author: { include: { profile: true } },
          replies: {
            where: { isRemoved: false },
            include: { author: { include: { profile: true } } },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId }, select: { id: true } },
      savedBy: { where: { userId }, select: { id: true } },
    },
  })
  if (!post) throw new AppError(404, 'Post not found')
  return { ...post, isLiked: post.likes.length > 0, isSaved: post.savedBy.length > 0 }
}

export async function updatePost(postId: string, authorId: string, content: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) throw new AppError(404, 'Post not found')
  if (post.authorId !== authorId) throw new AppError(403, 'Not authorized')

  return prisma.post.update({
    where: { id: postId },
    data: { content, isEdited: true },
  })
}

export async function deletePost(postId: string, userId: string, userRole: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) throw new AppError(404, 'Post not found')
  if (post.authorId !== userId && !['ADMIN', 'SUPERADMIN'].includes(userRole)) {
    throw new AppError(403, 'Not authorized')
  }
  await prisma.post.update({ where: { id: postId }, data: { isRemoved: true, removedById: userId } })
}

export async function toggleLike(postId: string, userId: string) {
  const existing = await prisma.like.findUnique({
    where: { postId_userId: { postId, userId } },
  })

  if (existing) {
    await prisma.like.delete({ where: { postId_userId: { postId, userId } } })
    return { liked: false }
  } else {
    await prisma.like.create({ data: { postId, userId } })
    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (post && post.authorId !== userId) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'LIKE',
          title: 'New like',
          body: 'Someone liked your post',
          link: `/app/feed?post=${postId}`,
        },
      })
    }
    return { liked: true }
  }
}

export async function toggleSave(postId: string, userId: string) {
  const existing = await prisma.savedPost.findUnique({
    where: { postId_userId: { postId, userId } },
  })

  if (existing) {
    await prisma.savedPost.delete({ where: { postId_userId: { postId, userId } } })
    return { saved: false }
  } else {
    await prisma.savedPost.create({ data: { postId, userId } })
    return { saved: true }
  }
}

export async function addComment(postId: string, authorId: string, content: string, parentId?: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) throw new AppError(404, 'Post not found')

  const comment = await prisma.comment.create({
    data: { postId, authorId, content, parentId },
    include: { author: { include: { profile: true } } },
  })

  if (post.authorId !== authorId) {
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        type: 'COMMENT',
        title: 'New comment',
        body: `Someone commented on your post`,
        link: `/app/feed?post=${postId}`,
      },
    })
  }

  return comment
}

export async function deleteComment(commentId: string, userId: string, userRole: string) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } })
  if (!comment) throw new AppError(404, 'Comment not found')
  if (comment.authorId !== userId && !['ADMIN', 'SUPERADMIN'].includes(userRole)) {
    throw new AppError(403, 'Not authorized')
  }
  await prisma.comment.update({ where: { id: commentId }, data: { isRemoved: true } })
}

export async function getSavedPosts(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit
  const [saved, total] = await Promise.all([
    prisma.savedPost.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            author: { include: { profile: true } },
            images: true,
            _count: { select: { likes: true, comments: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.savedPost.count({ where: { userId } }),
  ])
  return { posts: saved.map(s => s.post), total, hasMore: skip + limit < total }
}
