import prisma from '../lib/prisma'
import { AppError } from '../middleware/error.middleware'
import { getFileUrl } from '../storage/storage.service'

async function assertCourseAccess(courseId: string, userId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) throw new AppError(404, 'Course not found')

  const isMember = await prisma.courseMember.findUnique({
    where: { courseId_userId: { courseId, userId } },
  })
  const isTeacher = course.teacherId === userId

  if (!isMember && !isTeacher) throw new AppError(403, 'Not enrolled in this course')
  return { course, isTeacher }
}

export async function createLecture(courseId: string, teacherId: string, data: {
  title: string
  description?: string
  content?: string
  order?: number
  allowComments?: boolean
}, files?: Express.Multer.File[]) {
  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) throw new AppError(404, 'Course not found')
  if (course.teacherId !== teacherId) throw new AppError(403, 'Not authorized')

  const lecture = await prisma.lecture.create({
    data: {
      courseId,
      title: data.title,
      description: data.description,
      content: data.content,
      order: data.order ?? 0,
      allowComments: data.allowComments ?? false,
      isPublished: true,
      publishedAt: new Date(),
      attachments: files?.length
        ? {
            create: files.map(f => ({
              url: getFileUrl(f.path),
              fileName: f.filename,
              fileSize: f.size,
              mimeType: f.mimetype,
              attachType: f.mimetype.startsWith('image/') ? 'image' : 'document',
            })),
          }
        : undefined,
    },
    include: { attachments: true },
  })

  const members = await prisma.courseMember.findMany({
    where: { courseId },
    select: { userId: true },
  })

  await prisma.notification.createMany({
    data: members.map(m => ({
      userId: m.userId,
      type: 'LECTURE' as const,
      title: 'New lecture published',
      body: `"${data.title}" was published in ${course.name}`,
      link: `/app/courses/${courseId}/lectures`,
    })),
  })

  return lecture
}

export async function getCourseLectures(courseId: string, userId: string) {
  await assertCourseAccess(courseId, userId)
  return prisma.lecture.findMany({
    where: { courseId, isPublished: true },
    include: { attachments: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })
}

export async function getLectureById(lectureId: string, userId: string) {
  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
    include: { attachments: true, course: true },
  })
  if (!lecture) throw new AppError(404, 'Lecture not found')
  await assertCourseAccess(lecture.courseId, userId)
  return lecture
}

export async function updateLecture(lectureId: string, teacherId: string, data: {
  title?: string
  description?: string
  content?: string
  order?: number
  allowComments?: boolean
  isPublished?: boolean
}) {
  const lecture = await prisma.lecture.findUnique({ where: { id: lectureId }, include: { course: true } })
  if (!lecture) throw new AppError(404, 'Lecture not found')
  if (lecture.course.teacherId !== teacherId) throw new AppError(403, 'Not authorized')

  return prisma.lecture.update({ where: { id: lectureId }, data })
}

export async function deleteLecture(lectureId: string, teacherId: string) {
  const lecture = await prisma.lecture.findUnique({ where: { id: lectureId }, include: { course: true } })
  if (!lecture) throw new AppError(404, 'Lecture not found')
  if (lecture.course.teacherId !== teacherId) throw new AppError(403, 'Not authorized')

  await prisma.lecture.delete({ where: { id: lectureId } })
}
