import prisma from '../lib/prisma'
import { AppError } from '../middleware/error.middleware'
import { getFileUrl } from '../storage/storage.service'
import { AssignmentStatus } from '@prisma/client'

export async function createAssignment(courseId: string, teacherId: string, data: {
  title: string
  description?: string
  instructions?: string
  deadline: string
  maxScore?: number
  allowedFileTypes?: string[]
  maxFileSizeMb?: number
  allowResubmit?: boolean
}) {
  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) throw new AppError(404, 'Course not found')
  if (course.teacherId !== teacherId) throw new AppError(403, 'Not authorized')

  const assignment = await prisma.assignment.create({
    data: {
      courseId,
      title: data.title,
      description: data.description,
      instructions: data.instructions,
      deadline: new Date(data.deadline),
      maxScore: data.maxScore ?? 100,
      allowedFileTypes: data.allowedFileTypes ?? [],
      maxFileSizeMb: data.maxFileSizeMb ?? 10,
      allowResubmit: data.allowResubmit ?? false,
    },
  })

  const members = await prisma.courseMember.findMany({ where: { courseId }, select: { userId: true } })
  await prisma.notification.createMany({
    data: members.map(m => ({
      userId: m.userId,
      type: 'ASSIGNMENT' as const,
      title: 'New assignment',
      body: `"${data.title}" in ${course.name} — due ${new Date(data.deadline).toLocaleDateString()}`,
      link: `/app/assignments/${assignment.id}`,
    })),
  })

  return assignment
}

export async function getCourseAssignments(courseId: string, userId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) throw new AppError(404, 'Course not found')

  const isMember = await prisma.courseMember.findUnique({
    where: { courseId_userId: { courseId, userId } },
  })
  if (!isMember && course.teacherId !== userId) throw new AppError(403, 'Access denied')

  return prisma.assignment.findMany({
    where: { courseId },
    include: {
      _count: { select: { submissions: true } },
      submissions: course.teacherId === userId
        ? { include: { student: { include: { profile: true } }, grade: true } }
        : { where: { studentId: userId }, include: { files: true, grade: true } },
    },
    orderBy: { deadline: 'asc' },
  })
}

export async function getAssignmentById(assignmentId: string, userId: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      course: true,
      attachments: true,
      submissions: {
        where: { studentId: userId },
        include: { files: true, grade: true },
      },
    },
  })
  if (!assignment) throw new AppError(404, 'Assignment not found')

  const isMember = await prisma.courseMember.findUnique({
    where: { courseId_userId: { courseId: assignment.courseId, userId } },
  })
  if (!isMember && assignment.course.teacherId !== userId) throw new AppError(403, 'Access denied')

  return assignment
}

export async function submitAssignment(
  assignmentId: string,
  studentId: string,
  data: { content?: string },
  files?: Express.Multer.File[]
) {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId }, include: { course: true } })
  if (!assignment) throw new AppError(404, 'Assignment not found')

  const isMember = await prisma.courseMember.findUnique({
    where: { courseId_userId: { courseId: assignment.courseId, userId: studentId } },
  })
  if (!isMember) throw new AppError(403, 'Not enrolled in this course')

  const existingSubmission = await prisma.assignmentSubmission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId } },
  })

  if (existingSubmission && !assignment.allowResubmit) {
    throw new AppError(409, 'Already submitted and resubmission is not allowed')
  }

  const isLate = new Date() > assignment.deadline
  const status: AssignmentStatus = isLate ? 'LATE' : 'SUBMITTED'

  const submission = await prisma.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId } },
    update: {
      content: data.content,
      status,
      submittedAt: new Date(),
      version: { increment: 1 },
    },
    create: {
      assignmentId,
      studentId,
      content: data.content,
      status,
      submittedAt: new Date(),
    },
  })

  if (files?.length) {
    await prisma.submissionFile.createMany({
      data: files.map(f => ({
        submissionId: submission.id,
        url: getFileUrl(f.path),
        fileName: f.filename,
        fileSize: f.size,
        mimeType: f.mimetype,
        version: submission.version,
      })),
    })
  }

  return submission
}

export async function gradeSubmission(submissionId: string, teacherId: string, data: {
  score: number
  feedback?: string
}) {
  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: submissionId },
    include: { assignment: { include: { course: true } } },
  })
  if (!submission) throw new AppError(404, 'Submission not found')
  if (submission.assignment.course.teacherId !== teacherId) throw new AppError(403, 'Not authorized')

  if (data.score < 0 || data.score > submission.assignment.maxScore) {
    throw new AppError(400, `Score must be between 0 and ${submission.assignment.maxScore}`)
  }

  const grade = await prisma.grade.upsert({
    where: { submissionId },
    update: { score: data.score, feedback: data.feedback, gradedById: teacherId },
    create: {
      submissionId,
      studentId: submission.studentId,
      gradedById: teacherId,
      score: data.score,
      feedback: data.feedback,
    },
  })

  await prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: { status: 'GRADED' },
  })

  await prisma.notification.create({
    data: {
      userId: submission.studentId,
      type: 'GRADE',
      title: 'Assignment graded',
      body: `Your submission for "${submission.assignment.title}" was graded: ${data.score}/${submission.assignment.maxScore}`,
      link: `/app/assignments/${submission.assignmentId}`,
    },
  })

  return grade
}

export async function getSubmissions(assignmentId: string, teacherId: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { course: true },
  })
  if (!assignment) throw new AppError(404, 'Assignment not found')
  if (assignment.course.teacherId !== teacherId) throw new AppError(403, 'Not authorized')

  return prisma.assignmentSubmission.findMany({
    where: { assignmentId },
    include: {
      student: { include: { profile: true } },
      files: true,
      grade: true,
    },
    orderBy: { submittedAt: 'asc' },
  })
}
