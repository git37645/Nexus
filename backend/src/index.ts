import 'dotenv/config'
import express from 'express'
import http from 'http'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import { Server as SocketServer } from 'socket.io'

import { config } from './config'
import { logger } from './lib/logger'
import { initStorage } from './storage/storage.service'
import { errorHandler, notFound } from './middleware/error.middleware'
import { globalRateLimiter } from './middleware/rate-limit.middleware'
import { initSocketHandlers } from './websocket/socket.handler'

import authRouter from './auth/auth.routes'
import usersRouter from './users/users.routes'
import postsRouter from './posts/posts.routes'
import chatsRouter from './chats/chats.routes'
import coursesRouter from './courses/courses.routes'
import lecturesRouter from './lectures/lectures.routes'
import assignmentsRouter from './assignments/assignments.routes'
import notificationsRouter from './notifications/notifications.routes'
import reportsRouter from './reports/reports.routes'
import adminRouter from './admin/admin.routes'

const app = express()
const httpServer = http.createServer(app)

export const io = new SocketServer(httpServer, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
)

app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(globalRateLimiter)

app.use('/storage', express.static(path.resolve(config.storage.path)))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: config.env })
})

app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/posts', postsRouter)
app.use('/api/chats', chatsRouter)
app.use('/api/courses', coursesRouter)
app.use('/api/lectures', lecturesRouter)
app.use('/api/assignments', assignmentsRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/reports', reportsRouter)
app.use('/api/admin', adminRouter)

app.use(notFound)
app.use(errorHandler)

initStorage()
initSocketHandlers(io)

httpServer.listen(config.port, () => {
  logger.info(`🚀 Nexus API running on port ${config.port} (${config.env})`)
  logger.info(`   Frontend URL: ${config.frontendUrl}`)
})

export default app
