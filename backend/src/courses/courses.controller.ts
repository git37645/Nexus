import { Response, NextFunction } from 'express'
import { z } from 'zod'
import * as coursesService from './courses.service'
import { AuthRequest } from '../common/types'

const createCourseSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(20).toUpperCase(),
  description: z.string().max(2000).optional(),
  semester: z.string().max(20).optional(),
  year: z.number().int().optional(),
})

export async function createCourse(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createCourseSchema.parse(req.body)
    const course = await coursesService.createCourse(req.user!.id, data)
    res.status(201).json({ success: true, data: course })
  } catch (err) {
    next(err)
  }
}

export async function getCourses(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const courses = await coursesService.getCourses(req.user!.id, req.user!.role)
    res.json({ success: true, data: courses })
  } catch (err) {
    next(err)
  }
}

export async function getCourse(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const course = await coursesService.getCourseById(req.params.id, req.user!.id)
    res.json({ success: true, data: course })
  } catch (err) {
    next(err)
  }
}

export async function updateCourse(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createCourseSchema.partial().parse(req.body)
    const course = await coursesService.updateCourse(req.params.id, req.user!.id, data)
    res.json({ success: true, data: course })
  } catch (err) {
    next(err)
  }
}

export async function addMember(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId } = z.object({ userId: z.string() }).parse(req.body)
    const member = await coursesService.addMember(req.params.id, req.user!.id, userId)
    res.status(201).json({ success: true, data: member })
  } catch (err) {
    next(err)
  }
}

export async function removeMember(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await coursesService.removeMember(req.params.id, req.user!.id, req.params.userId)
    res.json({ success: true, message: 'Member removed' })
  } catch (err) {
    next(err)
  }
}
