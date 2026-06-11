import fs from 'fs'
import path from 'path'
import { config } from '../config'
import { logger } from '../lib/logger'

const BASE_STORAGE = path.resolve(config.storage.path)

export function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

export function initStorage() {
  const dirs = [
    BASE_STORAGE,
    path.join(BASE_STORAGE, 'users'),
    path.join(BASE_STORAGE, 'courses'),
    path.join(BASE_STORAGE, 'system'),
    path.join(BASE_STORAGE, 'reports'),
  ]
  dirs.forEach(ensureDir)
  logger.info(`Storage initialized at ${BASE_STORAGE}`)
}

export function getUserStoragePath(userId: string): string {
  const p = path.join(BASE_STORAGE, 'users', userId)
  ensureDir(p)
  ensureDir(path.join(p, 'profile'))
  ensureDir(path.join(p, 'posts'))
  ensureDir(path.join(p, 'message_attachments'))
  ensureDir(path.join(p, 'course_files'))
  ensureDir(path.join(p, 'assignments'))
  return p
}

export function getCourseStoragePath(courseId: string): string {
  const p = path.join(BASE_STORAGE, 'courses', courseId)
  ensureDir(p)
  ensureDir(path.join(p, 'lectures'))
  ensureDir(path.join(p, 'assignments'))
  ensureDir(path.join(p, 'files'))
  return p
}

export function getFileUrl(filePath: string): string {
  const relative = path.relative(BASE_STORAGE, filePath).replace(/\\/g, '/')
  return `/storage/${relative}`
}

export function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (err) {
    logger.error('Failed to delete file', { filePath, err })
  }
}

export function getAbsolutePath(urlPath: string): string {
  const relative = urlPath.replace(/^\/storage\//, '')
  return path.join(BASE_STORAGE, relative)
}

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
]
export const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]
