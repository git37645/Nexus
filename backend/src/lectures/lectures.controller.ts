import { Response, NextFunction } from 'express'
import { z } from 'zod'
import * as lecturesService from './lectures.service'
import { AuthRequest } from '../common/types'

const lectureSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  content: z.string().optional(),
  order: z.number().int().optional(),
  allowComments: z.boolean().optional(),
})

export async function createLecture(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = lectureSchema.parse(req.body)
    const files = req.files as Express.Multer.File[] | undefined
    const lecture = await lecturesService.createLecture(req.params.courseId, req.user!.id, data, files)
    res.status(201).json({ success: true, data: lecture })
  } catch (err) {
    next(err)
  }
}

export async function getCourseLectures(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const lectures = await lecturesService.getCourseLectures(req.params.courseId, req.user!.id)
    res.json({ success: true, data: lectures })
  } catch (err) {
    next(err)
  }
}

export async function getLecture(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const lecture = await lecturesService.getLectureById(req.params.id, req.user!.id)
    res.json({ success: true, data: lecture })
  } catch (err) {
    next(err)
  }
}

export async function updateLecture(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = lectureSchema.partial().parse(req.body)
    const lecture = await lecturesService.updateLecture(req.params.id, req.user!.id, data)
    res.json({ success: true, data: lecture })
  } catch (err) {
    next(err)
  }
}

export async function deleteLecture(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await lecturesService.deleteLecture(req.params.id, req.user!.id)
    res.json({ success: true, message: 'Lecture deleted' })
  } catch (err) {
    next(err)
  }
}
