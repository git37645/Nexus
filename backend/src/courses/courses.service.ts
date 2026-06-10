import prisma from '../lib/prisma'
import { AppError } from '../middleware/error.middleware'

export async function createCourse(teacherId: string, data: {
  name: string
  code: string
  description?: string
  semester?: string
  year?: number
}) {
  const existing = await prisma.course.findUnique({ where: { code: data.code } })
  if (existing) throw new AppError(409, 'Course code already exists')

  return prisma.course.create({
    data: { ...data, teacherId },
    include: {
      teacher: { include: { profile: true } },
      _count: { select: { members: true, lectures: true, assignments: true } },
    },
  })
}

export async function getCourses(userId: string, userRole: string) {
  if (userRole === 'TEACHER') {
    return prisma.course.findMany({
      where: { OR: [{ teacherId: userId }, { members: { some: { userId } } }] },
      include: {
        teacher: { include: { profile: true } },
        _count: { select: { members: true, lectures: true, assignments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }
  return prisma.course.findMany({
    where: { members: { some: { userId } }, isActive: true },
    include: {
      teacher: { include: { profile: true } },
      _count: { select: { members: true, lectures: true, assignments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getCourseById(courseId: string, userId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      teacher: { include: { profile: true } },
      members: { include: { user: { include: { profile: true } } } },
      _count: { select: { lectures: true, assignments: true, members: true } },
    },
  })
  if (!course) throw new AppError(404, 'Course not found')

  const isMember = course.members.some(m => m.userId === userId)
  const isTeacher = course.teacherId === userId
  if (!isMember && !isTeacher) throw new AppError(403, 'Not enrolled in this course')

  return course
}

export async function updateCourse(courseId: string, teacherId: string, data: {
  name?: string
  description?: string
  semester?: string
  isActive?: boolean
}) {
  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) throw new AppError(404, 'Course not found')
  if (course.teacherId !== teacherId) throw new AppError(403, 'Not authorized')

  return prisma.course.update({ where: { id: courseId }, data })
}

export async function addMember(courseId: string, teacherId: string, userId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) throw new AppError(404, 'Course not found')
  if (course.teacherId !== teacherId) throw new AppError(403, 'Not authorized')

  const existing = await prisma.courseMember.findUnique({
    where: { courseId_userId: { courseId, userId } },
  })
  if (existing) throw new AppError(409, 'User already enrolled')

  const member = await prisma.courseMember.create({
    data: { courseId, userId },
    include: { user: { include: { profile: true } } },
  })

  await prisma.notification.create({
    data: {
      userId,
      type: 'ANNOUNCEMENT',
      title: 'Enrolled in course',
      body: `You have been added to ${course.name}`,
      link: `/app/courses/${courseId}`,
    },
  })

  return member
}

export async function removeMember(courseId: string, teacherId: string, userId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) throw new AppError(404, 'Course not found')
  if (course.teacherId !== teacherId) throw new AppError(403, 'Not authorized')

  await prisma.courseMember.delete({
    where: { courseId_userId: { courseId, userId } },
  })
}
