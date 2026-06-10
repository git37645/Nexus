import { Response, NextFunction } from 'express'
import { z } from 'zod'
import * as assignmentsService from './assignments.service'
import { AuthRequest } from '../common/types'

const createAssignmentSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  instructions: z.string().max(5000).optional(),
  deadline: z.string().datetime(),
  maxScore: z.number().positive().optional(),
  allowedFileTypes: z.array(z.string()).optional(),
  maxFileSizeMb: z.number().positive().max(100).optional(),
  allowResubmit: z.boolean().optional(),
})

export async function createAssignment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createAssignmentSchema.parse(req.body)
    const assignment = await assignmentsService.createAssignment(req.params.courseId, req.user!.id, data)
    res.status(201).json({ success: true, data: assignment })
  } catch (err) {
    next(err)
  }
}

export async function getCourseAssignments(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const assignments = await assignmentsService.getCourseAssignments(req.params.courseId, req.user!.id)
    res.json({ success: true, data: assignments })
  } catch (err) {
    next(err)
  }
}

export async function getAssignment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const assignment = await assignmentsService.getAssignmentById(req.params.id, req.user!.id)
    res.json({ success: true, data: assignment })
  } catch (err) {
    next(err)
  }
}

export async function submitAssignment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = z.object({ content: z.string().optional() }).parse(req.body)
    const files = req.files as Express.Multer.File[] | undefined
    const submission = await assignmentsService.submitAssignment(req.params.id, req.user!.id, data, files)
    res.status(201).json({ success: true, data: submission })
  } catch (err) {
    next(err)
  }
}

export async function getSubmissions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const submissions = await assignmentsService.getSubmissions(req.params.id, req.user!.id)
    res.json({ success: true, data: submissions })
  } catch (err) {
    next(err)
  }
}

export async function gradeSubmission(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = z.object({
      score: z.number().nonnegative(),
      feedback: z.string().max(2000).optional(),
    }).parse(req.body)
    const grade = await assignmentsService.gradeSubmission(req.params.submissionId, req.user!.id, data)
    res.json({ success: true, data: grade })
  } catch (err) {
    next(err)
  }
}
