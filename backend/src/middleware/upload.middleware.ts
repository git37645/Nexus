import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { config } from '../config'
import { ensureDir } from '../storage/storage.service'
import { ALLOWED_FILE_TYPES, ALLOWED_IMAGE_TYPES } from '../storage/storage.service'
import { AuthRequest } from '../common/types'

function diskStorage(destFn: (req: AuthRequest) => string) {
  return multer.diskStorage({
    destination: (req, _file, cb) => {
      const dest = destFn(req as AuthRequest)
      ensureDir(dest)
      cb(null, dest)
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase()
      cb(null, `${uuidv4()}${ext}`)
    },
  })
}

export const uploadPostImage = multer({
  storage: diskStorage((req) =>
    path.join(config.storage.path, 'users', req.user?.id ?? 'unknown', 'posts')
  ),
  limits: { fileSize: config.storage.maxFileSizeMb * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed for posts'))
    }
  },
})

export const uploadMessageAttachment = multer({
  storage: diskStorage((req) =>
    path.join(config.storage.path, 'users', req.user?.id ?? 'unknown', 'message_attachments')
  ),
  limits: { fileSize: config.storage.maxFileSizeMb * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('File type not allowed'))
    }
  },
})

export const uploadCourseFile = multer({
  storage: diskStorage((req) =>
    path.join(config.storage.path, 'courses', req.params.courseId ?? 'unknown', 'files')
  ),
  limits: { fileSize: config.storage.maxFileSizeMb * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('File type not allowed'))
    }
  },
})

export const uploadAssignmentSubmission = multer({
  storage: diskStorage((req) =>
    path.join(config.storage.path, 'users', req.user?.id ?? 'unknown', 'assignments')
  ),
  limits: { fileSize: config.storage.maxFileSizeMb * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('File type not allowed'))
    }
  },
})

export const uploadAvatar = multer({
  storage: diskStorage((req) =>
    path.join(config.storage.path, 'users', req.user?.id ?? 'unknown', 'profile')
  ),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed for avatars'))
    }
  },
})
