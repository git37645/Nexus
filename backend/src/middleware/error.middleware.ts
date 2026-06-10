import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { logger } from '../lib/logger'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function notFound(req: Request, res: Response) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` })
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    })
  }

  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {}
    for (const issue of err.issues) {
      const field = issue.path.join('.')
      if (!errors[field]) errors[field] = []
      errors[field].push(issue.message)
    }
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors,
    })
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack })
  return res.status(500).json({ success: false, message: 'Internal server error' })
}
