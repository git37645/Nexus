import { Request } from 'express'
import { Role } from '@prisma/client'

export interface AuthUser {
  id: string
  email: string
  role: Role
  sessionId?: string
}

export interface AuthRequest extends Request {
  user?: AuthUser
}

export interface PaginationQuery {
  page?: number
  limit?: number
  cursor?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}

export function paginate(page = 1, limit = 20) {
  const take = Math.min(limit, 100)
  const skip = (Math.max(page, 1) - 1) * take
  return { take, skip }
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  return {
    data,
    total,
    page,
    limit,
    hasMore: page * limit < total,
  }
}
